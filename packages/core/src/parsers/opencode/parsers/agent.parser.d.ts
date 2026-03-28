/**
 * Agent Parser for OpenCode
 *
 * Parses agent.md files from OpenCode agents directories.
 * Format:
 * ---
 * description: Agent description
 * system_prompt: You are an agent...
 * tools:
 *   - filesystem
 *   - git
 * ---
 *
 * # Agent Name
 *
 * Agent content...
 */
import type { OpenCodeAgent, AgentFileResult, OpenCodeAgentInput } from '../types.js';
export declare class OpenCodeAgentParser {
    /**
     * Parse an agent.md file
     */
    parse(agentPath: string, agentName: string): Promise<AgentFileResult>;
    /**
     * Parse agent.md content and return structured config
     */
    parseContent(content: string): AgentFileResult['config'];
    /**
     * Convert parsed agent file to OpenCodeAgent for migration
     */
    toAgent(agentFile: AgentFileResult): OpenCodeAgent;
    /**
     * Parse tools field - handles YAML arrays
     */
    private parseToolsArray;
    /**
     * Parse YAML frontmatter from markdown content
     */
    private parseFrontmatter;
    /**
     * Convert JSON config input to agents array
     */
    parseAgentsConfig(input: {
        agents?: Record<string, OpenCodeAgentInput>;
    }): OpenCodeAgent[];
}
//# sourceMappingURL=agent.parser.d.ts.map