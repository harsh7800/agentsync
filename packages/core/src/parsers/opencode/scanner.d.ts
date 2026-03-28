/**
 * OpenCode Scanner
 *
 * Scans OpenCode's directory structure and extracts all configurations.
 * This scanner handles OpenCode's multi-file, directory-based configuration.
 *
 * Directory structure:
 * ```
 * ~/.config/opencode/
 * ├── config.json      # General settings
 * ├── mcp.json         # MCP server configurations
 * ├── opencode.json    # OpenCode-specific settings
 * ├── skills/          # Skills directory
 * │   ├── git-commit/
 * │   │   └── skill.md
 * │   └── code-review/
 * │       └── skill.md
 * └── agents/          # Agents directory
 *     ├── onboarding/
 *     │   └── agent.md
 *     └── refactoring/
 *         └── agent.md
 * ```
 */
import type { OpenCodeScanResult, OpenCodeMCPServer, OpenCodeAgent, OpenCodeSkill, OpenCodeSettings } from './types.js';
export declare class OpenCodeScanner {
    private mcpParser;
    private agentParser;
    private skillParser;
    private configParser;
    constructor();
    /**
     * Scan an OpenCode directory and extract all configurations
     */
    scan(basePath: string): Promise<OpenCodeScanResult>;
    /**
     * Scan only MCP servers from opencode.json
     * OpenCode stores MCP configurations in opencode.json under the "mcp" key
     */
    scanMCPServers(basePath: string): Promise<OpenCodeMCPServer[]>;
    /**
     * Scan agents from agents subdirectory
     */
    scanAgents(basePath: string): Promise<{
        agents: OpenCodeAgent[];
        errors: string[];
    }>;
    /**
     * Scan skills from skills subdirectory
     */
    scanSkills(basePath: string): Promise<{
        skills: OpenCodeSkill[];
        errors: string[];
    }>;
    /**
     * Scan settings from config files
     */
    scanSettings(basePath: string): Promise<OpenCodeSettings | undefined>;
    /**
     * Check if a path is a valid OpenCode directory
     */
    isOpenCodeDirectory(checkPath: string): Promise<boolean>;
    private scanMCPServersSafe;
    private scanAgentsSafe;
    private scanSkillsSafe;
    private scanSettingsSafe;
}
//# sourceMappingURL=scanner.d.ts.map