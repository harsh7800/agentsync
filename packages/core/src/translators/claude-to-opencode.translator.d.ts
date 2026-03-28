import type { ClaudeConfig } from '../types/claude.types.js';
import type { OpenCodeConfig, OpenCodeMCPServer, OpenCodeAgent } from '../types/opencode.types.js';
export declare class ClaudeToOpenCodeTranslator {
    /**
     * Translate Claude MCP configuration to OpenCode format
     */
    translateMCPConfig(claudeConfig: ClaudeConfig): {
        mcpServers: OpenCodeMCPServer[];
    };
    /**
     * Translate Claude agents to OpenCode format
     */
    translateAgents(claudeConfig: ClaudeConfig): {
        agents: OpenCodeAgent[];
    };
    /**
     * Translate complete Claude configuration to OpenCode
     */
    translate(claudeConfig: ClaudeConfig): OpenCodeConfig;
}
//# sourceMappingURL=claude-to-opencode.translator.d.ts.map