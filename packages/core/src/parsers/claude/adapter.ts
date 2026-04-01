/**
 * Claude Adapter
 * 
 * Converts Common Schema → Claude Tool Model
 * 
 * This adapter takes the canonical Common Schema format and converts it
 * back to Claude's single-file configuration format.
 */

import type { CommonSchema, CommonAgent, CommonSkill, CommonMCP } from '../../common-schema/types.js';
import type { ClaudeToolModel, ClaudeMCPServer, ClaudeAgent } from './types.js';
import type { ToolAdapter } from '../../common-schema/normalizer.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class ClaudeAdapter implements ToolAdapter<ClaudeToolModel> {
  private version = '1.0.0';

  getToolName(): ToolName {
    return 'claude';
  }

  getVersion(): string {
    return this.version;
  }

  /**
   * Convert Common Schema to Claude Tool Model
   */
  fromCommonSchema(schema: CommonSchema): ClaudeToolModel {
    // Start with empty model
    const model: ClaudeToolModel = {
      tool: 'claude',
      rootPath: '', // Will be set by writer
      mcpServers: [],
      agents: [],
      settings: {},
      discovered: {
        agentCount: 0,
        mcpServerCount: 0
      }
    };

    // Adapt MCP servers
    for (const mcp of schema.mcps) {
      // Only include local MCPs (Claude doesn't support remote MCPs yet)
      if (mcp.type === 'local' || mcp.type === 'sse') {
        model.mcpServers!.push(this.adaptMCP(mcp));
      }
      // Remote MCPs are skipped with a warning (should be logged)
    }

    // Adapt Agents
    for (const agent of schema.agents) {
      model.agents!.push(this.adaptAgent(agent));
    }

    // Apply global settings from metadata if present
    if ((schema.metadata as Record<string, unknown>).claudeSettings) {
      const claudeSettings = (schema.metadata as Record<string, unknown>).claudeSettings as Record<string, unknown>;
      Object.assign(model.settings!, claudeSettings);
    }

    // Update discovered counts
    model.discovered = {
      agentCount: model.agents!.length,
      mcpServerCount: model.mcpServers!.length
    };

    return model;
  }

  /**
   * Adapt Common MCP to Claude MCP format
   */
  private adaptMCP(mcp: CommonMCP): ClaudeMCPServer {
    // Get original Claude-specific settings if they exist
    const claudeExt = mcp.metadata?.extensions?.claude || {};
    
    // Use original name if available (preserves exact naming)
    const name = (claudeExt.originalName as string) || mcp.name;

    return {
      name,
      command: mcp.command || '',
      args: mcp.args || [],
      env: mcp.env
    };
  }

  /**
   * Adapt Common Agent to Claude Agent format
   */
  private adaptAgent(agent: CommonAgent): ClaudeAgent {
    // Get original Claude-specific settings if they exist
    const claudeExt = agent.metadata.extensions?.claude || {};
    
    // Build tools list from agent's referenced skills and MCPs
    // Or use original tools if available
    let tools: string[] | undefined = (claudeExt.originalTools as string[]);
    
    // If no original tools, infer from skills
    if (!tools && agent.skills.length > 0) {
      tools = agent.skills.map(skill => skill.name);
    }
    
    // If no tools at all, leave undefined
    if (tools && tools.length === 0) {
      tools = undefined;
    }

    return {
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      tools
    };
  }

  /**
   * Sanitize a name for use in Claude config
   */
  private sanitizeName(name: string): string {
    // Claude uses the agent name as-is in the config
    return name;
  }
}

/**
 * Factory function to create Claude adapter
 */
export function createClaudeAdapter(): ClaudeAdapter {
  return new ClaudeAdapter();
}
