/**
 * Codex Tool Parser
 *
 * Main parser that coordinates scanning and provides a unified interface
 * for the Codex tool configuration structure.
 */

import { CodexScanner } from './scanner.js';
import type { CodexToolModel, CodexScanResult } from './types.js';

export class CodexToolParser {
  private scanner: CodexScanner;

  constructor() {
    this.scanner = new CodexScanner();
  }

  /**
   * Scan Codex directory and return tool model
   */
  async scan(basePath: string, projectPath?: string): Promise<CodexScanResult> {
    return this.scanner.scan(basePath, projectPath);
  }

  /**
   * Check if a path is a valid Codex directory
   */
  async isValid(path: string): Promise<boolean> {
    return this.scanner.isCodexDirectory(path);
  }
}
