/**
 * OpenCode Tool Parser
 * 
 * Main parser that coordinates scanning and provides a unified interface
 * for converting OpenCode tool models.
 */

import { OpenCodeScanner } from './scanner.js';
import type { OpenCodeToolModel, OpenCodeScanResult } from './types.js';

export class OpenCodeToolParser {
  private scanner: OpenCodeScanner;

  constructor() {
    this.scanner = new OpenCodeScanner();
  }

  /**
   * Scan OpenCode directory and return tool model
   */
  async scan(basePath: string): Promise<OpenCodeScanResult> {
    return this.scanner.scan(basePath);
  }

  /**
   * Check if a path is a valid OpenCode directory
   */
  async isValid(path: string): Promise<boolean> {
    return this.scanner.isOpenCodeDirectory(path);
  }
}
