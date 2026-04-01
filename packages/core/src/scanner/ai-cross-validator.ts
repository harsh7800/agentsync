/**
 * AI Cross-Validation Module
 * 
 * Provides advanced validation to eliminate false positives in scan results.
 * Uses content analysis, heuristic scoring, and cross-reference validation.
 */

import { readFile, access } from 'fs/promises';
import type { DetectedFile, FileType, AgentMetadata, SkillMetadata, ConfigMetadata } from './types.js';

/**
 * Validation confidence score (0-1)
 */
export type ConfidenceScore = number;

/**
 * Cross-validation result
 */
export interface CrossValidationResult {
  /** Whether the file passed cross-validation */
  valid: boolean;
  /** Confidence score (0-1) */
  confidence: ConfidenceScore;
  /** Validation details */
  details: ValidationDetail[];
  /** Extracted metadata if validation passed */
  metadata?: AgentMetadata | SkillMetadata | ConfigMetadata;
}

/**
 * Individual validation check detail
 */
export interface ValidationDetail {
  /** Check name */
  check: string;
  /** Whether this check passed */
  passed: boolean;
  /** Score contribution (-1 to 1) */
  score: number;
  /** Optional message */
  message?: string;
}

/**
 * Options for cross-validation
 */
export interface CrossValidationOptions {
  /** Minimum confidence threshold (0-1, default: 0.7) */
  minConfidence?: number;
  /** Enable strict mode (requires all checks to pass) */
  strictMode?: boolean;
  /** Validate related files exist */
  validateReferences?: boolean;
  /** Maximum file size to read (bytes, default: 1MB) */
  maxFileSize?: number;
}

/**
 * AI Cross-Validator class
 * 
 * Provides multi-layer validation to eliminate false positives:
 * 1. Structural validation - checks file has expected structure
 * 2. Content validation - verifies content matches expected patterns
 * 3. Heuristic scoring - assigns confidence based on multiple factors
 * 4. Cross-reference validation - checks related files exist
 */
export class AICrossValidator {
  private options: Required<CrossValidationOptions>;

  constructor(options: CrossValidationOptions = {}) {
    this.options = {
      minConfidence: 0.7,
      strictMode: false,
      validateReferences: true,
      maxFileSize: 1024 * 1024, // 1MB
      ...options,
    };
  }

  /**
   * Cross-validate a detected file
   * 
   * @param file - The detected file to validate
   * @returns Cross-validation result with confidence score
   */
  async validate(file: DetectedFile): Promise<CrossValidationResult> {
    const details: ValidationDetail[] = [];

    try {
      // Check 1: File exists and is readable
      const existsCheck = await this.validateFileExists(file.path);
      details.push(existsCheck);

      if (!existsCheck.passed) {
        return this.createResult(false, 0, details);
      }

      // Check 2: File size is reasonable
      const sizeCheck = await this.validateFileSize(file.path);
      details.push(sizeCheck);

      // Check 3: Type-specific validation
      const contentCheck = await this.validateContent(file);
      details.push(contentCheck);

      // Check 4: Structural validation
      const structuralCheck = await this.validateStructure(file);
      details.push(structuralCheck);

      // Check 5: Cross-reference validation (if enabled)
      if (this.options.validateReferences) {
        const referenceCheck = await this.validateReferences(file);
        details.push(referenceCheck);
      }

      // Calculate confidence score
      const confidence = this.calculateConfidence(details);
      const valid = this.isValid(confidence, details);

      return this.createResult(valid, confidence, details, file.metadata);
    } catch (error) {
      details.push({
        check: 'error',
        passed: false,
        score: -1,
        message: error instanceof Error ? error.message : 'Unknown validation error',
      });
      return this.createResult(false, 0, details);
    }
  }

  /**
   * Validate multiple files in batch
   * 
   * @param files - Array of detected files
   * @returns Array of validation results
   */
  async validateBatch(files: DetectedFile[]): Promise<CrossValidationResult[]> {
    const results = await Promise.all(files.map(file => this.validate(file)));
    return results;
  }

  /**
   * Filter files to only those that pass validation
   * 
   * @param files - Array of detected files
   * @returns Filtered array of valid files
   */
  async filterValidFiles(files: DetectedFile[]): Promise<DetectedFile[]> {
    const results = await this.validateBatch(files);
    return files.filter((_, index) => results[index].valid);
  }

  /**
   * Validate file exists and is readable
   */
  private async validateFileExists(filePath: string): Promise<ValidationDetail> {
    try {
      await access(filePath);
      return {
        check: 'file_exists',
        passed: true,
        score: 0.2,
      };
    } catch {
      return {
        check: 'file_exists',
        passed: false,
        score: -1,
        message: 'File does not exist or is not accessible',
      };
    }
  }

  /**
   * Validate file size is reasonable
   */
  private async validateFileSize(filePath: string): Promise<ValidationDetail> {
    try {
      const content = await readFile(filePath);
      const size = content.length;

      if (size === 0) {
        return {
          check: 'file_size',
          passed: false,
          score: -0.5,
          message: 'File is empty',
        };
      }

      if (size > this.options.maxFileSize) {
        return {
          check: 'file_size',
          passed: true,
          score: 0.1,
          message: `File is very large (${(size / 1024 / 1024).toFixed(1)}MB)`,
        };
      }

      return {
        check: 'file_size',
        passed: true,
        score: 0.2,
      };
    } catch {
      return {
        check: 'file_size',
        passed: false,
        score: -0.3,
        message: 'Could not read file size',
      };
    }
  }

  /**
   * Validate file content matches expected patterns
   */
  private async validateContent(file: DetectedFile): Promise<ValidationDetail> {
    try {
      const content = await readFile(file.path, 'utf-8');

      switch (file.type) {
        case 'agent':
          return this.validateAgentContent(content);
        case 'skill':
          return this.validateSkillContent(content);
        case 'config':
          return this.validateConfigContent(content);
        default:
          return {
            check: 'content',
            passed: false,
            score: -0.5,
            message: `Unknown file type: ${file.type}`,
          };
      }
    } catch {
      return {
        check: 'content',
        passed: false,
        score: -0.5,
        message: 'Could not read file content',
      };
    }
  }

  /**
   * Validate agent file content
   */
  private validateAgentContent(content: string): ValidationDetail {
    // Check for YAML frontmatter
    const hasFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(content);
    if (!hasFrontmatter) {
      return {
        check: 'content',
        passed: false,
        score: -0.8,
        message: 'Missing YAML frontmatter',
      };
    }

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!frontmatterMatch) {
      return {
        check: 'content',
        passed: false,
        score: -0.5,
        message: 'Could not parse frontmatter',
      };
    }

    const frontmatter = frontmatterMatch[1];

    // Check for required fields
    const hasName = /name\s*:\s*.+/.test(frontmatter);
    const hasDescription = /description\s*:/.test(frontmatter);

    if (!hasName) {
      return {
        check: 'content',
        passed: false,
        score: -0.7,
        message: 'Missing required field: name',
      };
    }

    // Calculate score based on fields present
    let score = 0.3; // Base score for having frontmatter
    if (hasName) score += 0.3;
    if (hasDescription) score += 0.2;

    // Check for optional fields (bonus)
    if (/model\s*:/.test(frontmatter)) score += 0.1;
    if (/tools\s*:/.test(frontmatter)) score += 0.1;

    return {
      check: 'content',
      passed: score >= 0.5,
      score,
      message: hasDescription ? 'Valid agent file' : 'Valid but missing description',
    };
  }

  /**
   * Validate skill file content
   */
  private validateSkillContent(content: string): ValidationDetail {
    // Check for markdown structure
    const hasHeading = /^#\s+.+$/m.test(content);
    const hasContent = content.length > 50;

    if (!hasHeading) {
      return {
        check: 'content',
        passed: false,
        score: -0.5,
        message: 'Missing markdown heading',
      };
    }

    if (!hasContent) {
      return {
        check: 'content',
        passed: false,
        score: -0.3,
        message: 'File content too short',
      };
    }

    let score = 0.4;
    if (hasHeading) score += 0.3;
    if (hasContent) score += 0.3;

    // Check for skill-specific sections
    if (/##\s*(description|usage|tools)/i.test(content)) {
      score += 0.2;
    }

    return {
      check: 'content',
      passed: true,
      score: Math.min(score, 1.0),
      message: 'Valid skill file',
    };
  }

  /**
   * Validate config file content
   */
  private validateConfigContent(content: string): ValidationDetail {
    try {
      const parsed = JSON.parse(content);

      if (!parsed || typeof parsed !== 'object') {
        return {
          check: 'content',
          passed: false,
          score: -0.5,
          message: 'Invalid JSON structure',
        };
      }

      let score = 0.4; // Base score for valid JSON

      // Check for MCP servers
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        score += 0.3;
      }

      // Check for other OpenCode-specific fields
      if (parsed.defaultModel) score += 0.1;
      if (parsed.agents || parsed.skills) score += 0.2;

      return {
        check: 'content',
        passed: score >= 0.5,
        score: Math.min(score, 1.0),
        message: score >= 0.5 ? 'Valid config file' : 'Valid JSON but missing OpenCode fields',
      };
    } catch {
      return {
        check: 'content',
        passed: false,
        score: -0.8,
        message: 'Invalid JSON',
      };
    }
  }

  /**
   * Validate file structure
   */
  private async validateStructure(file: DetectedFile): Promise<ValidationDetail> {
    // Check file path matches expected patterns
    const normalizedPath = file.path.replace(/\\/g, '/');

    switch (file.type) {
      case 'agent':
        // Agents should be in agents/ directory
        if (!normalizedPath.includes('/agents/')) {
          return {
            check: 'structure',
            passed: false,
            score: -0.3,
            message: 'Agent file not in agents/ directory',
          };
        }
        break;

      case 'skill':
        // Skills should be in skills/ directory and named SKILL.md
        if (!normalizedPath.includes('/skills/')) {
          return {
            check: 'structure',
            passed: false,
            score: -0.3,
            message: 'Skill file not in skills/ directory',
          };
        }
        if (!normalizedPath.endsWith('/SKILL.md')) {
          return {
            check: 'structure',
            passed: true,
            score: 0.1,
            message: 'Skill file not named SKILL.md',
          };
        }
        break;

      case 'config':
        // Config should be named opencode.json
        if (!normalizedPath.endsWith('/opencode.json')) {
          return {
            check: 'structure',
            passed: true,
            score: 0.1,
            message: 'Config file not named opencode.json',
          };
        }
        break;
    }

    return {
      check: 'structure',
      passed: true,
      score: 0.2,
      message: 'Valid file structure',
    };
  }

  /**
   * Validate cross-references (related files exist)
   */
  private async validateReferences(file: DetectedFile): Promise<ValidationDetail> {
    try {
      const normalizedPath = file.path.replace(/\\/g, '/');
      const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));

      // Check if parent .opencode directory exists
      if (normalizedPath.includes('/.opencode/')) {
        const openCodeDir = normalizedPath.split('/.opencode/')[0] + '/.opencode';
        try {
          await access(openCodeDir);
        } catch {
          return {
            check: 'references',
            passed: false,
            score: -0.4,
            message: 'Parent .opencode directory does not exist',
          };
        }
      }

      // For configs, check if they reference valid agents/skills
      if (file.type === 'config' && file.metadata) {
        const metadata = file.metadata as ConfigMetadata;
        if (metadata.mcpServers && Object.keys(metadata.mcpServers).length > 0) {
          return {
            check: 'references',
            passed: true,
            score: 0.3,
            message: 'Config references MCP servers',
          };
        }
      }

      return {
        check: 'references',
        passed: true,
        score: 0.2,
        message: 'Valid references',
      };
    } catch {
      return {
        check: 'references',
        passed: true,
        score: 0.1,
        message: 'Could not validate references',
      };
    }
  }

  /**
   * Calculate overall confidence score from validation details
   */
  private calculateConfidence(details: ValidationDetail[]): ConfidenceScore {
    const totalScore = details.reduce((sum, detail) => sum + detail.score, 0);
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, totalScore + 0.5));
  }

  /**
   * Determine if file is valid based on confidence and checks
   */
  private isValid(confidence: ConfidenceScore, details: ValidationDetail[]): boolean {
    // In strict mode, all checks must pass
    if (this.options.strictMode) {
      return details.every(d => d.passed);
    }

    // Otherwise, use confidence threshold
    return confidence >= this.options.minConfidence;
  }

  /**
   * Create validation result object
   */
  private createResult(
    valid: boolean,
    confidence: ConfidenceScore,
    details: ValidationDetail[],
    metadata?: AgentMetadata | SkillMetadata | ConfigMetadata
  ): CrossValidationResult {
    return {
      valid,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      details,
      metadata,
    };
  }
}

/**
 * Convenience function for one-off validation
 * 
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export async function crossValidate(
  file: DetectedFile,
  options?: CrossValidationOptions
): Promise<CrossValidationResult> {
  const validator = new AICrossValidator(options);
  return validator.validate(file);
}

/**
 * Convenience function for batch validation
 * 
 * @param files - Files to validate
 * @param options - Validation options
 * @returns Array of validation results
 */
export async function crossValidateBatch(
  files: DetectedFile[],
  options?: CrossValidationOptions
): Promise<CrossValidationResult[]> {
  const validator = new AICrossValidator(options);
  return validator.validateBatch(files);
}

/**
 * Filter files to only those passing cross-validation
 * 
 * @param files - Files to filter
 * @param options - Validation options
 * @returns Filtered array of valid files
 */
export async function filterValidFiles(
  files: DetectedFile[],
  options?: CrossValidationOptions
): Promise<DetectedFile[]> {
  const validator = new AICrossValidator(options);
  return validator.filterValidFiles(files);
}
