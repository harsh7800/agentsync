import type { ClaudeConfig, ClaudeAgent, ClaudeMCPConfigInput } from '../types/claude.types.js';
export interface ClaudeAgentInput {
    name?: string;
    description: string;
    system_prompt?: string;
    tools?: string[];
}
export interface ClaudeAgentsConfigInput {
    agents: Record<string, ClaudeAgentInput>;
}
export declare class ClaudeParser {
    /**
     * Parse Claude MCP configuration from JSON input
     */
    parseMCPConfig(input: ClaudeMCPConfigInput): ClaudeConfig;
    /**
     * Parse Claude agents configuration from JSON input
     */
    parseAgents(input: ClaudeAgentsConfigInput): {
        agents: ClaudeAgent[];
    };
    /**
     * Validate a Claude configuration object
     */
    validateConfig(config: ClaudeConfig): boolean;
}
//# sourceMappingURL=claude.parser.d.ts.map