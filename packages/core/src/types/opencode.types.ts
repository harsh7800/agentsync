export interface OpenCodeMCPServer {
  name: string;
  type?: string;  // 'local' | 'remote'
  command: string;
  args: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface OpenCodeAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

export interface OpenCodeSkill {
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  content?: string;
}

export interface OpenCodeConfig {
  mcpServers?: OpenCodeMCPServer[];
  agents?: OpenCodeAgent[];
  skills?: OpenCodeSkill[];
}

export interface OpenCodeMCPInput {
  type?: string;  // 'local' | 'remote' - accept string for JSON parsing compatibility
  command?: string | string[];
  args?: string[];
  env?: Record<string, string>;
  environment?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface OpenCodeMCPConfigInput {
  mcp?: Record<string, OpenCodeMCPInput>;
}

export interface OpenCodeAgentInput {
  description: string;
  system_prompt?: string;
  tools?: string[];
}

export interface OpenCodeAgentsConfigInput {
  agents: Record<string, OpenCodeAgentInput>;
}
