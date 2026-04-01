/**
 * Cursor to OpenCode Translator
 * Translates Cursor IDE configuration to OpenCode format
 */

import type { CursorConfig, CursorMCPServer, CursorAgent } from '../types/cursor.types.js';
import type { OpenCodeConfig, OpenCodeMCPServer, OpenCodeAgent } from '../types/opencode.types.js';

export class CursorToOpenCodeTranslator {
  /**
   * Translate Cursor MCP configuration to OpenCode format
   */
  translateMCPConfig(cursorConfig: CursorConfig): { mcpServers: OpenCodeMCPServer[] } {
    const mcpServers: OpenCodeMCPServer[] = [];

    for (const cursorServer of cursorConfig.mcpServers || []) {
      mcpServers.push({
        name: cursorServer.name,
        type: 'local',
        command: cursorServer.command,
        args: cursorServer.args || [],
        env: cursorServer.env
      });
    }

    return { mcpServers };
  }

  /**
   * Translate Cursor agents to OpenCode format
   */
  translateAgents(cursorConfig: CursorConfig): { agents: OpenCodeAgent[] } {
    const agents: OpenCodeAgent[] = [];

    for (const cursorAgent of cursorConfig.agents || []) {
      agents.push({
        name: cursorAgent.name,
        description: cursorAgent.description,
        systemPrompt: cursorAgent.systemPrompt,
        tools: cursorAgent.tools
      });
    }

    return { agents };
  }

  /**
   * Translate complete Cursor configuration to OpenCode
   */
  translate(cursorConfig: CursorConfig): OpenCodeConfig {
    const result: OpenCodeConfig = {};

    // Translate MCP servers if present
    if (cursorConfig.mcpServers && cursorConfig.mcpServers.length > 0) {
      const mcpResult = this.translateMCPConfig(cursorConfig);
      result.mcpServers = mcpResult.mcpServers;
    }

    // Translate agents if present
    if (cursorConfig.agents && cursorConfig.agents.length > 0) {
      const agentsResult = this.translateAgents(cursorConfig);
      result.agents = agentsResult.agents;
    }

    return result;
  }

  /**
   * Convert Cursor cursorRules to OpenCode agent rules
   * Creates a special "cursor-rules" agent with the rules as system prompt
   */
  convertCursorRulesToAgent(name: string, cursorRules: string[]): OpenCodeAgent {
    return {
      name: name || 'cursor-rules',
      description: 'Cursor IDE rules converted to OpenCode agent',
      systemPrompt: cursorRules.join('\n\n')
    };
  }
}
