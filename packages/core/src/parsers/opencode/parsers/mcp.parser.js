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
export class OpenCodeMCPParser {
    /**
     * Parse MCP configuration from opencode.json input
     * Handles both local (command-based) and remote (URL-based) servers
     */
    parse(input) {
        const mcpServers = [];
        // OpenCode stores MCP servers under the "mcp" key
        const mcpConfig = input.mcp || {};
        for (const [name, serverConfig] of Object.entries(mcpConfig)) {
            const server = this.parseServer(name, serverConfig);
            if (server) {
                mcpServers.push(server);
            }
        }
        return mcpServers;
    }
    /**
     * Parse a single MCP server configuration
     */
    parseServer(name, config) {
        const type = config.type || this.detectType(config);
        if (type === 'remote') {
            // Remote MCP server (URL-based)
            if (!config.url) {
                console.warn(`Warning: Remote MCP server "${name}" is missing URL, skipping`);
                return null;
            }
            return {
                name,
                type: 'remote',
                command: '', // No command for remote
                args: [],
                url: config.url,
                headers: config.headers
            };
        }
        else {
            // Local MCP server (command-based)
            // OpenCode uses "environment" instead of "env"
            const env = config.env || config.environment;
            // Handle command as array or string
            let command = '';
            let args = [];
            if (Array.isArray(config.command)) {
                // command is an array like ["npx", "-y", "package"]
                command = config.command[0] || '';
                args = config.command.slice(1);
            }
            else if (typeof config.command === 'string') {
                // command is a string
                command = config.command;
                args = config.args || [];
            }
            if (!command) {
                console.warn(`Warning: Local MCP server "${name}" is missing command, skipping`);
                return null;
            }
            return {
                name,
                type: 'local',
                command,
                args,
                env
            };
        }
    }
    /**
     * Detect server type from configuration
     */
    detectType(config) {
        if (config.url)
            return 'remote';
        if (config.type === 'remote')
            return 'remote';
        return 'local';
    }
    /**
     * Validate MCP server configuration
     */
    validateServer(name, config) {
        return !!(config.command || config.url);
    }
}
//# sourceMappingURL=mcp.parser.js.map