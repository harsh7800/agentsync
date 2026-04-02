/**
 * Codex Scanner
 *
 * Scans Codex's directory structure and extracts all configurations.
 * Handles Codex's multi-file, directory-based configuration including:
 * - Config hierarchy (config.toml at system/user/project scopes)
 * - AGENTS.md discovery (global → project → nested)
 * - Skills from $CODEX_HOME/skills/
 * - Saved prompts from $CODEX_HOME/prompts/
 * - Session metadata from $CODEX_HOME/sessions/
 *
 * Directory structure:
 * ```
 * ~/.codex/                    (or $CODEX_HOME)
 * ├── config.toml              # User config
 * ├── requirements.toml        # Enterprise policy
 * ├── AGENTS.md                # Global agent instructions
 * ├── AGENTS.override.md       # Override instructions
 * ├── skills/                  # Skills directory
 * │   └── skill-name/
 * │       ├── SKILL.md
 * │       ├── scripts/
 * │       ├── references/
 * │       ├── assets/
 * │       └── openai.yaml
 * ├── sessions/                # Runtime session metadata
 * ├── prompts/                 # Saved prompts
 * └── plugins/                 # Plugins
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CodexConfigParser } from './parsers/config.parser.js';
import { CodexAgentParser } from './parsers/agent.parser.js';
import { CodexSkillParser } from './parsers/skill.parser.js';
import type {
  CodexToolModel,
  CodexScanErrors,
  CodexScanResult,
  CodexMCPServer,
  CodexAgent,
  CodexSkill,
  CodexPrompt,
  CodexSession,
  CodexSettings
} from './types.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class CodexScanner {
  private configParser: CodexConfigParser;
  private agentParser: CodexAgentParser;
  private skillParser: CodexSkillParser;

  constructor() {
    this.configParser = new CodexConfigParser();
    this.agentParser = new CodexAgentParser();
    this.skillParser = new CodexSkillParser();
  }

  /**
   * Scan a Codex directory and extract all configurations
   */
  async scan(basePath: string, projectPath?: string): Promise<CodexScanResult> {
    const errors: CodexScanErrors = { agents: [], skills: [], prompts: [], sessions: [] };

    if (!await this.isCodexDirectory(basePath)) {
      throw new Error(`Codex directory not found: ${basePath}`);
    }

    // Scan all components in parallel
    const [mcpServers, agentsResult, skillsResult, settings, prompts, sessions] = await Promise.all([
      this.scanMCPServersSafe(basePath, projectPath),
      this.scanAgentsSafe(basePath, projectPath),
      this.scanSkillsSafe(basePath),
      this.scanSettingsSafe(basePath, projectPath),
      this.scanPromptsSafe(basePath),
      this.scanSessionsSafe(basePath)
    ]);

    // Collect errors
    if (mcpServers.error) {
      errors.config = mcpServers.error;
    }
    errors.agents = agentsResult.errors;
    errors.skills = skillsResult.errors;
    errors.prompts = prompts.errors;
    errors.sessions = sessions.errors;

    const model: CodexToolModel = {
      tool: 'codex' as ToolName,
      rootPath: basePath,
      projectPath,
      mcpServers: mcpServers.servers,
      agents: agentsResult.agents,
      skills: skillsResult.skills,
      prompts: prompts.prompts,
      sessions: sessions.sessions,
      settings: settings.settings,
      discovered: {
        agentCount: agentsResult.agents?.length || 0,
        skillCount: skillsResult.skills?.length || 0,
        mcpServerCount: mcpServers.servers?.length || 0,
        promptCount: prompts.prompts?.length || 0,
        sessionCount: sessions.sessions?.length || 0
      }
    };

    return { model, errors };
  }

  /**
   * Scan MCP servers from config.toml hierarchy
   */
  async scanMCPServers(rootPath: string, projectPath?: string): Promise<CodexMCPServer[]> {
    return this.configParser.scanMCPServers(rootPath, projectPath);
  }

  /**
   * Scan agents from AGENTS.md hierarchy and agents/ directory
   * Discovery:
   *   - AGENTS.md at root (global → project)
   *   - agents/{name}.md or agents/{name}/agent.md files
   *   - Nested AGENTS.md in subdirectories
   */
  async scanAgents(rootPath: string, projectPath?: string): Promise<{ agents: CodexAgent[]; errors: string[] }> {
    const agents: CodexAgent[] = [];
    const errors: string[] = [];

    // 1. Check global AGENTS.md
    const globalAgentsPath = path.join(rootPath, 'AGENTS.md');
    try {
      const agentFile = await this.agentParser.parse(globalAgentsPath, 'default');
      const agent = this.agentParser.toAgent(agentFile);
      agents.push(agent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        errors.push(`Failed to parse global AGENTS.md: ${error}`);
      }
    }

    // 2. Check project AGENTS.md and agents/ directory
    if (projectPath) {
      const projectAgentsPath = path.join(projectPath, 'AGENTS.md');
      try {
        const agentFile = await this.agentParser.parse(projectAgentsPath, 'project');
        const agent = this.agentParser.toAgent(agentFile);
        agents.push(agent);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          errors.push(`Failed to parse project AGENTS.md: ${error}`);
        }
      }

      // 3. Scan agents/ directory in project (agents/{name}.md or agents/{name}/agent.md)
      await this.scanAgentsDirectory(projectPath, agents, errors);

      // 4. Scan nested AGENTS.md in project subdirectories
      await this.scanNestedAgents(projectPath, agents, errors);
    }

    // 5. Also scan agents/ directory in global root
    await this.scanAgentsDirectory(rootPath, agents, errors);

    return { agents, errors };
  }

  /**
   * Scan agents/ directory for agent definitions
   * Supports both:
   *   - agents/{name}.md (flat file)
   *   - agents/{name}/agent.md (subdirectory)
   */
  private async scanAgentsDirectory(
    basePath: string,
    agents: CodexAgent[],
    errors: string[]
  ): Promise<void> {
    const agentsDir = path.join(basePath, 'agents');

    try {
      await fs.access(agentsDir);
    } catch {
      return; // No agents directory, skip
    }

    const entries = await fs.readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(agentsDir, entry.name);

      if (entry.isDirectory()) {
        // Subdirectory structure: agents/{name}/agent.md
        const agentMdPath = path.join(fullPath, 'agent.md');
        try {
          const agentFile = await this.agentParser.parse(agentMdPath, entry.name);
          const agent = this.agentParser.toAgent(agentFile);
          agents.push(agent);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            errors.push(`Failed to parse agent at ${agentMdPath}: ${error}`);
          }
        }
      } else if (entry.name.endsWith('.md')) {
        // Flat structure: agents/{name}.md
        const agentName = entry.name.replace('.md', '');
        try {
          const agentFile = await this.agentParser.parse(fullPath, agentName);
          const agent = this.agentParser.toAgent(agentFile);
          agents.push(agent);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            errors.push(`Failed to parse agent at ${fullPath}: ${error}`);
          }
        }
      }
    }
  }

  /**
   * Recursively scan for AGENTS.md in subdirectories
   */
  private async scanNestedAgents(
    dirPath: string,
    agents: CodexAgent[],
    errors: string[],
    depth: number = 0,
    maxDepth: number = 3
  ): Promise<void> {
    if (depth >= maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Skip hidden directories and common non-relevant dirs
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'vendor') {
            continue;
          }

          const subDirPath = path.join(dirPath, entry.name);
          const agentsPath = path.join(subDirPath, 'AGENTS.md');

          try {
            const agentFile = await this.agentParser.parse(agentsPath, entry.name);
            const agent = this.agentParser.toAgent(agentFile);
            agents.push(agent);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              errors.push(`Failed to parse AGENTS.md in ${subDirPath}: ${error}`);
            }
          }

          // Recurse into subdirectory
          await this.scanNestedAgents(subDirPath, agents, errors, depth + 1, maxDepth);
        }
      }
    } catch {
      // Directory not readable, skip
    }
  }

  /**
   * Scan skills from $CODEX_HOME/skills/
   */
  async scanSkills(rootPath: string): Promise<{ skills: CodexSkill[]; errors: string[] }> {
    const skillsDir = path.join(rootPath, 'skills');
    const errors: string[] = [];

    try {
      await fs.access(skillsDir);
    } catch {
      return { skills: [], errors: [] };
    }

    const skills: CodexSkill[] = [];
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(skillsDir, entry.name);
        try {
          const skillFile = await this.skillParser.parse(fullPath, entry.name);
          const skill = this.skillParser.toSkill(skillFile);
          skills.push(skill);
        } catch (error) {
          errors.push(`Failed to parse skill at ${fullPath}: ${error}`);
          console.warn(`Warning: Failed to parse skill at ${fullPath}: ${error}`);
        }
      }
    }

    return { skills, errors };
  }

  /**
   * Scan settings from config.toml hierarchy
   */
  async scanSettings(rootPath: string, projectPath?: string): Promise<CodexSettings | undefined> {
    return this.configParser.scanSettings(rootPath, projectPath);
  }

  /**
   * Scan saved prompts from $CODEX_HOME/prompts/
   */
  async scanPrompts(rootPath: string): Promise<{ prompts: CodexPrompt[]; errors: string[] }> {
    const promptsDir = path.join(rootPath, 'prompts');
    const errors: string[] = [];

    try {
      await fs.access(promptsDir);
    } catch {
      return { prompts: [], errors: [] };
    }

    const prompts: CodexPrompt[] = [];
    const entries = await fs.readdir(promptsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fullPath = path.join(promptsDir, entry.name);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const name = entry.name.replace('.md', '');
          prompts.push({ name, content, path: fullPath });
        } catch (error) {
          errors.push(`Failed to read prompt at ${fullPath}: ${error}`);
        }
      }
    }

    return { prompts, errors };
  }

  /**
   * Scan session metadata from $CODEX_HOME/sessions/
   */
  async scanSessions(rootPath: string): Promise<{ sessions: CodexSession[]; errors: string[] }> {
    const sessionsDir = path.join(rootPath, 'sessions');
    const errors: string[] = [];

    try {
      await fs.access(sessionsDir);
    } catch {
      return { sessions: [], errors: [] };
    }

    const sessions: CodexSession[] = [];
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const fullPath = path.join(sessionsDir, entry.name);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const data = JSON.parse(content);
          const id = entry.name.replace('.json', '');
          sessions.push({
            id,
            createdAt: data.created_at ? new Date(data.created_at) : undefined,
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
            agentName: data.agent_name,
            summary: data.summary,
            path: fullPath
          });
        } catch (error) {
          errors.push(`Failed to read session at ${fullPath}: ${error}`);
        }
      }
    }

    return { sessions, errors };
  }

  /**
   * Check if a path is a valid Codex directory
   */
  async isCodexDirectory(checkPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(checkPath);
      if (!stats.isDirectory()) return false;

      // Check for config.toml
      const configPath = path.join(checkPath, 'config.toml');
      try {
        await fs.access(configPath);
        return true;
      } catch {}

      // Check for AGENTS.md
      const agentsPath = path.join(checkPath, 'AGENTS.md');
      try {
        await fs.access(agentsPath);
        return true;
      } catch {}

      // Check for skills directory
      const skillsDir = path.join(checkPath, 'skills');
      try {
        await fs.access(skillsDir);
        return true;
      } catch {}

      // Check for requirements.toml
      const reqPath = path.join(checkPath, 'requirements.toml');
      try {
        await fs.access(reqPath);
        return true;
      } catch {}

      return false;
    } catch {
      return false;
    }
  }

  // Safe wrappers for parallel scanning
  private async scanMCPServersSafe(rootPath: string, projectPath?: string) {
    try {
      return { servers: await this.scanMCPServers(rootPath, projectPath), error: undefined as string | undefined };
    } catch (e) {
      return { servers: undefined as CodexMCPServer[] | undefined, error: String(e) };
    }
  }

  private async scanAgentsSafe(rootPath: string, projectPath?: string) {
    try {
      return await this.scanAgents(rootPath, projectPath);
    } catch (e) {
      return { agents: [] as CodexAgent[], errors: [String(e)] };
    }
  }

  private async scanSkillsSafe(rootPath: string) {
    try {
      return await this.scanSkills(rootPath);
    } catch (e) {
      return { skills: [] as CodexSkill[], errors: [String(e)] };
    }
  }

  private async scanSettingsSafe(rootPath: string, projectPath?: string) {
    try {
      return { settings: await this.scanSettings(rootPath, projectPath) };
    } catch {
      return { settings: undefined };
    }
  }

  private async scanPromptsSafe(rootPath: string) {
    try {
      return await this.scanPrompts(rootPath);
    } catch (e) {
      return { prompts: [] as CodexPrompt[], errors: [String(e)] };
    }
  }

  private async scanSessionsSafe(rootPath: string) {
    try {
      return await this.scanSessions(rootPath);
    } catch (e) {
      return { sessions: [] as CodexSession[], errors: [String(e)] };
    }
  }
}
