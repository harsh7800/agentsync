/**
 * OpenCode Tool Parser
 *
 * Main parser that coordinates scanning and provides a unified interface
 * for converting OpenCode tool models.
 */
import type { OpenCodeScanResult } from './types.js';
export declare class OpenCodeToolParser {
    private scanner;
    constructor();
    /**
     * Scan OpenCode directory and return tool model
     */
    scan(basePath: string): Promise<OpenCodeScanResult>;
    /**
     * Check if a path is a valid OpenCode directory
     */
    isValid(path: string): Promise<boolean>;
}
//# sourceMappingURL=tool.parser.d.ts.map