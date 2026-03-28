import type { 
  ClaudeConfig, 
  ClaudeMCPServer, 
  ClaudeAgent,
  ClaudeMCPConfigInput 
} from '../types/claude.types.js';

export interface ClaudeAgentInput {
  name?: string;
  description: string;
  system_prompt?: string;
  tools?: string[];
}

export interface ClaudeAgentsConfigInput {
  agents: Record<string, ClaudeAgentInput>;
}

export class ClaudeParser {
  /**
   * Parse Claude MCP configuration from JSON input
   */
  parseMCPConfig(input: ClaudeMCPConfigInput): ClaudeConfig {
    const mcpServers: ClaudeMCPServer[] = [];

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
   * Parse Claude agents configuration from JSON input
   */
  parseAgents(input: ClaudeAgentsConfigInput): { agents: ClaudeAgent[] } {
    const agents: ClaudeAgent[] = [];

    for (const [name, agentConfig] of Object.entries(input.agents || {})) {
      agents.push({
        name: agentConfig.name || name,
        description: agentConfig.description,
        systemPrompt: agentConfig.system_prompt,
        tools: agentConfig.tools
      });
    }

    return { agents };
  }

  /**
   * Validate a Claude configuration object
   */
  validateConfig(config: ClaudeConfig): boolean {
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
        if (!Array.isArray(server.args)) {
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

    // Must have at least one of mcpServers or agents
    if (!config.mcpServers && !config.agents) {
      return false;
    }

    return true;
  }
}