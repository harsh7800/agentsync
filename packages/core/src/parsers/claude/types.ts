/**
 * Claude Tool Parser Types
 * 
 * Defines the type system for Claude's single-file configuration.
 * Claude stores configuration in a single settings.json file:
 * 
 * ~/.config/claude/settings.json
 * {
 *   "mcpServers": { ... },
 *   "agents": { ... }
 * }
 */

import type { ToolName } from '../../registry/tool-paths.registry.js';

/**
 * MCP server configuration from settings.json
 */
export interface ClaudeMCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Agent configuration from settings.json
 */
export interface ClaudeAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

/**
 * Complete Claude tool configuration model
 */
export interface ClaudeToolModel {
  tool: ToolName;
  rootPath: string;
  mcpServers?: ClaudeMCPServer[];
  agents?: ClaudeAgent[];
  settings?: Record<string, unknown>;
  discovered: {
    agentCount: number;
    mcpServerCount: number;
  };
}

/**
 * MCP configuration input (from settings.json)
 */
export interface ClaudeMCPInput {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ClaudeMCPConfigInput {
  mcpServers?: Record<string, ClaudeMCPInput>;
}

/**
 * Agent input (from settings.json)
 */
export interface ClaudeAgentInput {
  name?: string;
  description: string;
  system_prompt?: string;
  tools?: string[];
}

export interface ClaudeAgentsConfigInput {
  agents?: Record<string, ClaudeAgentInput>;
}

/**
 * Scan errors
 */
export interface ClaudeScanErrors {
  config?: string;
  mcp?: string;
  agents?: string;
}

/**
 * Scan result
 */
export interface ClaudeScanResult {
  model: ClaudeToolModel;
  errors: ClaudeScanErrors;
}
