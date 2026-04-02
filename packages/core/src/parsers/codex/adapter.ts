/**
 * Codex Adapter
 *
 * Converts Common Schema → Codex Tool Model
 *
 * This adapter takes the canonical Common Schema format and converts it
 * back to Codex's specific directory structure and file formats.
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP } from '../../common-schema/types.js';
import type { CodexToolModel, CodexMCPServer, CodexAgent, CodexSkill, CodexSettings } from './types.js';
import type { ToolAdapter } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class CodexAdapter implements ToolAdapter<CodexToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'codex';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert Common Schema to Codex Tool Model
   */
  fromCommonSchema(schema: CommonSchema): CodexToolModel {
    const model: CodexToolModel = {
      tool: 'codex',
      rootPath: '', // Will be set by writer
      mcpServers: [],
      agents: [],
      skills: [],
      discovered: {
        agentCount: 0,
        skillCount: 0,
        mcpServerCount: 0,
        promptCount: 0,
        sessionCount: 0
      }
    };

    // Adapt MCP servers
    for (const mcp of schema.mcps) {
      if (this.shouldIncludeMCP(mcp)) {
        model.mcpServers!.push(this.adaptMCP(mcp));
      }
    }

    // Adapt Agents
    for (const agent of schema.agents) {
      model.agents!.push(this.adaptAgent(agent));
    }

    // Adapt Skills
    for (const skill of schema.skills) {
      model.skills!.push(this.adaptSkill(skill));
    }

    // Apply global settings from metadata if present
    if ((schema.metadata as Record<string, unknown>).codexSettings) {
      model.settings = this.adaptSettings(
        (schema.metadata as Record<string, unknown>).codexSettings as Record<string, unknown>
      );
    }

    // Update discovered counts
    model.discovered = {
      agentCount: model.agents!.length,
      skillCount: model.skills!.length,
      mcpServerCount: model.mcpServers!.length,
      promptCount: 0,
      sessionCount: 0
    };

    return model;
  }

  /**
   * Check if an MCP should be included in Codex output
   */
  private shouldIncludeMCP(mcp: CommonMCP): boolean {
    return true;
  }

  /**
   * Adapt Common MCP to Codex MCP format
   */
  private adaptMCP(mcp: CommonMCP): CodexMCPServer {
    const codexExt = mcp.metadata?.extensions?.codex || {};

    let command = mcp.command || '';
    if (mcp.args && mcp.args.length > 0) {
      command = `${command} ${mcp.args.join(' ')}`.trim();
    }

    if (codexExt.originalCommand && typeof codexExt.originalCommand === 'string') {
      command = codexExt.originalCommand;
    }

    return {
      name: mcp.name,
      type: mcp.type === 'sse' ? 'remote' : (mcp.type || 'local'),
      command,
      args: mcp.args,
      env: mcp.env,
      url: mcp.url,
      headers: mcp.headers
    };
  }

  /**
   * Adapt Common Agent to Codex Agent format
   */
  private adaptAgent(agent: CommonAgent): CodexAgent {
    const codexExt = agent.metadata.extensions?.codex || {};
    const tools: string[] = (codexExt.originalTools as string[]) || [];

    return {
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      tools: tools.length > 0 ? tools : undefined
    };
  }

  /**
   * Adapt Common Skill to Codex Skill format
   */
  private adaptSkill(skill: CommonSkill): CodexSkill {
    const codexExt = skill.metadata?.extensions?.codex || {};

    return {
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      enabled: skill.enabled,
      content: skill.content || '',
      path: (codexExt.originalPath as string) || `skills/${this.sanitizeName(skill.name)}/SKILL.md`,
      scripts: codexExt.scripts as string[] | undefined,
      references: codexExt.references as string[] | undefined,
      assets: codexExt.assets as string[] | undefined,
      openaiConfig: codexExt.openaiConfig as Record<string, unknown> | undefined
    };
  }

  /**
   * Adapt settings from metadata to Codex format
   */
  private adaptSettings(settings: Record<string, unknown>): CodexSettings {
    const codexSettings: CodexSettings = {};

    if (settings.provider && typeof settings.provider === 'object') {
      codexSettings.provider = settings.provider as CodexSettings['provider'];
    }
    if (settings.sandbox && typeof settings.sandbox === 'object') {
      codexSettings.sandbox = settings.sandbox as CodexSettings['sandbox'];
    }
    if (settings.hooks && typeof settings.hooks === 'object') {
      codexSettings.hooks = settings.hooks as CodexSettings['hooks'];
    }
    if (settings.defaultAgent) codexSettings.defaultAgent = settings.defaultAgent as string;
    if (settings.defaultSkill) codexSettings.defaultSkill = settings.defaultSkill as string;

    for (const [key, value] of Object.entries(settings)) {
      if (!(key in codexSettings)) {
        codexSettings[key] = value;
      }
    }

    return codexSettings;
  }

  /**
   * Sanitize a name for use in paths
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Factory function to create Codex adapter
 */
export function createCodexAdapter(): CodexAdapter {
  return new CodexAdapter();
}
