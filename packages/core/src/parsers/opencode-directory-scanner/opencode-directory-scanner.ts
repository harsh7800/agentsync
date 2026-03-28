import * as fs from 'fs/promises';
import * as path from 'path';
import { OpenCodeParser } from '../opencode.parser.js';
import { OpenCodeSkillParser } from './opencode-skill-parser.js';
import { OpenCodeAgentFileParser, type OpenCodeAgentFile } from './opencode-agent-parser.js';
import type { OpenCodeMCPServer, OpenCodeAgent, OpenCodeAgentInput } from '../../types/opencode.types.js';
import type { OpenCodeSkill } from './opencode-skill.types.js';

/**
 * OpenCode directory structure configuration
 */
export interface OpenCodeDirectoryConfig {
  basePath: string;
  mcpServers?: OpenCodeMCPServer[];
  agents?: OpenCodeAgent[];
  skills?: OpenCodeSkill[];
  settings?: OpenCodeSettings;
  discovered: {
    agentCount: number;
    skillCount: number;
    mcpServerCount: number;
  };
}

/**
 * Settings from config.json and opencode.json
 */
export interface OpenCodeSettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * Errors encountered during scanning
 */
export interface ScanErrors {
  mcp?: string;
  agents: string[];
  skills: string[];
}

/**
 * Result of scanning the OpenCode directory
 */
export interface OpenCodeScanResult {
  config: OpenCodeDirectoryConfig;
  errors: ScanErrors;
}

/**
 * Scans OpenCode's multi-file, directory-based configuration structure.
 * 
 * OpenCode directory structure:
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
export class OpenCodeDirectoryScanner {
  private parser: OpenCodeParser;
  private skillParser: OpenCodeSkillParser;
  private agentParser: OpenCodeAgentFileParser;

  constructor() {
    this.parser = new OpenCodeParser();
    this.skillParser = new OpenCodeSkillParser();
    this.agentParser = new OpenCodeAgentFileParser();
  }

  /**
   * Scan an OpenCode directory and extract all configurations
   */
  async scan(basePath: string): Promise<OpenCodeScanResult> {
    const errors: ScanErrors = { agents: [], skills: [] };

    // Validate directory exists
    if (!await this.isOpenCodeDirectory(basePath)) {
      throw new Error(`OpenCode directory not found: ${basePath}`);
    }

    // Scan all components in parallel
    const [mcpServersResult, agentsResult, skillsResult, settings] = await Promise.all([
      this.scanMCPServersSafe(basePath).catch(e => ({ servers: undefined as OpenCodeMCPServer[] | undefined, error: String(e) })),
      this.scanAgentsSafe(basePath).catch(e => ({ agents: [] as OpenCodeAgent[], errors: [String(e)] })),
      this.scanSkillsSafe(basePath).catch(e => ({ skills: [] as OpenCodeSkill[], errors: [String(e)] })),
      this.scanSettings(basePath).catch(() => undefined)
    ]);

    if (mcpServersResult.error) {
      errors.mcp = mcpServersResult.error;
    }

    const config: OpenCodeDirectoryConfig = {
      basePath,
      mcpServers: mcpServersResult.servers,
      agents: agentsResult.agents,
      skills: skillsResult.skills,
      settings,
      discovered: {
        agentCount: agentsResult.agents?.length || 0,
        skillCount: skillsResult.skills?.length || 0,
        mcpServerCount: mcpServersResult.servers?.length || 0
      }
    };

    return { config, errors };
  }

  /**
   * Scan MCP servers from opencode.json
   */
  async scanMCPServers(basePath: string): Promise<OpenCodeMCPServer[]> {
    const opencodeConfigPath = path.join(basePath, 'opencode.json');
    
    try {
      const content = await fs.readFile(opencodeConfigPath, 'utf-8');
      const data = JSON.parse(content);
      const result = this.parser.parseMCPConfig(data);
      return result.mcpServers;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty
        return [];
      }
      throw new Error(`Failed to parse opencode.json: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Scan agents from agents subdirectory agent.md files
   */
  async scanAgents(basePath: string): Promise<OpenCodeAgent[]> {
    const agentsDir = path.join(basePath, 'agents');
    
    try {
      await fs.access(agentsDir);
    } catch {
      // Agents directory doesn't exist
      return [];
    }

    const agents: OpenCodeAgent[] = [];
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const agentDir = path.join(agentsDir, entry.name);
      const agentMdPath = path.join(agentDir, 'agent.md');

      try {
        const agentFile = await this.agentParser.parse(agentMdPath, entry.name);
        const agent = this.agentParser.toOpenCodeAgent(agentFile);
        agents.push(agent);
      } catch (error) {
        // Log warning but continue with other agents
        console.warn(`Warning: Failed to parse agent at ${agentMdPath}: ${error}`);
      }
    }

    return agents;
  }

  /**
   * Scan skills from skills subdirectory skill.md files
   */
  async scanSkills(basePath: string): Promise<OpenCodeSkill[]> {
    const skillsDir = path.join(basePath, 'skills');
    
    try {
      await fs.access(skillsDir);
    } catch {
      // Skills directory doesn't exist
      return [];
    }

    const skills: OpenCodeSkill[] = [];
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(skillsDir, entry.name);
      const skillMdPath = path.join(skillDir, 'skill.md');

      try {
        const skill = await this.skillParser.parse(skillMdPath, entry.name);
        skills.push(skill);
      } catch (error) {
        // Log warning but continue with other skills
        console.warn(`Warning: Failed to parse skill at ${skillMdPath}: ${error}`);
      }
    }

    return skills;
  }

  /**
   * Scan general settings from config.json and opencode.json
   */
  async scanSettings(basePath: string): Promise<OpenCodeSettings | undefined> {
    const settings: OpenCodeSettings = {};

    // Read config.json
    const configPath = path.join(basePath, 'config.json');
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(content);
      Object.assign(settings, configData);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Warning: Failed to read config.json: ${error}`);
      }
    }

    // Read opencode.json (may override some settings)
    const opencodeConfigPath = path.join(basePath, 'opencode.json');
    try {
      const content = await fs.readFile(opencodeConfigPath, 'utf-8');
      const opencodeData = JSON.parse(content);
      Object.assign(settings, opencodeData);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Warning: Failed to read opencode.json: ${error}`);
      }
    }

    return Object.keys(settings).length > 0 ? settings : undefined;
  }

  /**
   * Check if a path is a valid OpenCode directory
   */
  async isOpenCodeDirectory(checkPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(checkPath);
      if (!stats.isDirectory()) return false;

      // Check if at least one known OpenCode file exists
      const knownFiles = ['config.json', 'mcp.json', 'opencode.json'];
      for (const file of knownFiles) {
        const filePath = path.join(checkPath, file);
        try {
          await fs.access(filePath);
          return true;
        } catch {
          // File doesn't exist, try next
        }
      }

      // Also check for agents or skills directories
      const agentsDir = path.join(checkPath, 'agents');
      const skillsDir = path.join(checkPath, 'skills');
      
      try {
        await fs.access(agentsDir);
        return true;
      } catch {}

      try {
        await fs.access(skillsDir);
        return true;
      } catch {}

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get the default OpenCode config directory path
   */
  static getDefaultPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, '.config', 'opencode');
  }

  // Safe wrappers for parallel scanning
  private async scanMCPServersSafe(basePath: string) {
    return { servers: await this.scanMCPServers(basePath), error: undefined as string | undefined };
  }

  private async scanAgentsSafe(basePath: string) {
    return { agents: await this.scanAgents(basePath), errors: [] as string[] };
  }

  private async scanSkillsSafe(basePath: string) {
    return { skills: await this.scanSkills(basePath), errors: [] as string[] };
  }
}
