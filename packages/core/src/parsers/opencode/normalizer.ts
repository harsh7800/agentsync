/**
 * OpenCode Normalizer
 * 
 * Converts OpenCode Tool Model → Common Schema
 * 
 * OpenCode Structure:
 *   ~/.config/opencode/
 *   ├── opencode.json          # MCP servers, settings
 *   ├── agents/
 *   │   └── agent-name/
 *   │       └── agent.md       # Agent with YAML frontmatter
 *   └── skills/
 *       └── skill-name/
 *           └── skill.md       # Skill with YAML frontmatter
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP, CommonMetadata } from '../../common-schema/types.js';
import type { OpenCodeToolModel, OpenCodeMCPServer, OpenCodeAgent, OpenCodeSkill } from './types.js';
import type { ToolNormalizer } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';
import { createEmptySchema } from '../../common-schema/types.js';

export class OpenCodeNormalizer implements ToolNormalizer<OpenCodeToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'opencode';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert OpenCode Tool Model to Common Schema
   */
  toCommonSchema(model: OpenCodeToolModel): CommonSchema {
    const schema = createEmptySchema();
    
    // Set metadata
    schema.metadata.sourceTools = ['opencode'];
    schema.metadata.exportedAt = new Date();
    
    // Normalize MCP servers
    for (const mcp of model.mcpServers || []) {
      schema.mcps.push(this.normalizeMCP(mcp));
    }
    
    // Normalize Agents
    for (const agent of model.agents || []) {
      schema.agents.push(this.normalizeAgent(agent));
    }
    
    // Normalize Skills
    for (const skill of model.skills || []) {
      schema.skills.push(this.normalizeSkill(skill));
    }
    
    // Extract global settings if present
    if (model.settings) {
      // Store tool-specific settings in extensions
      const extensions: Record<string, unknown> = {};
      
      if (model.settings.model) extensions.model = model.settings.model;
      if (model.settings.temperature !== undefined) extensions.temperature = model.settings.temperature;
      if (model.settings.maxTokens) extensions.maxTokens = model.settings.maxTokens;
      if (model.settings.apiKey) extensions.apiKey = '[MASKED]';
      if (model.settings.baseUrl) extensions.baseUrl = model.settings.baseUrl;
      
      // Store any additional settings
      for (const [key, value] of Object.entries(model.settings)) {
        if (!(key in extensions) && key !== 'apiKey') {
          extensions[key] = value;
        }
      }
      
      // We don't create a global agent, but store settings in metadata
      (schema.metadata as Record<string, unknown>).opencodeSettings = extensions;
    }
    
    return schema;
  }

  /**
   * Normalize OpenCode MCP server to Common MCP
   */
  private normalizeMCP(mcp: OpenCodeMCPServer): CommonMCP {
    // Build command from array or string
    let command: string | undefined;
    let args: string[] = [];
    
    // OpenCode stores command as string, but it might represent an array
    if (mcp.command) {
      const parts = mcp.command.split(' ');
      command = parts[0];
      args = parts.slice(1);
    }
    
    // Override with explicit args if present
    if (mcp.args && mcp.args.length > 0) {
      args = mcp.args;
    }
    
    return {
      id: `opencode-${mcp.name}`,
      name: mcp.name,
      type: (mcp.type as 'local' | 'remote' | 'sse') || 'local',
      command,
      args,
      env: mcp.env || {},
      url: mcp.url,
      headers: mcp.headers,
      metadata: this.createMetadata({
        originalType: mcp.type,
        originalCommand: mcp.command
      })
    };
  }

  /**
   * Normalize OpenCode Agent to Common Agent
   */
  private normalizeAgent(agent: OpenCodeAgent): CommonAgent {
    // Find MCPs referenced by this agent's tools
    // OpenCode agents don't directly reference MCPs, but tools might imply them
    const mcps: CommonMCP[] = [];
    
    // Find skills referenced by this agent
    const skills: CommonSkill[] = [];
    
    return {
      id: `opencode-${this.sanitizeId(agent.name)}`,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: undefined, // Per-agent model not supported in OpenCode yet
      temperature: undefined,
      skills,
      mcps,
      files: [], // OpenCode doesn't have per-agent files yet
      env: {},
      metadata: this.createMetadata({
        originalTools: agent.tools
      })
    };
  }

  /**
   * Normalize OpenCode Skill to Common Skill
   */
  private normalizeSkill(skill: OpenCodeSkill): CommonSkill {
    return {
      id: `opencode-${this.sanitizeId(skill.name)}`,
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      enabled: skill.enabled,
      content: skill.content,
      metadata: this.createMetadata({
        originalPath: skill.path
      })
    };
  }

  /**
   * Create metadata with OpenCode extensions
   */
  private createMetadata(opencodeExtensions: Record<string, unknown> = {}): CommonMetadata {
    return {
      sourceTool: 'opencode',
      exportedAt: new Date(),
      extensions: {
        opencode: opencodeExtensions
      }
    };
  }

  /**
   * Sanitize a name to be a valid ID
   */
  private sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Factory function to create OpenCode normalizer
 */
export function createOpenCodeNormalizer(): OpenCodeNormalizer {
  return new OpenCodeNormalizer();
}
