import { stat, readdir, access } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { Scanner } from './scanner.js';
import type { 
  ManualScanOptions, 
  ScanResult, 
  ValidationResult 
} from './types.js';
import { ValidationError } from './types.js';
import { isToolSupported, getSupportedTools } from './patterns.js';

/**
 * ManualScanController
 * 
 * Handles user-controlled manual scanning with custom options.
 * Extends the base Scanner with user-specific controls.
 */
export class ManualScanController {
  private scanner: Scanner;

  constructor() {
    this.scanner = new Scanner();
  }

  /**
   * Perform a scan with user-specified options
   * 
   * @param options User scan options
   * @returns Scan result
   */
  async scanWithUserOptions(options: ManualScanOptions): Promise<ScanResult> {
    // Validate options first
    const validation = this.validateScanOptions(options);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid options: ${validation.errors.join(', ')}`);
    }

    // Determine the base path based on scope
    let basePath: string;
    switch (options.scope) {
      case 'current':
        basePath = options.cwd || process.cwd();
        break;
      case 'home':
        basePath = homedir();
        break;
      case 'custom':
        if (!options.customPath) {
          throw new ValidationError('Custom path is required when scope is "custom"');
        }
        basePath = resolve(options.customPath);
        break;
      default:
        throw new ValidationError(`Invalid scope: ${options.scope}`);
    }

    // Verify the base path exists
    try {
      const stats = await stat(basePath);
      if (!stats.isDirectory()) {
        throw new ValidationError(`Path is not a directory: ${basePath}`);
      }
    } catch (error) {
      throw new ValidationError(`Cannot access directory: ${basePath}`);
    }

    // Build scan options for the base Scanner
    const scanOptions: import('./types.js').ScanOptions = {
      scope: options.scope === 'home' ? 'system' : 'local',
      depth: options.depth || 3,
      tools: options.tools,
      cwd: basePath
    };

    // If user provided include patterns, use them
    if (options.includePatterns && options.includePatterns.length > 0) {
      (scanOptions as any).patterns = options.includePatterns;
    }

    // Perform the scan
    const result = await this.scanner.scan(scanOptions);

    // Apply exclude patterns if specified
    if (options.excludePatterns && options.excludePatterns.length > 0) {
      result.agents.local = this.applyExcludePatterns(result.agents.local, options.excludePatterns);
      result.agents.system = this.applyExcludePatterns(result.agents.system, options.excludePatterns);
    }

    return result;
  }

  /**
   * Validate user-provided scan options
   * 
   * @param options Options to validate
   * @returns Validation result
   */
  validateScanOptions(options: ManualScanOptions): ValidationResult {
    const errors: string[] = [];

    // Validate scope
    if (!options.scope) {
      errors.push('Scope is required');
    } else if (!['current', 'home', 'custom'].includes(options.scope)) {
      errors.push(`Invalid scope: ${options.scope}. Must be 'current', 'home', or 'custom'`);
    }

    // Validate custom path if scope is custom
    if (options.scope === 'custom' && !options.customPath) {
      errors.push('Custom path is required when scope is "custom"');
    }

    // Validate depth
    if (options.depth !== undefined) {
      if (options.depth < 1) {
        errors.push('Depth must be at least 1');
      }
      if (options.depth > 10) {
        errors.push('Depth cannot exceed 10');
      }
    }

    // Validate tools
    if (options.tools && options.tools.length > 0) {
      for (const tool of options.tools) {
        if (!isToolSupported(tool)) {
          errors.push(`Invalid tool: ${tool}. Supported tools: ${getSupportedTools().join(', ')}`);
        }
      }
    }

    // Validate include patterns
    if (options.includePatterns) {
      for (const pattern of options.includePatterns) {
        try {
          new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        } catch {
          errors.push(`Invalid include pattern: ${pattern}`);
        }
      }
    }

    // Validate exclude patterns
    if (options.excludePatterns) {
      for (const pattern of options.excludePatterns) {
        try {
          new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        } catch {
          errors.push(`Invalid exclude pattern: ${pattern}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Suggest optimal scan depth based on directory structure
   * 
   * @param path Directory path to analyze
   * @returns Suggested depth (1-10)
   */
  async suggestScanDepth(path: string): Promise<number> {
    try {
      const maxDepth = await this.calculateDirectoryDepth(path, 0, 10);
      
      // Suggest a reasonable depth based on actual structure
      if (maxDepth <= 2) {
        return 2; // Shallow structure
      } else if (maxDepth <= 4) {
        return 3; // Medium structure
      } else if (maxDepth <= 6) {
        return 5; // Deep structure
      } else {
        return 7; // Very deep structure
      }
    } catch {
      // Default to moderate depth if we can't analyze
      return 3;
    }
  }

  /**
   * Calculate the actual depth of a directory structure
   */
  private async calculateDirectoryDepth(
    dir: string, 
    currentDepth: number, 
    maxDepth: number
  ): Promise<number> {
    if (currentDepth >= maxDepth) {
      return currentDepth;
    }

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      let deepest = currentDepth;

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subDepth = await this.calculateDirectoryDepth(
            join(dir, entry.name),
            currentDepth + 1,
            maxDepth
          );
          deepest = Math.max(deepest, subDepth);
        }
      }

      return deepest;
    } catch {
      return currentDepth;
    }
  }

  /**
   * Apply exclude patterns to filter out agents
   */
  private applyExcludePatterns(
    agents: import('./types.js').DetectedAgent[], 
    excludePatterns: string[]
  ): import('./types.js').DetectedAgent[] {
    return agents.filter(agent => {
      for (const pattern of excludePatterns) {
        const regex = new RegExp(
          pattern
            .replace(/\*\*/g, '<<<GLOBSTAR>>>')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
            .replace(/<<<GLOBSTAR>>>/g, '.*')
        );
        if (regex.test(agent.path)) {
          return false;
        }
      }
      return true;
    });
  }
}
