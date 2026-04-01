import type { 
  CursorConfig, 
  CursorMCPServer, 
  CursorAgent,
  CursorMCPConfigInput,
  CursorAgentsConfigInput,
  CursorAgentInput,
  CursorRules
} from '../types/cursor.types.js';

export class CursorParser {
  /**
   * Parse Cursor MCP configuration from JSON input
   */
  parseMCPConfig(input: CursorMCPConfigInput): CursorConfig {
    const mcpServers: CursorMCPServer[] = [];

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
   * Parse Cursor agents configuration from JSON input
   */
  parseAgents(input: CursorAgentsConfigInput): { agents: CursorAgent[] } {
    const agents: CursorAgent[] = [];

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
   * Parse .cursorrules file content
   */
  parseCursorRules(content: string): CursorRules {
    const rules: string[] = [];
    
    // Split by newlines and filter out empty lines and comments
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        rules.push(trimmed);
      }
    }

    return { rules };
  }

  /**
   * Parse complete Cursor configuration
   */
  parseConfig(input: unknown): CursorConfig {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid Cursor configuration: expected object');
    }

    const config = input as Record<string, unknown>;
    const result: CursorConfig = {};

    // Parse MCP servers if present
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      const mcpInput: CursorMCPConfigInput = {
        mcpServers: config.mcpServers as Record<string, { command: string; args?: string[]; env?: Record<string, string> }>
      };
      const mcpResult = this.parseMCPConfig(mcpInput);
      result.mcpServers = mcpResult.mcpServers;
    }

    // Parse agents if present
    if (config.agents && typeof config.agents === 'object') {
      const agentsInput: CursorAgentsConfigInput = {
        agents: config.agents as Record<string, CursorAgentInput>
      };
      const agentsResult = this.parseAgents(agentsInput);
      result.agents = agentsResult.agents;
    }

    // Parse cursor rules if present (string path or embedded)
    if (config.cursorRules && typeof config.cursorRules === 'object') {
      result.cursorRules = config.cursorRules as CursorRules;
    }

    // Parse autoComplete if present
    if (typeof config.autoComplete === 'boolean') {
      result.autoComplete = config.autoComplete;
    }

    // Parse tabSize if present
    if (typeof config.tabSize === 'number') {
      result.tabSize = config.tabSize;
    }

    return result;
  }

  /**
   * Validate a Cursor configuration object
   */
  validateConfig(config: CursorConfig): boolean {
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
   * Serialize Cursor configuration to JSON
   */
  serializeConfig(config: CursorConfig): string {
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
      const agents: Record<string, { description: string; system_prompt?: string; tools?: string[] }> = {};
      for (const agent of config.agents) {
        agents[agent.name] = {
          description: agent.description,
          ...(agent.systemPrompt && { system_prompt: agent.systemPrompt }),
          ...(agent.tools && { tools: agent.tools })
        };
      }
      output.agents = agents;
    }

    if (config.cursorRules && config.cursorRules.rules.length > 0) {
      output.cursorRules = config.cursorRules;
    }

    if (typeof config.autoComplete === 'boolean') {
      output.autoComplete = config.autoComplete;
    }

    if (typeof config.tabSize === 'number') {
      output.tabSize = config.tabSize;
    }

    return JSON.stringify(output, null, 2);
  }

  /**
   * Serialize cursor rules to .cursorrules file format
   */
  serializeCursorRules(rules: CursorRules): string {
    return rules.rules.join('\n');
  }
}
