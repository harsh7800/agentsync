/**
 * Claude Tool Parser
 *
 * Main parser that coordinates scanning for Claude's single-file configuration.
 */
import type { ClaudeScanResult } from './types.js';
export declare class ClaudeToolParser {
    private scanner;
    constructor();
    /**
     * Scan Claude directory and return tool model
     */
    scan(basePath: string): Promise<ClaudeScanResult>;
    /**
     * Check if a path is a valid Claude directory
     */
    isValid(path: string): Promise<boolean>;
    /**
     * Find the config file path
     */
    findConfigFile(basePath: string): Promise<string | undefined>;
}
//# sourceMappingURL=tool.parser.d.ts.map