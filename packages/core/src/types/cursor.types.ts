/**
 * Cursor Type Definitions
 * 
 * Based on Cursor IDE configuration structure
 */

export interface CursorMCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface CursorAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

export interface CursorRules {
  rules: string[];
}

export interface CursorConfig {
  mcpServers?: CursorMCPServer[];
  agents?: CursorAgent[];
  cursorRules?: CursorRules;
  autoComplete?: boolean;
  tabSize?: number;
}

export interface CursorMCPInput {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface CursorMCPConfigInput {
  mcpServers: Record<string, CursorMCPInput>;
}

export interface CursorAgentInput {
  name?: string;
  description: string;
  system_prompt?: string;
  tools?: string[];
}

export interface CursorAgentsConfigInput {
  agents: Record<string, CursorAgentInput>;
}
