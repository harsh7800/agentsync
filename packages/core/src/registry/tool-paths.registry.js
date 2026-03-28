/**
 * Tool Path Registry
 *
 * Defines the directory structure for each supported AI tool.
 * This registry enables AgentSync to locate configuration files
 * regardless of where they are stored on the user's system.
 */
import * as path from 'path';
import * as os from 'os';
/**
 * Registry of all supported tools and their directory structures
 */
export const TOOL_PATH_REGISTRY = {
    opencode: {
        displayName: 'OpenCode',
        globalRoot: path.join(os.homedir(), '.config', 'opencode'),
        projectRoot: '.opencode',
        configFiles: ['config.json', 'opencode.json'],
        agentsDir: 'agents',
        skillsDir: 'skills',
        mcpDir: undefined, // MCP config is in config.json
        agentFileName: 'agent.md',
        skillFileName: 'skill.md',
        usesAgentDirectories: true,
        usesSkillDirectories: true
    },
    claude: {
        displayName: 'Claude Code',
        globalRoot: path.join(os.homedir(), '.config', 'claude'),
        projectRoot: '.claude',
        configFiles: ['settings.json', 'claude.json', 'config.json'],
        agentsDir: undefined, // Agents are defined inline in settings.json
        skillsDir: undefined, // No separate skills directory
        mcpDir: undefined, // MCP servers are in settings.json
        agentFileName: undefined,
        skillFileName: undefined,
        usesAgentDirectories: false,
        usesSkillDirectories: false
    },
    gemini: {
        displayName: 'Gemini CLI',
        globalRoot: path.join(os.homedir(), '.config', 'gemini'),
        projectRoot: '.gemini',
        configFiles: ['config.json', 'settings.json'],
        agentsDir: 'agents',
        skillsDir: 'skills',
        mcpDir: undefined,
        agentFileName: 'agent.json',
        skillFileName: 'skill.json',
        usesAgentDirectories: true,
        usesSkillDirectories: true
    },
    cursor: {
        displayName: 'Cursor',
        globalRoot: path.join(os.homedir(), '.cursor'),
        projectRoot: '.cursor',
        configFiles: ['settings.json', 'config.json', '.cursorrules'],
        agentsDir: undefined, // Agents stored differently
        skillsDir: undefined,
        mcpDir: undefined,
        agentFileName: undefined,
        skillFileName: undefined,
        usesAgentDirectories: false,
        usesSkillDirectories: false
    },
    copilot: {
        displayName: 'GitHub Copilot CLI',
        globalRoot: path.join(os.homedir(), '.config', 'github-copilot'),
        projectRoot: '.github-copilot',
        configFiles: ['config.json', 'settings.json'],
        agentsDir: undefined,
        skillsDir: undefined,
        mcpDir: undefined,
        agentFileName: undefined,
        skillFileName: undefined,
        usesAgentDirectories: false,
        usesSkillDirectories: false
    }
};
/**
 * Tool Path Registry class for resolving tool paths
 */
export class ToolPathRegistry {
    toolStructures;
    constructor() {
        this.toolStructures = TOOL_PATH_REGISTRY;
    }
    /**
     * Get the directory structure for a tool
     */
    getStructure(tool) {
        return this.toolStructures[tool];
    }
    /**
     * Get all supported tool names
     */
    getSupportedTools() {
        return Object.keys(this.toolStructures);
    }
    /**
     * Resolve the actual path for a tool, checking both global and project locations
     */
    resolveToolPath(tool, preferGlobal = true) {
        const structure = this.getStructure(tool);
        // Determine root path
        let rootPath;
        let isGlobal;
        if (preferGlobal) {
            rootPath = structure.globalRoot;
            isGlobal = true;
        }
        else {
            rootPath = structure.projectRoot;
            isGlobal = false;
        }
        // Find config file if it exists
        let configFile;
        for (const configName of structure.configFiles) {
            const fullPath = path.join(rootPath, configName);
            // We'll check existence in the calling code or use this as a hint
            configFile = fullPath;
            break; // Use first config file as hint
        }
        return {
            tool,
            rootPath,
            isGlobal,
            configFile,
            agentsPath: structure.agentsDir ? path.join(rootPath, structure.agentsDir) : undefined,
            skillsPath: structure.skillsDir ? path.join(rootPath, structure.skillsDir) : undefined,
            mcpPath: structure.mcpDir ? path.join(rootPath, structure.mcpDir) : undefined
        };
    }
    /**
     * Check if a tool is detected (exists) at the given path
     */
    async isToolInstalled(tool, checkGlobal = true) {
        const structure = this.getStructure(tool);
        const rootPath = checkGlobal ? structure.globalRoot : structure.projectRoot;
        // Check if root directory exists
        const fs = await import('fs/promises');
        try {
            const stats = await fs.stat(rootPath);
            if (!stats.isDirectory())
                return false;
            // Check if at least one config file exists
            for (const configFile of structure.configFiles) {
                const fullPath = path.join(rootPath, configFile);
                try {
                    await fs.access(fullPath);
                    return true;
                }
                catch {
                    // File doesn't exist, try next
                }
            }
            // Check for agent or skills directories
            if (structure.agentsDir) {
                const agentsPath = path.join(rootPath, structure.agentsDir);
                try {
                    await fs.access(agentsPath);
                    return true;
                }
                catch { }
            }
            if (structure.skillsDir) {
                const skillsPath = path.join(rootPath, structure.skillsDir);
                try {
                    await fs.access(skillsPath);
                    return true;
                }
                catch { }
            }
            return false;
        }
        catch {
            return false;
        }
    }
    /**
     * Find the actual config file path for a tool
     */
    async findConfigFile(tool, rootPath) {
        const structure = this.getStructure(tool);
        const fs = await import('fs/promises');
        for (const configFile of structure.configFiles) {
            const fullPath = path.join(rootPath, configFile);
            try {
                await fs.access(fullPath);
                return fullPath;
            }
            catch {
                // File doesn't exist, try next
            }
        }
        return undefined;
    }
    /**
     * Get the default path for a tool (global by default)
     */
    getDefaultPath(tool, useGlobal = true) {
        const structure = this.getStructure(tool);
        return useGlobal ? structure.globalRoot : structure.projectRoot;
    }
    /**
     * Check if a tool uses directory-based agent/skill structure
     */
    usesDirectoryStructure(tool) {
        const structure = this.getStructure(tool);
        return !!(structure.usesAgentDirectories || structure.usesSkillDirectories);
    }
}
// Singleton instance
export const toolPathRegistry = new ToolPathRegistry();
//# sourceMappingURL=tool-paths.registry.js.map