export interface ClaudeMCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClaudeAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

export interface ClaudeSkill {
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  content?: string;
}

export interface ClaudeConfig {
  mcpServers?: ClaudeMCPServer[];
  agents?: ClaudeAgent[];
  skills?: ClaudeSkill[];
}

export interface ClaudeMCPInput {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClaudeMCPConfigInput {
  mcpServers: Record<string, ClaudeMCPInput>;
}
