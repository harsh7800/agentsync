/**
 * OpenCode Tool Parser Types
 * 
 * Defines the type system for OpenCode's directory-based configuration.
 * OpenCode stores configuration in opencode.json:
 * 
 * ~/.config/opencode/
 * ├── opencode.json    # Main config with MCP servers, settings, etc.
 * ├── skills/          # Skills directory
 * │   ├── git-commit/
 * │   │   └── skill.md
 * │   └── code-review/
 * │       └── skill.md
 * └── agents/          # Agents directory
 *     ├── onboarding/
 *     │   └── agent.md
 *     └── refactoring/
 *         └── agent.md
 * 
 * opencode.json format:
 * {
 *   "mcp": {
 *     "server-name": {
 *       "type": "local" | "remote",
 *       "command": ["npx", "-y", "package"],
 *       "environment": { ... },
 *       "url": "https://...",
 *       "headers": { ... }
 *     }
 *   }
 * }
 */

import type { ToolName } from '../../registry/tool-paths.registry.js';

/**
 * MCP server configuration from opencode.json
 * Handles both local and remote MCP servers
 */
export interface OpenCodeMCPServer {
  name: string;
  type: 'local' | 'remote';
  command: string;       // String command (for compatibility)
  args: string[];       // Command arguments
  env?: Record<string, string>;
  url?: string;         // For remote servers
  headers?: Record<string, string>;  // For remote servers
}

/**
 * Agent configuration from agent.md frontmatter files
 */
export interface OpenCodeAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

/**
 * Skill configuration from skill.md frontmatter files
 */
export interface OpenCodeSkill {
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  content: string;
  path: string;
}

/**
 * General settings from config.json and opencode.json
 */
export interface OpenCodeSettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * Complete OpenCode tool configuration model
 */
export interface OpenCodeToolModel {
  tool: ToolName;
  rootPath: string;
  mcpServers?: OpenCodeMCPServer[];
  agents?: OpenCodeAgent[];
  skills?: OpenCodeSkill[];
  settings?: OpenCodeSettings;
  discovered: {
    agentCount: number;
    skillCount: number;
    mcpServerCount: number;
  };
}

/**
 * OpenCode MCP configuration input (from opencode.json)
 * Supports both local (command-based) and remote (URL-based) servers
 */
export interface OpenCodeMCPInput {
  type?: 'local' | 'remote';
  command?: string | string[];  // Can be string or array
  args?: string[];
  env?: Record<string, string>;
  environment?: Record<string, string>;  // OpenCode uses "environment" not "env"
  url?: string;
  headers?: Record<string, string>;
}

/**
 * OpenCode MCP config file structure (from opencode.json)
 * MCP servers are stored under the "mcp" key
 */
export interface OpenCodeMCPConfigInput {
  mcp?: Record<string, OpenCodeMCPInput>;
}

/**
 * OpenCode agent input (from agents config or files)
 */
export interface OpenCodeAgentInput {
  description: string;
  system_prompt?: string;
  tools?: string[];
}

export interface OpenCodeAgentsConfigInput {
  agents?: Record<string, OpenCodeAgentInput>;
}

/**
 * Frontmatter parsing result
 */
export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}

/**
 * Skill file parsed result
 */
export interface SkillFileResult {
  name: string;
  config: {
    instructions?: string;
    description?: string;
    enabled?: boolean;
  };
  content: string;
  path: string;
}

/**
 * Agent file parsed result
 */
export interface AgentFileResult {
  name: string;
  config: {
    description: string;
    systemPrompt?: string;
    tools?: string[];
  };
  content: string;
  path: string;
}

/**
 * Scan errors
 */
export interface OpenCodeScanErrors {
  mcp?: string;
  agents: string[];
  skills: string[];
}

/**
 * Scan result
 */
export interface OpenCodeScanResult {
  model: OpenCodeToolModel;
  errors: OpenCodeScanErrors;
}
