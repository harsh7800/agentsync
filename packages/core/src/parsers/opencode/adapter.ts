/**
 * OpenCode Adapter
 * 
 * Converts Common Schema → OpenCode Tool Model
 * 
 * This adapter takes the canonical Common Schema format and converts it
 * back to OpenCode's specific directory structure and file formats.
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP } from '../../common-schema/types.js';
import type { OpenCodeToolModel, OpenCodeMCPServer, OpenCodeAgent, OpenCodeSkill, OpenCodeSettings } from './types.js';
import type { ToolAdapter } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class OpenCodeAdapter implements ToolAdapter<OpenCodeToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'opencode';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert Common Schema to OpenCode Tool Model
   */
  fromCommonSchema(schema: CommonSchema): OpenCodeToolModel {
    // Start with empty model
    const model: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '', // Will be set by writer
      mcpServers: [],
      agents: [],
      skills: [],
      settings: {},
      discovered: {
        agentCount: 0,
        skillCount: 0,
        mcpServerCount: 0
      }
    };

    // Adapt MCP servers
    for (const mcp of schema.mcps) {
      // Only include MCPs from OpenCode or generic ones
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
    if ((schema.metadata as Record<string, unknown>).opencodeSettings) {
      model.settings = this.adaptSettings(
        (schema.metadata as Record<string, unknown>).opencodeSettings as Record<string, unknown>
      );
    }

    // Update discovered counts
    model.discovered = {
      agentCount: model.agents!.length,
      skillCount: model.skills!.length,
      mcpServerCount: model.mcpServers!.length
    };

    return model;
  }

  /**
   * Check if an MCP should be included in OpenCode output
   * We include all MCPs, but tool-specific ones might need special handling
   */
  private shouldIncludeMCP(mcp: CommonMCP): boolean {
    // Include all MCPs - OpenCode can use any MCP server
    return true;
  }

  /**
   * Adapt Common MCP to OpenCode MCP format
   */
  private adaptMCP(mcp: CommonMCP): OpenCodeMCPServer {
    // Get original OpenCode-specific settings if they exist
    const opencodeExt = mcp.metadata?.extensions?.opencode || {};
    
    // Build command string from parts
    let command = mcp.command || '';
    if (mcp.args && mcp.args.length > 0) {
      command = `${command} ${mcp.args.join(' ')}`.trim();
    }
    
    // Use original command if available (preserves exact formatting)
    if (opencodeExt.originalCommand && typeof opencodeExt.originalCommand === 'string') {
      command = opencodeExt.originalCommand;
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
   * Adapt Common Agent to OpenCode Agent format
   */
  private adaptAgent(agent: CommonAgent): OpenCodeAgent {
    // Get original OpenCode-specific settings if they exist
    const opencodeExt = agent.metadata.extensions?.opencode || {};
    
    // Extract tools from extensions if present
    const tools: string[] = (opencodeExt.originalTools as string[]) || [];

    return {
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      tools: tools.length > 0 ? tools : undefined
    };
  }

  /**
   * Adapt Common Skill to OpenCode Skill format
   */
  private adaptSkill(skill: CommonSkill): OpenCodeSkill {
    // Get original OpenCode-specific settings if they exist
    const opencodeExt = skill.metadata?.extensions?.opencode || {};
    
    return {
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      enabled: skill.enabled,
      content: skill.content || '',
      path: (opencodeExt.originalPath as string) || `skills/${this.sanitizeName(skill.name)}/skill.md`
    };
  }

  /**
   * Adapt settings from metadata to OpenCode format
   */
  private adaptSettings(settings: Record<string, unknown>): OpenCodeSettings {
    const opencodeSettings: OpenCodeSettings = {};

    if (settings.model) opencodeSettings.model = settings.model as string;
    if (typeof settings.temperature === 'number') {
      opencodeSettings.temperature = settings.temperature;
    }
    if (typeof settings.maxTokens === 'number') {
      opencodeSettings.maxTokens = settings.maxTokens;
    }
    if (settings.baseUrl) opencodeSettings.baseUrl = settings.baseUrl as string;

    // Preserve any additional settings
    for (const [key, value] of Object.entries(settings)) {
      if (!(key in opencodeSettings)) {
        opencodeSettings[key] = value;
      }
    }

    return opencodeSettings;
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
 * Factory function to create OpenCode adapter
 */
export function createOpenCodeAdapter(): OpenCodeAdapter {
  return new OpenCodeAdapter();
}
