export class OpenCodeParser {
    /**
     * Parse OpenCode MCP configuration from opencode.json input
     * OpenCode stores MCP servers under the "mcp" key
     */
    parseMCPConfig(input) {
        const mcpServers = [];
        const mcpConfig = input.mcp || {};
        for (const [name, serverConfig] of Object.entries(mcpConfig)) {
            // Determine server type
            const type = serverConfig.type || (serverConfig.url ? 'remote' : 'local');
            if (type === 'remote') {
                // Remote MCP server (URL-based)
                if (!serverConfig.url) {
                    console.warn(`Warning: Remote MCP server "${name}" is missing URL, skipping`);
                    continue;
                }
                mcpServers.push({
                    name,
                    type: 'remote',
                    command: '',
                    args: [],
                    url: serverConfig.url,
                    headers: serverConfig.headers
                });
            }
            else {
                // Local MCP server (command-based)
                // Handle command as array or string
                let command = '';
                let args = [];
                if (Array.isArray(serverConfig.command)) {
                    command = serverConfig.command[0] || '';
                    args = serverConfig.command.slice(1);
                }
                else if (typeof serverConfig.command === 'string') {
                    command = serverConfig.command;
                    args = serverConfig.args || [];
                }
                if (!command) {
                    console.warn(`Warning: Local MCP server "${name}" is missing command, skipping`);
                    continue;
                }
                mcpServers.push({
                    name,
                    type: 'local',
                    command,
                    args,
                    env: serverConfig.env || serverConfig.environment
                });
            }
        }
        return {
            mcpServers
        };
    }
    /**
     * Parse OpenCode agents configuration from JSON input
     */
    parseAgents(input) {
        const agents = [];
        for (const [name, agentConfig] of Object.entries(input.agents || {})) {
            agents.push({
                name,
                description: agentConfig.description,
                systemPrompt: agentConfig.system_prompt,
                tools: agentConfig.tools
            });
        }
        return {
            agents
        };
    }
    /**
     * Validate an OpenCode configuration object
     */
    validateConfig(config) {
        // Must have at least one of mcpServers or agents
        if (!config || (!config.mcpServers && !config.agents)) {
            return false;
        }
        // Validate MCP servers if present
        if (config.mcpServers) {
            if (!Array.isArray(config.mcpServers)) {
                return false;
            }
            for (const server of config.mcpServers) {
                if (!server.name || typeof server.name !== 'string') {
                    return false;
                }
                if (!server.command && !server.url) {
                    return false;
                }
            }
        }
        // Validate agents if present
        if (config.agents) {
            if (!Array.isArray(config.agents)) {
                return false;
            }
            for (const agent of config.agents) {
                if (!agent.name || typeof agent.name !== 'string') {
                    return false;
                }
                if (!agent.description || typeof agent.description !== 'string') {
                    return false;
                }
            }
        }
        return true;
    }
}
//# sourceMappingURL=opencode.parser.js.map