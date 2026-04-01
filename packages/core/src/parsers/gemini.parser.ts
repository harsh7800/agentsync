import type { 
  GeminiConfig, 
  GeminiMCPServer, 
  GeminiAgent,
  GeminiMCPConfigInput,
  GeminiAgentsConfigInput,
  GeminiAgentInput
} from '../types/gemini.types.js';

export class GeminiParser {
  /**
   * Parse Gemini MCP configuration from JSON input
   */
  parseMCPConfig(input: GeminiMCPConfigInput): GeminiConfig {
    const mcpServers: GeminiMCPServer[] = [];

    for (const [name, serverConfig] of Object.entries(input.mcpServers || {})) {
      // Validate required fields
      if (!serverConfig.command) {
        throw new Error(`MCP server "${name}" is missing required field: command`);
      }

      mcpServers.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env
      });
    }

    return {
      mcpServers
    };
  }

  /**
   * Parse Gemini agents configuration from JSON input
   */
  parseAgents(input: GeminiAgentsConfigInput): { agents: GeminiAgent[] } {
    const agents: GeminiAgent[] = [];

    for (const [name, agentConfig] of Object.entries(input.agents || {})) {
      agents.push({
        name: agentConfig.name || name,
        description: agentConfig.description,
        systemPrompt: agentConfig.system_prompt,
        model: agentConfig.model,
        tools: agentConfig.tools
      });
    }

    return { agents };
  }

  /**
   * Parse complete Gemini configuration
   */
  parseConfig(input: unknown): GeminiConfig {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid Gemini configuration: expected object');
    }

    const config = input as Record<string, unknown>;
    const result: GeminiConfig = {};

    // Parse MCP servers if present
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      const mcpInput: GeminiMCPConfigInput = {
        mcpServers: config.mcpServers as Record<string, { command: string; args?: string[]; env?: Record<string, string> }>
      };
      const mcpResult = this.parseMCPConfig(mcpInput);
      result.mcpServers = mcpResult.mcpServers;
    }

    // Parse agents if present
    if (config.agents && typeof config.agents === 'object') {
      const agentsInput: GeminiAgentsConfigInput = {
        agents: config.agents as Record<string, GeminiAgentInput>
      };
      const agentsResult = this.parseAgents(agentsInput);
      result.agents = agentsResult.agents;
    }

    // Parse default model if present
    if (config.defaultModel && typeof config.defaultModel === 'string') {
      result.defaultModel = config.defaultModel;
    }

    return result;
  }

  /**
   * Validate a Gemini configuration object
   */
  validateConfig(config: GeminiConfig): boolean {
    if (!config) {
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
        if (!server.command || typeof server.command !== 'string') {
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

  /**
   * Serialize Gemini configuration to JSON
   */
  serializeConfig(config: GeminiConfig): string {
    const output: Record<string, unknown> = {};

    if (config.mcpServers && config.mcpServers.length > 0) {
      const mcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};
      for (const server of config.mcpServers) {
        mcpServers[server.name] = {
          command: server.command,
          args: server.args || [],
          ...(server.env && { env: server.env })
        };
      }
      output.mcpServers = mcpServers;
    }

    if (config.agents && config.agents.length > 0) {
      const agents: Record<string, { description: string; system_prompt?: string; model?: string; tools?: string[] }> = {};
      for (const agent of config.agents) {
        agents[agent.name] = {
          description: agent.description,
          ...(agent.systemPrompt && { system_prompt: agent.systemPrompt }),
          ...(agent.model && { model: agent.model }),
          ...(agent.tools && { tools: agent.tools })
        };
      }
      output.agents = agents;
    }

    if (config.defaultModel) {
      output.defaultModel = config.defaultModel;
    }

    return JSON.stringify(output, null, 2);
  }
}
