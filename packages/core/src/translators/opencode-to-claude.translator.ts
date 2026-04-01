import type { OpenCodeConfig, OpenCodeSkill } from '../types/opencode.types.js';
import type { ClaudeConfig, ClaudeMCPServer, ClaudeAgent, ClaudeSkill } from '../types/claude.types.js';

export class OpenCodeToClaudeTranslator {
  /**
   * Translate OpenCode MCP configuration to Claude format
   */
  translateMCPConfig(openCodeConfig: OpenCodeConfig): { mcpServers: ClaudeMCPServer[] } {
    const mcpServers: ClaudeMCPServer[] = [];

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
  translateAgents(openCodeConfig: OpenCodeConfig): { agents: ClaudeAgent[] } {
    const agents: ClaudeAgent[] = [];

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
   * Translate OpenCode skills to Claude format
   */
  translateSkills(openCodeConfig: OpenCodeConfig): { skills: ClaudeSkill[] } {
    const skills: ClaudeSkill[] = [];

    for (const openCodeSkill of openCodeConfig.skills || []) {
      skills.push(this.translateSkill(openCodeSkill));
    }

    return { skills };
  }

  /**
   * Translate a single OpenCode skill to Claude format
   */
  private translateSkill(openCodeSkill: OpenCodeSkill): ClaudeSkill {
    return {
      name: openCodeSkill.name,
      description: openCodeSkill.description,
      instructions: openCodeSkill.instructions,
      enabled: openCodeSkill.enabled,
      content: openCodeSkill.content || openCodeSkill.instructions || ''
    };
  }

  /**
   * Translate complete OpenCode configuration to Claude
   */
  translate(openCodeConfig: OpenCodeConfig): ClaudeConfig {
    const result: ClaudeConfig = {};

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

    // Translate skills if present
    if (openCodeConfig.skills && openCodeConfig.skills.length > 0) {
      const skillsResult = this.translateSkills(openCodeConfig);
      result.skills = skillsResult.skills;
    }

    return result;
  }
}
