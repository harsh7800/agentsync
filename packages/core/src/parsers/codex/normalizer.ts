/**
 * Codex Normalizer
 *
 * Converts Codex Tool Model → Common Schema
 *
 * Codex Structure:
 *   ~/.codex/ (or $CODEX_HOME)
 *   ├── config.toml          # Config with MCP servers, provider settings
 *   ├── AGENTS.md            # Agent instructions with YAML frontmatter
 *   ├── AGENTS.override.md   # Override instructions
 *   └── skills/
 *       └── skill-name/
 *           ├── SKILL.md     # Skill with YAML frontmatter
 *           └── openai.yaml  # Optional OpenAI config
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP, CommonMetadata } from '../../common-schema/types.js';
import type { CodexToolModel, CodexMCPServer, CodexAgent, CodexSkill } from './types.js';
import type { ToolNormalizer } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';
import { createEmptySchema } from '../../common-schema/types.js';

export class CodexNormalizer implements ToolNormalizer<CodexToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'codex';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert Codex Tool Model to Common Schema
   */
  toCommonSchema(model: CodexToolModel): CommonSchema {
    const schema = createEmptySchema();

    // Set metadata
    schema.metadata.sourceTools = ['codex'];
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
      const extensions: Record<string, unknown> = {};

      if (model.settings.provider) {
        extensions.provider = { ...model.settings.provider };
        // Mask API keys
        if ((extensions.provider as Record<string, unknown>).apiKey) {
          (extensions.provider as Record<string, unknown>).apiKey = '[MASKED]';
        }
      }

      if (model.settings.sandbox) extensions.sandbox = model.settings.sandbox;
      if (model.settings.hooks) extensions.hooks = model.settings.hooks;
      if (model.settings.defaultAgent) extensions.defaultAgent = model.settings.defaultAgent;
      if (model.settings.defaultSkill) extensions.defaultSkill = model.settings.defaultSkill;

      // Store additional settings
      for (const [key, value] of Object.entries(model.settings)) {
        if (!['provider', 'sandbox', 'hooks', 'defaultAgent', 'defaultSkill'].includes(key)) {
          extensions[key] = value;
        }
      }

      (schema.metadata as Record<string, unknown>).codexSettings = extensions;
    }

    return schema;
  }

  /**
   * Normalize Codex MCP server to Common MCP
   */
  private normalizeMCP(mcp: CodexMCPServer): CommonMCP {
    let command: string | undefined;
    let args: string[] = [];

    if (mcp.command) {
      const parts = mcp.command.split(' ');
      command = parts[0];
      args = parts.slice(1);
    }

    if (mcp.args && mcp.args.length > 0) {
      args = mcp.args;
    }

    return {
      id: `codex-${mcp.name}`,
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
   * Normalize Codex Agent to Common Agent
   */
  private normalizeAgent(agent: CodexAgent): CommonAgent {
    return {
      id: `codex-${this.sanitizeId(agent.name)}`,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: undefined,
      temperature: undefined,
      skills: [],
      mcps: [],
      files: [],
      env: {},
      metadata: this.createMetadata({
        originalTools: agent.tools,
        hasOverride: !!agent.overrideContent
      })
    };
  }

  /**
   * Normalize Codex Skill to Common Skill
   */
  private normalizeSkill(skill: CodexSkill): CommonSkill {
    return {
      id: `codex-${this.sanitizeId(skill.name)}`,
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      enabled: skill.enabled,
      content: skill.content,
      metadata: this.createMetadata({
        originalPath: skill.path,
        scripts: skill.scripts,
        references: skill.references,
        assets: skill.assets,
        openaiConfig: skill.openaiConfig
      })
    };
  }

  /**
   * Create metadata with Codex extensions
   */
  private createMetadata(codexExtensions: Record<string, unknown> = {}): CommonMetadata {
    return {
      sourceTool: 'codex',
      exportedAt: new Date(),
      extensions: {
        codex: codexExtensions
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
 * Factory function to create Codex normalizer
 */
export function createCodexNormalizer(): CodexNormalizer {
  return new CodexNormalizer();
}
