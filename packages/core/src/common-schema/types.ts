/**
 * Common Schema - Canonical Intermediate Format
 * 
 * This is the single source of truth for all tool configurations.
 * Every tool normalizes to this format, and adapters convert from this format.
 * 
 * Architecture:
 *   Tool A → Normalizer → Common Schema → Adapter → Tool B
 * 
 * Benefits:
 *   - Reduces adapters from N×N to 2N
 *   - Single source of truth
 *   - Extensible and maintainable
 */

import type { ToolName } from '../registry/tool-paths.registry.js';

/**
 * Version of the Common Schema
 */
export const COMMON_SCHEMA_VERSION = '1.0.0';

/**
 * Common Agent - Represents an AI agent in tool-agnostic format
 */
export interface CommonAgent {
  /** Unique identifier (e.g., 'claude-code-helper', 'opencode-git-expert') */
  id: string;
  
  /** Display name */
  name: string;
  
  /** What this agent does */
  description: string;
  
  /** System prompt / instructions */
  systemPrompt?: string;
  
  /** LLM model to use (gpt-4, claude-3-opus, etc.) */
  model?: string;
  
  /** Temperature 0.0-2.0 */
  temperature?: number;
  
  /** Skills this agent has access to */
  skills: CommonSkill[];
  
  /** MCP servers this agent can use */
  mcps: CommonMCP[];
  
  /** Context files/paths */
  files: string[];
  
  /** Environment variables */
  env: Record<string, string>;
  
  /** Metadata including tool-specific extensions */
  metadata: CommonMetadata;
}

/**
 * Common Skill - Reusable capability
 */
export interface CommonSkill {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** What this skill does */
  description: string;
  
  /** Instructions for using this skill */
  instructions?: string;
  
  /** Whether this skill is enabled */
  enabled: boolean;
  
  /** Skill content/definition */
  content?: string;
  
  /** Tool-specific metadata */
  metadata?: CommonMetadata;
}

/**
 * Common MCP Server - External tool connection
 */
export interface CommonMCP {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Type of MCP server */
  type: 'local' | 'remote' | 'sse';
  
  /** Command to run (for local servers) */
  command?: string;
  
  /** Command arguments */
  args: string[];
  
  /** Environment variables for the server */
  env: Record<string, string>;
  
  /** URL (for remote/SSE servers) */
  url?: string;
  
  /** Headers for authentication (for remote servers) */
  headers?: Record<string, string>;
  
  /** Tool-specific metadata */
  metadata?: CommonMetadata;
}

/**
 * Common Metadata - Tool-specific extensions
 */
export interface CommonMetadata {
  /** Which tool this data came from */
  sourceTool: ToolName;
  
  /** Tool version (if available) */
  sourceVersion?: string;
  
  /** When this was exported/normalized */
  exportedAt: Date;
  
  /**
   * Tool-specific extensions
   * Fields that don't fit the common schema go here
   */
  extensions: {
    /** Claude-specific fields */
    claude?: Record<string, unknown>;
    
    /** OpenCode-specific fields */
    opencode?: Record<string, unknown>;
    
    /** Gemini-specific fields */
    gemini?: Record<string, unknown>;
    
    /** Cursor-specific fields */
    cursor?: Record<string, unknown>;
    
    /** Copilot-specific fields */
    copilot?: Record<string, unknown>;

    /** Codex-specific fields */
    codex?: Record<string, unknown>;
    
    /** Any other tool */
    [tool: string]: Record<string, unknown> | undefined;
  };
}

/**
 * Common Schema - Top-level container
 * This is the canonical format that all tools normalize to
 */
export interface CommonSchema {
  /** Schema version */
  version: typeof COMMON_SCHEMA_VERSION;
  
  /** All agents */
  agents: CommonAgent[];
  
  /** All skills (both standalone and referenced by agents) */
  skills: CommonSkill[];
  
  /** All MCP servers */
  mcps: CommonMCP[];
  
  /** Global environment variables */
  globalEnv: Record<string, string>;
  
  /** Export metadata */
  metadata: {
    /** When this schema was created */
    exportedAt: Date;
    
    /** Which source tools contributed data */
    sourceTools: ToolName[];
    
    /** Any additional export info */
    [key: string]: unknown;
  };
}

/**
 * Create an empty Common Schema
 */
export function createEmptySchema(): CommonSchema {
  return {
    version: COMMON_SCHEMA_VERSION,
    agents: [],
    skills: [],
    mcps: [],
    globalEnv: {},
    metadata: {
      exportedAt: new Date(),
      sourceTools: []
    }
  };
}

/**
 * Type guard to check if something is a valid CommonAgent
 */
export function isCommonAgent(obj: unknown): obj is CommonAgent {
  if (!obj || typeof obj !== 'object') return false;
  const agent = obj as CommonAgent;
  return (
    typeof agent.id === 'string' &&
    typeof agent.name === 'string' &&
    typeof agent.description === 'string' &&
    Array.isArray(agent.skills) &&
    Array.isArray(agent.mcps) &&
    Array.isArray(agent.files) &&
    typeof agent.env === 'object' &&
    typeof agent.metadata === 'object'
  );
}

/**
 * Type guard to check if something is a valid CommonSchema
 */
export function isCommonSchema(obj: unknown): obj is CommonSchema {
  if (!obj || typeof obj !== 'object') return false;
  const schema = obj as CommonSchema;
  return (
    schema.version === COMMON_SCHEMA_VERSION &&
    Array.isArray(schema.agents) &&
    Array.isArray(schema.skills) &&
    Array.isArray(schema.mcps) &&
    typeof schema.globalEnv === 'object' &&
    typeof schema.metadata === 'object'
  );
}
