import type { GeminiConfig, GeminiMCPServer, GeminiAgent } from '../types/gemini.types.js';
import type { OpenCodeConfig, OpenCodeMCPServer, OpenCodeAgent } from '../types/opencode.types.js';

export class GeminiToOpenCodeTranslator {
  /**
   * Translate Gemini MCP configuration to OpenCode format
   */
  translateMCPConfig(geminiConfig: GeminiConfig): { mcpServers: OpenCodeMCPServer[] } {
    const mcpServers: OpenCodeMCPServer[] = [];

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
   * Translate Gemini agents to OpenCode format
   */
  translateAgents(geminiConfig: GeminiConfig): { agents: OpenCodeAgent[] } {
    const agents: OpenCodeAgent[] = [];

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
   * Translate complete Gemini configuration to OpenCode
   */
  translate(geminiConfig: GeminiConfig): OpenCodeConfig {
    const result: OpenCodeConfig = {};

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
