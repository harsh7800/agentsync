/**
 * Codex Tool Parser Types
 *
 * Defines the type system for Codex's directory-based configuration.
 * Codex stores everything under a .codex tree (defaults to ~/.codex,
 * redirected via CODEX_HOME).
 *
 * Directory structure:
 * ```
 * ~/.codex/                    (or $CODEX_HOME)
 * ├── config.toml              # User-scope config
 * ├── requirements.toml        # Enterprise/policy requirements
 * ├── AGENTS.md                # Global agent instructions
 * ├── AGENTS.override.md       # Override instructions (takes precedence)
 * ├── skills/                  # Skills directory
 * │   ├── skill-name/
 * │   │   ├── SKILL.md         # Skill definition
 * │   │   ├── scripts/         # Optional scripts
 * │   │   ├── references/      # Optional reference files
 * │   │   ├── assets/          # Optional assets
 * │   │   ├── agents/          # Optional agent definitions
 * │   │   └── openai.yaml      # Optional OpenAI config
 * │   └── ...
 * ├── sessions/                # Runtime session metadata
 * │   └── {session-id}.json
 * ├── prompts/                 # Saved prompts
 * │   └── {prompt-name}.md
 * └── plugins/                 # Plugin directory
 *
 * .codex/                      (project-level)
 * ├── config.toml              # Project-scope config (overrides user)
 * ├── AGENTS.md                # Project agent instructions
 * └── AGENTS.override.md       # Project override instructions
 *
 * /etc/codex/                  (system-level)
 * └── config.toml              # System-scope config
 *
 * Config hierarchy override flow: system → user → project
 * ```
 */

import type { ToolName } from '../../registry/tool-paths.registry.js';

/**
 * Codex scope level for config resolution
 */
export type CodexScope = 'system' | 'user' | 'project';

/**
 * Sandbox settings from config.toml
 */
export interface CodexSandboxConfig {
  enabled?: boolean;
  networkAccess?: boolean;
  allowedPaths?: string[];
  deniedPaths?: string[];
}

/**
 * Hook configuration
 */
export interface CodexHookConfig {
  preRun?: string;
  postRun?: string;
  onAgentLoad?: string;
  onSkillLoad?: string;
}

/**
 * Model provider settings
 */
export interface CodexProviderConfig {
  provider: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

/**
 * MCP server configuration from config.toml
 */
export interface CodexMCPServer {
  name: string;
  type: 'local' | 'remote';
  command: string;
  args: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

/**
 * Agent configuration discovered from AGENTS.md / AGENTS.override.md
 * Uses markdown with optional YAML frontmatter
 */
export interface CodexAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
  overrideContent?: string; // Content from AGENTS.override.md if present
}

/**
 * Skill configuration from SKILL.md files
 * Skills live under $CODEX_HOME/skills/{name}/
 * Each can have: SKILL.md, scripts/, references/, assets/, agents/, openai.yaml
 */
export interface CodexSkill {
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  content: string;
  path: string;
  scripts?: string[];           // Paths to scripts in scripts/
  references?: string[];        // Paths to reference files in references/
  assets?: string[];            // Paths to assets in assets/
  openaiConfig?: Record<string, unknown>; // Parsed openai.yaml if present
}

/**
 * Saved prompt from ~/.codex/prompts/
 */
export interface CodexPrompt {
  name: string;
  content: string;
  path: string;
}

/**
 * Session metadata from ~/.codex/sessions/
 */
export interface CodexSession {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  agentName?: string;
  summary?: string;
  path: string;
}

/**
 * General settings from merged config.toml hierarchy
 */
export interface CodexSettings {
  provider?: CodexProviderConfig;
  sandbox?: CodexSandboxConfig;
  hooks?: CodexHookConfig;
  defaultAgent?: string;
  defaultSkill?: string;
  [key: string]: unknown;
}

/**
 * Complete Codex tool configuration model
 */
export interface CodexToolModel {
  tool: ToolName;
  rootPath: string;
  projectPath?: string;
  mcpServers?: CodexMCPServer[];
  agents?: CodexAgent[];
  skills?: CodexSkill[];
  prompts?: CodexPrompt[];
  sessions?: CodexSession[];
  settings?: CodexSettings;
  discovered: {
    agentCount: number;
    skillCount: number;
    mcpServerCount: number;
    promptCount: number;
    sessionCount: number;
  };
}

/**
 * TOML config input shape (from config.toml)
 */
export interface CodexConfigInput {
  provider?: CodexProviderConfig;
  mcp?: Record<string, CodexMCPInput>;
  sandbox?: CodexSandboxConfig;
  hooks?: CodexHookConfig;
  default_agent?: string;
  default_skill?: string;
  [key: string]: unknown;
}

/**
 * MCP server input from config.toml
 */
export interface CodexMCPInput {
  type?: 'local' | 'remote';
  command?: string | string[];
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

/**
 * Parsed frontmatter result for AGENTS.md / SKILL.md
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
  scripts?: string[];
  references?: string[];
  assets?: string[];
  openaiConfig?: Record<string, unknown>;
}

/**
 * Agent file parsed result (from AGENTS.md)
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
  overrideContent?: string;
}

/**
 * Scan errors
 */
export interface CodexScanErrors {
  config?: string;
  agents: string[];
  skills: string[];
  prompts: string[];
  sessions: string[];
}

/**
 * Scan result
 */
export interface CodexScanResult {
  model: CodexToolModel;
  errors: CodexScanErrors;
}
