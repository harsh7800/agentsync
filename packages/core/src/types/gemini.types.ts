/**
 * Gemini CLI Type Definitions
 * 
 * Based on Google Gemini CLI configuration structure
 */

export interface GeminiMCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface GeminiAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  model?: string;
  tools?: string[];
}

export interface GeminiConfig {
  mcpServers?: GeminiMCPServer[];
  agents?: GeminiAgent[];
  defaultModel?: string;
  apiKey?: string; // Masked
}

export interface GeminiMCPInput {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface GeminiMCPConfigInput {
  mcpServers: Record<string, GeminiMCPInput>;
}

export interface GeminiAgentInput {
  name?: string;
  description: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
}

export interface GeminiAgentsConfigInput {
  agents: Record<string, GeminiAgentInput>;
}
