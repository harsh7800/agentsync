export class ClaudeToOpenCodeTranslator {
    /**
     * Translate Claude MCP configuration to OpenCode format
     */
    translateMCPConfig(claudeConfig) {
        const mcpServers = [];
        for (const claudeServer of claudeConfig.mcpServers || []) {
            mcpServers.push({
                name: claudeServer.name,
                command: claudeServer.command,
                args: claudeServer.args,
                env: claudeServer.env
            });
        }
        return { mcpServers };
    }
    /**
     * Translate Claude agents to OpenCode format
     */
    translateAgents(claudeConfig) {
        const agents = [];
        for (const claudeAgent of claudeConfig.agents || []) {
            agents.push({
                name: claudeAgent.name,
                description: claudeAgent.description,
                systemPrompt: claudeAgent.systemPrompt,
                tools: claudeAgent.tools
            });
        }
        return { agents };
    }
    /**
     * Translate complete Claude configuration to OpenCode
     */
    translate(claudeConfig) {
        const result = {};
        // Translate MCP servers if present
        if (claudeConfig.mcpServers && claudeConfig.mcpServers.length > 0) {
            const mcpResult = this.translateMCPConfig(claudeConfig);
            result.mcpServers = mcpResult.mcpServers;
        }
        // Translate agents if present
        if (claudeConfig.agents && claudeConfig.agents.length > 0) {
            const agentsResult = this.translateAgents(claudeConfig);
            result.agents = agentsResult.agents;
        }
        return result;
    }
}
//# sourceMappingURL=claude-to-opencode.translator.js.map