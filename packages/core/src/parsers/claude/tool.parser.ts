/**
 * Claude Tool Parser
 * 
 * Main parser that coordinates scanning for Claude's single-file configuration.
 */

import { ClaudeScanner } from './scanner.js';
import type { ClaudeScanResult } from './types.js';

export class ClaudeToolParser {
  private scanner: ClaudeScanner;

  constructor() {
    this.scanner = new ClaudeScanner();
  }

  /**
   * Scan Claude directory and return tool model
   */
  async scan(basePath: string): Promise<ClaudeScanResult> {
    return this.scanner.scan(basePath);
  }

  /**
   * Check if a path is a valid Claude directory
   */
  async isValid(path: string): Promise<boolean> {
    return this.scanner.isClaudeDirectory(path);
  }

  /**
   * Find the config file path
   */
  async findConfigFile(basePath: string): Promise<string | undefined> {
    return this.scanner.findConfigFile(basePath);
  }
}
