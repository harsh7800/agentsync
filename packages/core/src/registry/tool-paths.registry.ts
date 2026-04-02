/**
 * Tool Path Registry
 * 
 * Defines the directory structure for each supported AI tool.
 * This registry enables AgentSync to locate configuration files
 * regardless of where they are stored on the user's system.
 */

import * as path from 'path';
import * as os from 'os';

export type ToolName = 'claude' | 'opencode' | 'gemini' | 'cursor' | 'copilot' | 'codex';

/**
 * Tool-specific directory structure definition
 */
export interface ToolDirectoryStructure {
  /** Display name of the tool */
  displayName: string;
  
  /** Global (system-wide) config root directory */
  globalRoot: string;
  
  /** Project (local) config root directory */
  projectRoot: string;
  
  /** Config file names (in order of priority) */
  configFiles: string[];
  
  /** Directory containing agent definitions */
  agentsDir?: string;
  
  /** Directory containing skill definitions */
  skillsDir?: string;
  
  /** Directory containing MCP server configurations */
  mcpDir?: string;
  
  /** Default file name for agents (inside agent folders) */
  agentFileName?: string;
  
  /** Default file name for skills (inside skill folders) */
  skillFileName?: string;
  
  /** Whether the tool uses directory-based structure for agents */
  usesAgentDirectories?: boolean;
  
  /** Whether the tool uses directory-based structure for skills */
  usesSkillDirectories?: boolean;
}

/**
 * Resolved tool path information
 */
export interface ResolvedToolPath {
  tool: ToolName;
  rootPath: string;
  isGlobal: boolean;
  configFile?: string;
  agentsPath?: string;
  skillsPath?: string;
  mcpPath?: string;
}

/**
 * Registry of all supported tools and their directory structures
 */
export const TOOL_PATH_REGISTRY: Record<ToolName, ToolDirectoryStructure> = {
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
  },

  codex: {
    displayName: 'Codex',
    globalRoot: process.env.CODEX_HOME || path.join(os.homedir(), '.codex'),
    projectRoot: '.codex',
    configFiles: ['config.toml'],
    agentsDir: 'agents',
    skillsDir: 'skills',
    mcpDir: undefined,
    agentFileName: 'agent.md',
    skillFileName: 'SKILL.md',
    usesAgentDirectories: true,
    usesSkillDirectories: true
  }
};

/**
 * Tool Path Registry class for resolving tool paths
 */
export class ToolPathRegistry {
  private toolStructures: Record<ToolName, ToolDirectoryStructure>;
  
  constructor() {
    this.toolStructures = TOOL_PATH_REGISTRY;
  }
  
  /**
   * Get the directory structure for a tool
   */
  getStructure(tool: ToolName): ToolDirectoryStructure {
    return this.toolStructures[tool];
  }
  
  /**
   * Get all supported tool names
   */
  getSupportedTools(): ToolName[] {
    return Object.keys(this.toolStructures) as ToolName[];
  }
  
  /**
   * Resolve the actual path for a tool, checking both global and project locations
   */
  resolveToolPath(
    tool: ToolName,
    preferGlobal: boolean = true
  ): ResolvedToolPath {
    const structure = this.getStructure(tool);
    
    // Determine root path
    let rootPath: string;
    let isGlobal: boolean;
    
    if (preferGlobal) {
      rootPath = structure.globalRoot;
      isGlobal = true;
    } else {
      rootPath = structure.projectRoot;
      isGlobal = false;
    }
    
    // Find config file if it exists
    let configFile: string | undefined;
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
  async isToolInstalled(tool: ToolName, checkGlobal: boolean = true): Promise<boolean> {
    const structure = this.getStructure(tool);
    const rootPath = checkGlobal ? structure.globalRoot : structure.projectRoot;
    
    // Check if root directory exists
    const fs = await import('fs/promises');
    
    try {
      const stats = await fs.stat(rootPath);
      if (!stats.isDirectory()) return false;
      
      // Check if at least one config file exists
      for (const configFile of structure.configFiles) {
        const fullPath = path.join(rootPath, configFile);
        try {
          await fs.access(fullPath);
          return true;
        } catch {
          // File doesn't exist, try next
        }
      }
      
      // Check for agent or skills directories
      if (structure.agentsDir) {
        const agentsPath = path.join(rootPath, structure.agentsDir);
        try {
          await fs.access(agentsPath);
          return true;
        } catch {}
      }
      
      if (structure.skillsDir) {
        const skillsPath = path.join(rootPath, structure.skillsDir);
        try {
          await fs.access(skillsPath);
          return true;
        } catch {}
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Find the actual config file path for a tool
   */
  async findConfigFile(tool: ToolName, rootPath: string): Promise<string | undefined> {
    const structure = this.getStructure(tool);
    const fs = await import('fs/promises');
    
    for (const configFile of structure.configFiles) {
      const fullPath = path.join(rootPath, configFile);
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        // File doesn't exist, try next
      }
    }
    
    return undefined;
  }
  
  /**
   * Get the default path for a tool (global by default)
   */
  getDefaultPath(tool: ToolName, useGlobal: boolean = true): string {
    const structure = this.getStructure(tool);
    return useGlobal ? structure.globalRoot : structure.projectRoot;
  }
  
  /**
   * Check if a tool uses directory-based agent/skill structure
   */
  usesDirectoryStructure(tool: ToolName): boolean {
    const structure = this.getStructure(tool);
    return !!(structure.usesAgentDirectories || structure.usesSkillDirectories);
  }
}

// Singleton instance
export const toolPathRegistry = new ToolPathRegistry();
