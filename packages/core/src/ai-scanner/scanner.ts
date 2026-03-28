import { readdir, stat, readFile, access } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import { homedir } from 'os';
import type { 
  ScanOptions, 
  ScanResult, 
  DetectedAgent, 
  CategorizedAgents 
} from './types.js';
import { ValidationError, PatternError } from './types.js';
import { getToolPatterns, isToolSupported, DEFAULT_TOOL_PATTERNS } from './patterns.js';
import { Categorizer } from './categorizer.js';
import { ContentAnalyzer } from './analyzer.js';

/**
 * Smart Agent Scanner
 * 
 * Detects AI agent configurations using glob/grep pattern matching.
 * Supports both manual and AI-assisted scanning modes.
 */
export class Scanner {
  private categorizer: Categorizer;
  private analyzer: ContentAnalyzer;

  constructor() {
    this.categorizer = new Categorizer();
    this.analyzer = new ContentAnalyzer();
  }

  /**
   * Main scan entry point
   * 
   * @param options Scan options
   * @returns Scan result with categorized agents
   */
  async scan(options: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let filesScanned = 0;

    // Validate options
    this.validateOptions(options);

    const cwd = options.cwd || process.cwd();
    const depth = options.depth ?? 3;
    const tools = options.tools || DEFAULT_TOOL_PATTERNS.map(p => p.tool);
    const scope = options.scope || 'local';

    const allAgents: DetectedAgent[] = [];

    try {
      // Determine scan paths based on scope
      const scanPaths = this.getScanPaths(scope, cwd);

      // Scan each path
      for (const basePath of scanPaths) {
        try {
          const agents = await this.scanPath(basePath, tools, depth, cwd);
          allAgents.push(...agents);
          filesScanned += agents.length;
        } catch (error) {
          const errorMsg = `Error scanning ${basePath}: ${error instanceof Error ? error.message : error}`;
          errors.push(errorMsg);
        }
      }

      // Apply custom patterns if provided
      if (options.patterns && options.patterns.length > 0) {
        for (const pattern of options.patterns) {
          try {
            const patternAgents = await this.scanWithPattern(pattern, cwd, depth);
            allAgents.push(...patternAgents);
          } catch (error) {
            errors.push(`Pattern error ${pattern}: ${error instanceof Error ? error.message : error}`);
          }
        }
      }

    } catch (error) {
      errors.push(`Scan failed: ${error instanceof Error ? error.message : error}`);
    }

    // Categorize agents
    const categorized = this.categorizer.categorize(allAgents);

    return {
      agents: categorized,
      duration: Date.now() - startTime,
      filesScanned,
      errors
    };
  }

  /**
   * Detect agents for a specific tool in given paths
   * 
   * @param tool Tool identifier
   * @param paths Paths to search
   * @returns Array of detected agents
   */
  async detectAgents(tool: string, paths: string[]): Promise<DetectedAgent[]> {
    if (!isToolSupported(tool)) {
      throw new ValidationError(`Invalid tool: ${tool}. Supported tools: ${DEFAULT_TOOL_PATTERNS.map(p => p.tool).join(', ')}`);
    }

    const agents: DetectedAgent[] = [];
    const toolPatterns = getToolPatterns(tool);
    
    if (!toolPatterns) {
      return agents;
    }

    for (const searchPath of paths) {
      try {
        const pathStat = await stat(searchPath);
        
        if (pathStat.isDirectory()) {
          // Search directory for matching files
          const files = await this.findFilesInDir(searchPath, toolPatterns.patterns, 3);
          
          for (const file of files) {
            const agent = await this.createAgentFromFile(file, tool);
            if (agent) {
              agents.push(agent);
            }
          }
        } else if (pathStat.isFile()) {
          // Single file
          const agent = await this.createAgentFromFile(searchPath, tool);
          if (agent) {
            agents.push(agent);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not access ${searchPath}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return agents;
  }

  /**
   * Validate scan options
   */
  private validateOptions(options: ScanOptions): void {
    if (options.tools && options.tools.length > 0) {
      for (const tool of options.tools) {
        if (!isToolSupported(tool)) {
          throw new ValidationError(`Invalid tool: ${tool}. Supported tools: ${DEFAULT_TOOL_PATTERNS.map(p => p.tool).join(', ')}`);
        }
      }
    }

    if (options.patterns) {
      for (const pattern of options.patterns) {
        try {
          // Basic pattern validation
          new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        } catch {
          throw new PatternError(`Invalid glob pattern: ${pattern}`);
        }
      }
    }

    if (options.depth !== undefined && options.depth < 0) {
      throw new ValidationError('Depth must be a non-negative number');
    }
  }

  /**
   * Get paths to scan based on scope
   */
  private getScanPaths(scope: string, cwd: string): string[] {
    const paths: string[] = [];

    if (scope === 'local' || scope === 'both') {
      paths.push(cwd);
    }

    if (scope === 'system' || scope === 'both') {
      // Add system-wide config directories
      paths.push(
        join(homedir(), '.config'),
        join(homedir(), '.cursor')
      );
    }

    return paths;
  }

  /**
   * Scan a specific path for agents
   */
  private async scanPath(
    basePath: string, 
    tools: string[], 
    maxDepth: number,
    cwd: string
  ): Promise<DetectedAgent[]> {
    const agents: DetectedAgent[] = [];

    for (const tool of tools) {
      const toolPatterns = getToolPatterns(tool);
      if (!toolPatterns) continue;

      try {
        const files = await this.findFilesInDir(basePath, toolPatterns.patterns, maxDepth);
        
        for (const file of files) {
          const agent = await this.createAgentFromFile(file, tool);
          if (agent) {
            agents.push(agent);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error scanning ${basePath} for ${tool}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return agents;
  }

  /**
   * Find files matching patterns in directory
   */
  private async findFilesInDir(
    dir: string, 
    patterns: string[], 
    maxDepth: number,
    currentDepth = 0
  ): Promise<string[]> {
    const files: string[] = [];

    if (currentDepth > maxDepth) {
      return files;
    }

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip node_modules and hidden directories (except .tool directories)
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          
          // Recurse into subdirectories
          const subFiles = await this.findFilesInDir(fullPath, patterns, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file matches any pattern
          if (this.matchesPatterns(fullPath, patterns)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Permission denied or other errors - skip this directory
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        console.warn(`⚠️  Could not read directory ${dir}: ${error instanceof Error ? error.message : error}`);
      }
    }

    return files;
  }

  /**
   * Check if a file path matches any of the glob patterns
   * Handles both Unix (/) and Windows (\) path separators
   */
  private matchesPatterns(filePath: string, patterns: string[]): boolean {
    // Normalize file path to use forward slashes for cross-platform matching
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of patterns) {
      // Simple glob matching - convert glob to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '<<<GLOBSTAR>>>')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')
        .replace(/<<<GLOBSTAR>>>/g, '.*');
      
      try {
        const regex = new RegExp(regexPattern, 'i'); // Case-insensitive for cross-platform
        if (regex.test(normalizedPath)) {
          return true;
        }
      } catch {
        // Invalid regex, skip this pattern
        continue;
      }
    }
    return false;
  }

  /**
   * Scan with a custom pattern
   */
  private async scanWithPattern(pattern: string, cwd: string, maxDepth: number): Promise<DetectedAgent[]> {
    const files = await this.findFilesInDir(cwd, [pattern], maxDepth);
    const agents: DetectedAgent[] = [];

    for (const file of files) {
      // Try to determine tool from file content
      const agentInfo = await this.analyzer.analyze(file);
      if (agentInfo) {
        const agent = await this.createAgentFromFile(file, agentInfo.tool);
        if (agent) {
          agents.push(agent);
        }
      }
    }

    return agents;
  }

  /**
   * Create a DetectedAgent from a file
   */
  private async createAgentFromFile(filePath: string, tool: string): Promise<DetectedAgent | null> {
    try {
      const fileStat = await stat(filePath);
      const fileName = basename(filePath);
      
      // Get agent info from content
      const agentInfo = await this.analyzer.analyze(filePath);
      
      // Determine category based on path
      const category = this.categorizer.getCategoryFromPath(filePath);

      return {
        id: `${tool}-${fileName}-${Date.now()}`,
        name: agentInfo?.name || fileName,
        tool,
        path: filePath,
        type: agentInfo?.type || 'config',
        category,
        size: fileStat.size,
        lastModified: fileStat.mtime,
        metadata: agentInfo?.metadata || {}
      };
    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }
}

// Re-export types
export * from './types.js';
