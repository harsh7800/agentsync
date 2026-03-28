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
import * as fs from 'fs/promises';
import * as path from 'path';
import { OpenCodeMCPParser } from './parsers/mcp.parser.js';
import { OpenCodeAgentParser } from './parsers/agent.parser.js';
import { OpenCodeSkillParser } from './parsers/skill.parser.js';
import { OpenCodeConfigParser } from './parsers/config.parser.js';
export class OpenCodeScanner {
    mcpParser;
    agentParser;
    skillParser;
    configParser;
    constructor() {
        this.mcpParser = new OpenCodeMCPParser();
        this.agentParser = new OpenCodeAgentParser();
        this.skillParser = new OpenCodeSkillParser();
        this.configParser = new OpenCodeConfigParser();
    }
    /**
     * Scan an OpenCode directory and extract all configurations
     */
    async scan(basePath) {
        const errors = { agents: [], skills: [] };
        // Validate directory exists
        if (!await this.isOpenCodeDirectory(basePath)) {
            throw new Error(`OpenCode directory not found: ${basePath}`);
        }
        // Scan all components
        const [mcpServers, agentsResult, skillsResult, settings] = await Promise.all([
            this.scanMCPServersSafe(basePath),
            this.scanAgentsSafe(basePath),
            this.scanSkillsSafe(basePath),
            this.scanSettingsSafe(basePath)
        ]);
        // Collect errors
        if (mcpServers.error) {
            errors.mcp = mcpServers.error;
        }
        errors.agents = agentsResult.errors;
        errors.skills = skillsResult.errors;
        const model = {
            tool: 'opencode',
            rootPath: basePath,
            mcpServers: mcpServers.servers,
            agents: agentsResult.agents,
            skills: skillsResult.skills,
            settings,
            discovered: {
                agentCount: agentsResult.agents?.length || 0,
                skillCount: skillsResult.skills?.length || 0,
                mcpServerCount: mcpServers.servers?.length || 0
            }
        };
        return { model, errors };
    }
    /**
     * Scan only MCP servers from opencode.json
     * OpenCode stores MCP configurations in opencode.json under the "mcp" key
     */
    async scanMCPServers(basePath) {
        const opencodeConfigPath = path.join(basePath, 'opencode.json');
        try {
            const content = await fs.readFile(opencodeConfigPath, 'utf-8');
            const data = JSON.parse(content);
            // OpenCode stores MCP servers under the "mcp" key
            return this.mcpParser.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw new Error(`Failed to parse opencode.json: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Scan agents from agents subdirectory
     */
    async scanAgents(basePath) {
        const agentsDir = path.join(basePath, 'agents');
        const errors = [];
        try {
            await fs.access(agentsDir);
        }
        catch {
            return { agents: [], errors: [] };
        }
        const agents = [];
        const entries = await fs.readdir(agentsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const agentDir = path.join(agentsDir, entry.name);
            const agentMdPath = path.join(agentDir, 'agent.md');
            try {
                const agentFile = await this.agentParser.parse(agentMdPath, entry.name);
                const agent = this.agentParser.toAgent(agentFile);
                agents.push(agent);
            }
            catch (error) {
                errors.push(`Failed to parse agent at ${agentMdPath}: ${error}`);
                console.warn(`Warning: Failed to parse agent at ${agentMdPath}: ${error}`);
            }
        }
        return { agents, errors };
    }
    /**
     * Scan skills from skills subdirectory
     */
    async scanSkills(basePath) {
        const skillsDir = path.join(basePath, 'skills');
        const errors = [];
        try {
            await fs.access(skillsDir);
        }
        catch {
            return { skills: [], errors: [] };
        }
        const skills = [];
        const entries = await fs.readdir(skillsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillDir = path.join(skillsDir, entry.name);
            const skillMdPath = path.join(skillDir, 'skill.md');
            try {
                const skillFile = await this.skillParser.parse(skillMdPath, entry.name);
                const skill = this.skillParser.toSkill(skillFile);
                skills.push(skill);
            }
            catch (error) {
                errors.push(`Failed to parse skill at ${skillMdPath}: ${error}`);
                console.warn(`Warning: Failed to parse skill at ${skillMdPath}: ${error}`);
            }
        }
        return { skills, errors };
    }
    /**
     * Scan settings from config files
     */
    async scanSettings(basePath) {
        return this.configParser.scanSettings(basePath);
    }
    /**
     * Check if a path is a valid OpenCode directory
     */
    async isOpenCodeDirectory(checkPath) {
        try {
            const stats = await fs.stat(checkPath);
            if (!stats.isDirectory())
                return false;
            // Check if at least one known OpenCode file exists
            const knownFiles = ['config.json', 'mcp.json', 'opencode.json'];
            for (const file of knownFiles) {
                const filePath = path.join(checkPath, file);
                try {
                    await fs.access(filePath);
                    return true;
                }
                catch { }
            }
            // Check for agents or skills directories
            const agentsDir = path.join(checkPath, 'agents');
            const skillsDir = path.join(checkPath, 'skills');
            try {
                await fs.access(agentsDir);
                return true;
            }
            catch { }
            try {
                await fs.access(skillsDir);
                return true;
            }
            catch { }
            return false;
        }
        catch {
            return false;
        }
    }
    // Safe wrappers for parallel scanning
    async scanMCPServersSafe(basePath) {
        try {
            return { servers: await this.scanMCPServers(basePath), error: undefined };
        }
        catch (e) {
            return { servers: undefined, error: String(e) };
        }
    }
    async scanAgentsSafe(basePath) {
        try {
            return await this.scanAgents(basePath);
        }
        catch (e) {
            return { agents: [], errors: [String(e)] };
        }
    }
    async scanSkillsSafe(basePath) {
        try {
            return await this.scanSkills(basePath);
        }
        catch (e) {
            return { skills: [], errors: [String(e)] };
        }
    }
    async scanSettingsSafe(basePath) {
        try {
            return await this.scanSettings(basePath);
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=scanner.js.map