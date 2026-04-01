/**
 * Claude Normalizer
 * 
 * Converts Claude Tool Model → Common Schema
 * 
 * Claude Structure (Single File):
 *   ~/.config/claude/settings.json
 *   {
 *     "mcpServers": {
 *       "server-name": {
 *         "command": "npx",
 *         "args": ["-y", "package"],
 *         "env": { ... }
 *       }
 *     },
 *     "agents": {
 *       "agent-name": {
 *         "description": "...",
 *         "system_prompt": "...",
 *         "tools": ["..."]
 *       }
 *     }
 *   }
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP, CommonMetadata } from '../../common-schema/types.js';
import type { ClaudeToolModel, ClaudeMCPServer, ClaudeAgent } from './types.js';
import type { ToolNormalizer } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';
import { createEmptySchema } from '../../common-schema/types.js';

export class ClaudeNormalizer implements ToolNormalizer<ClaudeToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'claude';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert Claude Tool Model to Common Schema
   */
  toCommonSchema(model: ClaudeToolModel): CommonSchema {
    const schema = createEmptySchema();
    
    // Set metadata
    schema.metadata.sourceTools = ['claude'];
    schema.metadata.exportedAt = new Date();
    
    // Normalize MCP servers
    for (const mcp of model.mcpServers || []) {
      schema.mcps.push(this.normalizeMCP(mcp));
    }
    
    // Normalize Agents
    for (const agent of model.agents || []) {
      schema.agents.push(this.normalizeAgent(agent));
    }
    
    // Claude doesn't have skills, but we might create inferred skills from agent tools
    // This is a design decision - we could analyze agent tools and create skills
    
    // Store any additional settings in extensions
    if (model.settings && Object.keys(model.settings).length > 0) {
      const extensions: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(model.settings)) {
        // Skip fields we already processed
        if (key !== 'mcpServers' && key !== 'agents') {
          extensions[key] = value;
        }
      }
      
      if (Object.keys(extensions).length > 0) {
        (schema.metadata as Record<string, unknown>).claudeSettings = extensions;
      }
    }
    
    return schema;
  }

  /**
   * Normalize Claude MCP server to Common MCP
   */
  private normalizeMCP(mcp: ClaudeMCPServer): CommonMCP {
    return {
      id: `claude-${mcp.name}`,
      name: mcp.name,
      type: 'local', // Claude only supports local MCP servers currently
      command: mcp.command,
      args: mcp.args || [],
      env: mcp.env || {},
      url: undefined,
      headers: undefined,
      metadata: this.createMetadata({
        originalName: mcp.name
      })
    };
  }

  /**
   * Normalize Claude Agent to Common Agent
   */
  private normalizeAgent(agent: ClaudeAgent): CommonAgent {
    return {
      id: `claude-${this.sanitizeId(agent.name)}`,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: undefined, // Claude uses global model setting
      temperature: undefined,
      skills: [], // Claude doesn't have explicit skills
      mcps: [], // Agents don't directly reference MCPs in Claude
      files: [], // Claude doesn't have per-agent files
      env: {},
      metadata: this.createMetadata({
        originalTools: agent.tools,
        hasTools: !!agent.tools && agent.tools.length > 0
      })
    };
  }

  /**
   * Create metadata with Claude extensions
   */
  private createMetadata(claudeExtensions: Record<string, unknown> = {}): CommonMetadata {
    return {
      sourceTool: 'claude',
      exportedAt: new Date(),
      extensions: {
        claude: claudeExtensions
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
 * Factory function to create Claude normalizer
 */
export function createClaudeNormalizer(): ClaudeNormalizer {
  return new ClaudeNormalizer();
}
