/**
 * Claude Scanner
 *
 * Scans Claude's single-file configuration structure.
 *
 * Directory structure:
 * ```
 * ~/.config/claude/
 * └── settings.json   # Single config file with mcpServers and agents
 * ```
 */
import type { ClaudeScanResult, ClaudeMCPServer, ClaudeAgent } from './types.js';
export declare class ClaudeScanner {
    /**
     * Scan Claude directory and extract configuration
     */
    scan(basePath: string): Promise<ClaudeScanResult>;
    /**
     * Parse MCP configuration from Claude config
     */
    parseMCPConfig(config: {
        mcpServers?: Record<string, {
            command: string;
            args?: string[];
            env?: Record<string, string>;
        }>;
    }): ClaudeMCPServer[];
    /**
     * Parse agents configuration from Claude config
     */
    parseAgents(config: {
        agents?: Record<string, {
            name?: string;
            description: string;
            system_prompt?: string;
            tools?: string[];
        }>;
    }): ClaudeAgent[];
    /**
     * Find the config file in the Claude directory
     */
    findConfigFile(basePath: string): Promise<string | undefined>;
    /**
     * Check if a path is a valid Claude directory
     */
    isClaudeDirectory(checkPath: string): Promise<boolean>;
}
//# sourceMappingURL=scanner.d.ts.map