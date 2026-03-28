/**
 * MCP Server Parser for OpenCode
 *
 * Parses MCP server configurations from opencode.json.
 * Format:
 * {
 *   "mcp": {
 *     "server-name": {
 *       "type": "local" | "remote",
 *       "command": ["npx", "-y", "@server/package"],
 *       "environment": {},
 *       "url": "https://...",
 *       "headers": {}
 *     }
 *   }
 * }
 *
 * Supports:
 * - Local servers: { type: "local", command: [...], environment: {...} }
 * - Remote servers: { type: "remote", url: "...", headers: {...} }
 */
import type { OpenCodeMCPServer, OpenCodeMCPInput, OpenCodeMCPConfigInput } from '../types.js';
export declare class OpenCodeMCPParser {
    /**
     * Parse MCP configuration from opencode.json input
     * Handles both local (command-based) and remote (URL-based) servers
     */
    parse(input: OpenCodeMCPConfigInput): OpenCodeMCPServer[];
    /**
     * Parse a single MCP server configuration
     */
    private parseServer;
    /**
     * Detect server type from configuration
     */
    private detectType;
    /**
     * Validate MCP server configuration
     */
    validateServer(name: string, config: OpenCodeMCPInput): boolean;
}
//# sourceMappingURL=mcp.parser.d.ts.map