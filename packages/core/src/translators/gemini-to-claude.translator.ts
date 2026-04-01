import type { GeminiConfig, GeminiMCPServer, GeminiAgent } from '../types/gemini.types.js';
import type { ClaudeConfig, ClaudeMCPServer, ClaudeAgent } from '../types/claude.types.js';

export class GeminiToClaudeTranslator {
  /**
   * Translate Gemini MCP configuration to Claude format
   */
  translateMCPConfig(geminiConfig: GeminiConfig): { mcpServers: ClaudeMCPServer[] } {
    const mcpServers: ClaudeMCPServer[] = [];

    for (const geminiServer of geminiConfig.mcpServers || []) {
      mcpServers.push({
        name: geminiServer.name,
        command: geminiServer.command,
        args: geminiServer.args || [],
        env: geminiServer.env
      });
    }

    return { mcpServers };
  }

  /**
   * Translate Gemini agents to Claude format
   */
  translateAgents(geminiConfig: GeminiConfig): { agents: ClaudeAgent[] } {
    const agents: ClaudeAgent[] = [];

    for (const geminiAgent of geminiConfig.agents || []) {
      agents.push({
        name: geminiAgent.name,
        description: geminiAgent.description,
        systemPrompt: geminiAgent.systemPrompt,
        tools: geminiAgent.tools
      });
    }

    return { agents };
  }

  /**
   * Translate complete Gemini configuration to Claude
   */
  translate(geminiConfig: GeminiConfig): ClaudeConfig {
    const result: ClaudeConfig = {};

    // Translate MCP servers if present
    if (geminiConfig.mcpServers && geminiConfig.mcpServers.length > 0) {
      const mcpResult = this.translateMCPConfig(geminiConfig);
      result.mcpServers = mcpResult.mcpServers;
    }

    // Translate agents if present
    if (geminiConfig.agents && geminiConfig.agents.length > 0) {
      const agentsResult = this.translateAgents(geminiConfig);
      result.agents = agentsResult.agents;
    }

    return result;
  }
}
