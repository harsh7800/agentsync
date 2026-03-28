export class OpenCodeToClaudeTranslator {
    /**
     * Translate OpenCode MCP configuration to Claude format
     */
    translateMCPConfig(openCodeConfig) {
        const mcpServers = [];
        for (const openCodeServer of openCodeConfig.mcpServers || []) {
            mcpServers.push({
                name: openCodeServer.name,
                command: openCodeServer.command,
                args: openCodeServer.args,
                env: openCodeServer.env
            });
        }
        return { mcpServers };
    }
    /**
     * Translate OpenCode agents to Claude format
     */
    translateAgents(openCodeConfig) {
        const agents = [];
        for (const openCodeAgent of openCodeConfig.agents || []) {
            agents.push({
                name: openCodeAgent.name,
                description: openCodeAgent.description,
                systemPrompt: openCodeAgent.systemPrompt,
                tools: openCodeAgent.tools
            });
        }
        return { agents };
    }
    /**
     * Translate complete OpenCode configuration to Claude
     */
    translate(openCodeConfig) {
        const result = {};
        // Translate MCP servers if present
        if (openCodeConfig.mcpServers && openCodeConfig.mcpServers.length > 0) {
            const mcpResult = this.translateMCPConfig(openCodeConfig);
            result.mcpServers = mcpResult.mcpServers;
        }
        // Translate agents if present
        if (openCodeConfig.agents && openCodeConfig.agents.length > 0) {
            const agentsResult = this.translateAgents(openCodeConfig);
            result.agents = agentsResult.agents;
        }
        return result;
    }
}
//# sourceMappingURL=opencode-to-claude.translator.js.map