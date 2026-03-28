import type { OpenCodeConfig } from '../types/opencode.types.js';
import type { ClaudeConfig, ClaudeMCPServer, ClaudeAgent } from '../types/claude.types.js';
export declare class OpenCodeToClaudeTranslator {
    /**
     * Translate OpenCode MCP configuration to Claude format
     */
    translateMCPConfig(openCodeConfig: OpenCodeConfig): {
        mcpServers: ClaudeMCPServer[];
    };
    /**
     * Translate OpenCode agents to Claude format
     */
    translateAgents(openCodeConfig: OpenCodeConfig): {
        agents: ClaudeAgent[];
    };
    /**
     * Translate complete OpenCode configuration to Claude
     */
    translate(openCodeConfig: OpenCodeConfig): ClaudeConfig;
}
//# sourceMappingURL=opencode-to-claude.translator.d.ts.map