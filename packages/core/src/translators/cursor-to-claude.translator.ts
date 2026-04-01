/**
 * Cursor to Claude Translator
 * Translates Cursor IDE configuration to Claude Code format
 */

import type { CursorConfig, CursorMCPServer, CursorAgent } from '../types/cursor.types.js';
import type { ClaudeConfig, ClaudeMCPServer, ClaudeAgent } from '../types/claude.types.js';

export class CursorToClaudeTranslator {
  /**
   * Translate Cursor MCP configuration to Claude format
   */
  translateMCPConfig(cursorConfig: CursorConfig): { mcpServers: ClaudeMCPServer[] } {
    const mcpServers: ClaudeMCPServer[] = [];

    for (const cursorServer of cursorConfig.mcpServers || []) {
      mcpServers.push({
        name: cursorServer.name,
        command: cursorServer.command,
        args: cursorServer.args || [],
        env: cursorServer.env
      });
    }

    return { mcpServers };
  }

  /**
   * Translate Cursor agents to Claude format
   */
  translateAgents(cursorConfig: CursorConfig): { agents: ClaudeAgent[] } {
    const agents: ClaudeAgent[] = [];

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
   * Translate complete Cursor configuration to Claude
   */
  translate(cursorConfig: CursorConfig): ClaudeConfig {
    const result: ClaudeConfig = {};

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
   * Convert Cursor cursorRules to Claude system prompt
   * Claude doesn't have a direct equivalent, so we create a system prompt
   */
  convertCursorRulesToSystemPrompt(cursorRules: string[]): string | undefined {
    if (!cursorRules || cursorRules.length === 0) {
      return undefined;
    }

    return cursorRules.join('\n\n');
  }
}
