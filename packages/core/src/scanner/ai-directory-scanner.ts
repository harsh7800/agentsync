/**
 * AI Directory Scanner
 *
 * Scans directories for OpenCode configurations using glob patterns.
 * Supports both project-level and global-level scopes.
 */

import { readdir, stat, readFile, access } from 'fs/promises';
import { join, resolve, basename, dirname } from 'path';
import { homedir } from 'os';
import { glob } from 'glob';
import * as yaml from 'js-yaml';
import type {
  ScanOptions,
  ScanResult,
  DetectedFile,
  FileType,
  AgentMetadata,
  SkillMetadata,
  ConfigMetadata,
  ScanError,
  MCPServerConfig,
} from './types.js';
import { AICrossValidator, type CrossValidationOptions } from './ai-cross-validator.js';

/**
 * Default options for scanning
 */
const DEFAULT_OPTIONS: Partial<ScanOptions> = {
  scope: 'project',
  projectPath: process.cwd(),
  globalPath: join(homedir(), '.config', 'opencode'),
  includeAgents: true,
  includeSkills: true,
  includeConfig: true,
  followSymlinks: false,
  maxDepth: 10,
};

/**
 * Tool detection patterns - scans for ALL available tools
 */
const TOOL_PATTERNS = {
  opencode: {
    name: 'opencode',
    icon: '🔵',
    agents: ['**/.opencode/agents/*.md', '**/.config/opencode/agents/*.md'],
    skills: ['**/.opencode/skills/**/SKILL.md', '**/.config/opencode/skills/**/SKILL.md'],
    configs: ['**/.opencode/opencode.json', '**/.config/opencode/opencode.json'],
  },
  claude: {
    name: 'claude',
    icon: '🟠',
    agents: ['**/.claude/agents/*.md', '**/.config/claude/agents/*.md'],
    skills: ['**/.claude/skills/**/SKILL.md', '**/.config/claude/skills/**/SKILL.md'],
    configs: ['**/.claude/settings.json', '**/.config/claude/settings.json', '**/.mcp.json'],
  },
  codex: {
    name: 'codex',
    icon: '🟢',
    agents: ['**/.codex/agents/*.md', '**/.codex/AGENTS.md'],
    skills: ['**/.codex/skills/**/SKILL.md'],
    configs: ['**/.codex/config.toml'],
  },
  cursor: {
    name: 'cursor',
    icon: '🟢',
    agents: ['**/.cursor/agents/*.md', '**/.config/cursor/agents/*.md'],
    skills: ['**/.cursor/skills/**/SKILL.md', '**/.config/cursor/skills/**/SKILL.md'],
    configs: ['**/.cursor/settings.json', '**/.config/cursor/settings.json'],
  },
  gemini: {
    name: 'gemini',
    icon: '🟣',
    agents: ['**/.gemini/agents/*.md', '**/.config/gemini/agents/*.md'],
    skills: ['**/.gemini/skills/**/SKILL.md', '**/.config/gemini/skills/**/SKILL.md'],
    configs: ['**/.gemini/config.json', '**/.config/gemini/config.json'],
  },
} as const;

type ToolName = keyof typeof TOOL_PATTERNS;

/**
 * AI Directory Scanner class
 */
export class AIDirectoryScanner {
  private options: Partial<ScanOptions>;

  constructor(options: Partial<ScanOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main scan method
   */
  async scan(options?: Partial<ScanOptions>): Promise<ScanResult> {
    const opts = { ...this.options, ...options };
    const startTime = Date.now();
    const errors: ScanError[] = [];

    try {
      const files: DetectedFile[] = [];

      // Scan project level
      if (opts.scope === 'project' || opts.scope === 'both') {
        const projectPath = opts.projectPath || process.cwd();
        try {
          await access(projectPath);
          const projectFiles = await this.scanProjectLevel(
            projectPath,
            opts.maxDepth || 10,
            errors
          );
          files.push(...projectFiles);
        } catch (error) {
          const errorCode =
            error instanceof Error && (error.message.includes('permission') || (error as NodeJS.ErrnoException).code === 'EACCES')
              ? 'PERMISSION_DENIED'
              : 'FILE_NOT_FOUND';
          errors.push({
            path: projectPath,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: errorCode,
          });
        }
      }

      // Scan global level
      if (opts.scope === 'global' || opts.scope === 'both') {
        const globalPath = opts.globalPath || join(homedir(), '.config', 'opencode');
        try {
          await access(globalPath);
          const globalFiles = await this.scanGlobalLevel(
            globalPath,
            opts.maxDepth || 10,
            errors
          );
          files.push(...globalFiles);
        } catch (error) {
          const errorCode =
            error instanceof Error && (error.message.includes('permission') || (error as NodeJS.ErrnoException).code === 'EACCES')
              ? 'PERMISSION_DENIED'
              : 'FILE_NOT_FOUND';
          errors.push({
            path: globalPath,
            error: error instanceof Error ? error.message : 'Unknown error',
            code: errorCode,
          });
        }
      }

      // Remove duplicates
      const uniqueFiles = this.deduplicateFiles(files);

      // Cross-validate files to eliminate false positives
      const validator = new AICrossValidator({
        minConfidence: 0.6,
        strictMode: false,
        validateReferences: true,
      });
      const validatedFiles = await validator.filterValidFiles(uniqueFiles);

      // Categorize files
      const agents = validatedFiles.filter((f) => f.type === 'agent');
      const skills = validatedFiles.filter((f) => f.type === 'skill');
      const configs = validatedFiles.filter((f) => f.type === 'config');
      const projectLevel = validatedFiles.filter((f) => f.scope === 'project');
      const globalLevel = validatedFiles.filter((f) => f.scope === 'global');

      const duration = Date.now() - startTime;

      return {
        files: validatedFiles,
        agents,
        skills,
        configs,
        projectLevel,
        globalLevel,
        duration,
        filesScanned: validatedFiles.length,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        files: [],
        agents: [],
        skills: [],
        configs: [],
        projectLevel: [],
        globalLevel: [],
        duration,
        filesScanned: 0,
        errors: [
          ...errors,
          {
            path: opts.projectPath || '',
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'ACCESS_ERROR',
          },
        ],
      };
    }
  }

  /**
   * Scan agents for ALL tools in a directory
   */
  async scanAgents(
    basePath: string,
    options: { scope: 'project' | 'global' }
  ): Promise<DetectedFile[]> {
    const detectedFiles: DetectedFile[] = [];

    // Scan agents for each tool
    for (const [toolName, toolConfig] of Object.entries(TOOL_PATTERNS)) {
      const patterns = options.scope === 'project' 
        ? [toolConfig.agents[0]] 
        : toolConfig.agents;

      for (const pattern of patterns) {
        const files = await this.globScan(pattern, basePath);

        for (const filePath of files) {
          try {
            const file = await this.createDetectedFile(
              filePath,
              'agent',
              options.scope,
              toolName
            );
            if (file) {
              detectedFiles.push(file);
            }
          } catch {
            // Skip invalid files
          }
        }
      }
    }

    return detectedFiles;
  }

  /**
   * Scan skills for ALL tools in a directory
   */
  async scanSkills(
    basePath: string,
    options: { scope: 'project' | 'global' }
  ): Promise<DetectedFile[]> {
    const detectedFiles: DetectedFile[] = [];

    // Scan skills for each tool
    for (const [toolName, toolConfig] of Object.entries(TOOL_PATTERNS)) {
      const patterns = options.scope === 'project' 
        ? [toolConfig.skills[0]] 
        : toolConfig.skills;

      for (const pattern of patterns) {
        const files = await this.globScan(pattern, basePath);

        for (const filePath of files) {
          try {
            const file = await this.createDetectedFile(
              filePath,
              'skill',
              options.scope,
              toolName
            );
            if (file) {
              detectedFiles.push(file);
            }
          } catch {
            // Skip invalid files
          }
        }
      }
    }

    return detectedFiles;
  }

  /**
   * Scan config files for ALL tools
   */
  async scanConfigs(basePath: string): Promise<DetectedFile[]> {
    const detectedFiles: DetectedFile[] = [];

    // Scan configs for each tool
    for (const [toolName, toolConfig] of Object.entries(TOOL_PATTERNS)) {
      for (const pattern of toolConfig.configs) {
        const files = await this.globScan(pattern, basePath);

        for (const filePath of files) {
          try {
            const scope = this.categorizeByScope(filePath);
            const file = await this.createDetectedFile(filePath, 'config', scope, toolName);
            if (file) {
              detectedFiles.push(file);
            }
          } catch {
            // Skip invalid files
          }
        }
      }
    }

    return detectedFiles;
  }

  /**
   * Scan project-level files
   */
  async scanProjectLevel(
    projectPath: string,
    maxDepth: number = 10,
    errors?: ScanError[]
  ): Promise<DetectedFile[]> {
    const files: DetectedFile[] = [];

    try {
      // Scan agents
      const agents = await this.scanAgents(projectPath, { scope: 'project' });
      files.push(...agents);

      // Scan skills
      const skills = await this.scanSkills(projectPath, { scope: 'project' });
      files.push(...skills);

      // Scan configs
      const configs = await this.scanConfigs(projectPath);
      files.push(...configs);
    } catch (error) {
      if (errors) {
        errors.push({
          path: projectPath,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'ACCESS_ERROR',
        });
      }
    }

    return files;
  }

  /**
   * Scan global-level files
   */
  async scanGlobalLevel(
    globalPath: string,
    maxDepth: number = 10,
    errors?: ScanError[]
  ): Promise<DetectedFile[]> {
    const files: DetectedFile[] = [];

    try {
      // Check if global directory exists
      await access(globalPath);

      // Scan agents
      const agents = await this.scanAgents(globalPath, { scope: 'global' });
      files.push(...agents);

      // Scan skills
      const skills = await this.scanSkills(globalPath, { scope: 'global' });
      files.push(...skills);

      // Scan configs
      const configs = await this.scanConfigs(globalPath);
      files.push(...configs);
    } catch (error) {
      if (errors) {
        const errorCode =
          error instanceof Error && error.message.includes('permission')
            ? 'PERMISSION_DENIED'
            : 'FILE_NOT_FOUND';
        errors.push({
          path: globalPath,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: errorCode,
        });
      }
    }

    return files;
  }

  /**
   * Categorize file path by scope
   */
  categorizeByScope(filePath: string): 'project' | 'global' {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check for global indicators
    if (
      normalizedPath.includes('.config/opencode') ||
      normalizedPath.includes('.config/claude') ||
      normalizedPath.includes('.codex') ||
      normalizedPath.includes('~/.config') ||
      normalizedPath.match(/\/Users\/[^/]+\/.config/) ||
      normalizedPath.match(/\/home\/[^/]+\/.config/) ||
      normalizedPath.match(/\/Users\/[^/]+\/.codex/) ||
      normalizedPath.match(/\/home\/[^/]+\/.codex/)
    ) {
      return 'global';
    }

    // Default to project
    return 'project';
  }

  /**
   * Glob scan for files
   */
  async globScan(pattern: string, cwd: string): Promise<string[]> {
    const files = await glob(pattern, {
      cwd,
      absolute: true,
      dot: true,
      follow: this.options.followSymlinks || false,
    });
    return files;
  }

  /**
   * Validate a file
   */
  async validateFile(filePath: string, type: FileType): Promise<boolean> {
    try {
      if (type === 'agent') {
        const metadata = await this.parseAgentFile(filePath);
        return metadata !== null;
      }

      if (type === 'config') {
        const metadata = await this.parseConfigFile(filePath);
        return metadata !== null;
      }

      // For skills, just check file exists and is readable
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse agent file for metadata
   */
  async parseAgentFile(filePath: string): Promise<AgentMetadata | null> {
    try {
      const content = await readFile(filePath, 'utf-8');

      // Check for YAML frontmatter
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
      if (!frontmatterMatch) {
        return null;
      }

      const frontmatter = frontmatterMatch[1];
      const parsed = yaml.load(frontmatter) as Record<string, unknown>;

      if (!parsed || typeof parsed !== 'object' || !parsed.name) {
        return null;
      }

      return {
        name: String(parsed.name),
        description: parsed.description ? String(parsed.description) : undefined,
        model: parsed.model ? String(parsed.model) : undefined,
        systemPrompt: parsed.systemPrompt
          ? String(parsed.systemPrompt)
          : undefined,
        tools: Array.isArray(parsed.tools)
          ? parsed.tools.map(String)
          : undefined,
        mcpServers: Array.isArray(parsed.mcpServers)
          ? parsed.mcpServers.map(String)
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse config file for metadata
   */
  async parseConfigFile(filePath: string): Promise<ConfigMetadata | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const mcpServers: MCPServerConfig[] = [];

      // Handle mcpServers array format (test expectation)
      if (parsed.mcpServers && Array.isArray(parsed.mcpServers)) {
        for (const server of parsed.mcpServers) {
          if (server && typeof server === 'object') {
            mcpServers.push({
              name: server.name ? String(server.name) : '',
              command: server.command ? String(server.command) : '',
              args: Array.isArray(server.args) ? server.args.map(String) : undefined,
              env: server.env && typeof server.env === 'object'
                ? Object.fromEntries(
                    Object.entries(server.env).map(([k, v]) => [k, String(v)])
                  )
                : undefined,
            });
          }
        }
      }

      // Handle mcp object format (actual opencode.json format)
      if (parsed.mcp && typeof parsed.mcp === 'object') {
        for (const [name, config] of Object.entries(parsed.mcp)) {
          if (config && typeof config === 'object') {
            const cfg = config as Record<string, unknown>;
            mcpServers.push({
              name,
              command: cfg.command ? String(cfg.command) : '',
              args: Array.isArray(cfg.args) ? cfg.args.map(String) : 
                    cfg.command && Array.isArray((cfg.command as string[]).slice(1)) ? 
                    (cfg.command as string[]).slice(1) : undefined,
              env:
                cfg.environment && typeof cfg.environment === 'object'
                  ? Object.fromEntries(
                      Object.entries(cfg.environment).map(([k, v]) => [
                        k,
                        String(v),
                      ])
                    )
                  : undefined,
            });
          }
        }
      }

      return {
        mcpServers,
        defaultModel: parsed.defaultModel
          ? String(parsed.defaultModel)
          : undefined,
        settings: parsed.settings || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Create a DetectedFile from path
   */
  private async createDetectedFile(
    filePath: string,
    type: FileType,
    scope: 'project' | 'global',
    toolName?: string
  ): Promise<DetectedFile | null> {
    try {
      const stats = await stat(filePath);

      if (!stats.isFile()) {
        return null;
      }

      let metadata: AgentMetadata | SkillMetadata | ConfigMetadata | undefined;

      if (type === 'agent') {
        const agentMeta = await this.parseAgentFile(filePath);
        if (agentMeta) {
          metadata = agentMeta;
        }
      } else if (type === 'config') {
        const configMeta = await this.parseConfigFile(filePath);
        if (configMeta) {
          metadata = configMeta;
        }
      }

      // For skills, extract name from directory
      if (type === 'skill') {
        const skillName = basename(dirname(filePath));
        metadata = { name: skillName };
      }

      // Detect tool from path if not provided
      const detectedTool = toolName || this.detectToolFromPath(filePath);

      return {
        id: this.generateFileId(filePath),
        path: filePath,
        name: basename(filePath),
        type,
        scope,
        tool: detectedTool,
        size: stats.size,
        lastModified: stats.mtime,
        metadata,
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect tool name from file path
   */
  private detectToolFromPath(filePath: string): string {
    if (filePath.includes('.opencode') || filePath.includes('/opencode/')) return 'opencode';
    if (filePath.includes('.codex') || filePath.includes('/codex/')) return 'codex';
    if (filePath.includes('.claude') || filePath.includes('/claude/')) return 'claude';
    if (filePath.includes('.cursor') || filePath.includes('/cursor/')) return 'cursor';
    if (filePath.includes('.gemini') || filePath.includes('/gemini/')) return 'gemini';
    if (filePath.includes('.mcp.json')) return 'claude';
    return 'unknown';
  }

  /**
   * Remove duplicate files
   */
  private deduplicateFiles(files: DetectedFile[]): DetectedFile[] {
    const seen = new Set<string>();
    return files.filter((file) => {
      if (seen.has(file.path)) {
        return false;
      }
      seen.add(file.path);
      return true;
    });
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(filePath: string): string {
    return Buffer.from(filePath).toString('base64').slice(0, 16);
  }
}

// Export types
export * from './types.js';
