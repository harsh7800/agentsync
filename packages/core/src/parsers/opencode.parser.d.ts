import type { OpenCodeConfig, OpenCodeMCPServer, OpenCodeAgent, OpenCodeMCPConfigInput, OpenCodeAgentsConfigInput } from '../types/opencode.types.js';
export declare class OpenCodeParser {
    /**
     * Parse OpenCode MCP configuration from opencode.json input
     * OpenCode stores MCP servers under the "mcp" key
     */
    parseMCPConfig(input: OpenCodeMCPConfigInput): {
        mcpServers: OpenCodeMCPServer[];
    };
    /**
     * Parse OpenCode agents configuration from JSON input
     */
    parseAgents(input: OpenCodeAgentsConfigInput): {
        agents: OpenCodeAgent[];
    };
    /**
     * Validate an OpenCode configuration object
     */
    validateConfig(config: OpenCodeConfig): boolean;
}
//# sourceMappingURL=opencode.parser.d.ts.map