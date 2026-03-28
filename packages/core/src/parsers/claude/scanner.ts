/**
 * Claude Scanner
 * 
 * Scans Claude's single-file configuration structure.
 * 
 * Directory structure:
 * ```
 * ~/.config/claude/
 * └── settings.json   # Single config file with mcpServers and agents
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { 
  ClaudeToolModel, 
  ClaudeScanErrors,
  ClaudeScanResult,
  ClaudeMCPServer,
  ClaudeAgent,
  ClaudeMCPConfigInput,
  ClaudeAgentsConfigInput
} from './types.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class ClaudeScanner {
  /**
   * Scan Claude directory and extract configuration
   */
  async scan(basePath: string): Promise<ClaudeScanResult> {
    const errors: ClaudeScanErrors = {};

    // Validate directory exists
    if (!await this.isClaudeDirectory(basePath)) {
      throw new Error(`Claude directory not found: ${basePath}`);
    }

    // Find and read config file
    const configPath = await this.findConfigFile(basePath);
    if (!configPath) {
      errors.config = `No config file found in ${basePath}`;
      return {
        model: {
          tool: 'claude' as ToolName,
          rootPath: basePath,
          discovered: { agentCount: 0, mcpServerCount: 0 }
        },
        errors
      };
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Parse MCP servers
      let mcpServers: ClaudeMCPServer[] = [];
      try {
        mcpServers = this.parseMCPConfig(config);
      } catch (e) {
        errors.mcp = String(e);
      }

      // Parse agents
      let agents: ClaudeAgent[] = [];
      try {
        agents = this.parseAgents(config);
      } catch (e) {
        errors.agents = String(e);
      }

      // Extract settings (everything except mcpServers and agents)
      const settings = { ...config };
      delete settings.mcpServers;
      delete settings.agents;

      const model: ClaudeToolModel = {
        tool: 'claude' as ToolName,
        rootPath: basePath,
        mcpServers,
        agents,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        discovered: {
          agentCount: agents.length,
          mcpServerCount: mcpServers.length
        }
      };

      return { model, errors };
    } catch (error) {
      errors.config = `Failed to read config: ${error}`;
      return {
        model: {
          tool: 'claude' as ToolName,
          rootPath: basePath,
          discovered: { agentCount: 0, mcpServerCount: 0 }
        },
        errors
      };
    }
  }

  /**
   * Parse MCP configuration from Claude config
   */
  parseMCPConfig(config: { mcpServers?: Record<string, { command: string; args?: string[]; env?: Record<string, string> }> }): ClaudeMCPServer[] {
    const mcpServers: ClaudeMCPServer[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
      if (!serverConfig.command) {
        throw new Error(`MCP server "${name}" is missing required field: command`);
      }

      mcpServers.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env
      });
    }

    return mcpServers;
  }

  /**
   * Parse agents configuration from Claude config
   */
  parseAgents(config: { agents?: Record<string, { name?: string; description: string; system_prompt?: string; tools?: string[] }> }): ClaudeAgent[] {
    const agents: ClaudeAgent[] = [];

    for (const [name, agentConfig] of Object.entries(config.agents || {})) {
      agents.push({
        name: agentConfig.name || name,
        description: agentConfig.description,
        systemPrompt: agentConfig.system_prompt,
        tools: agentConfig.tools
      });
    }

    return agents;
  }

  /**
   * Find the config file in the Claude directory
   */
  async findConfigFile(basePath: string): Promise<string | undefined> {
    const configFiles = ['settings.json', 'claude.json', 'config.json'];

    for (const configFile of configFiles) {
      const fullPath = path.join(basePath, configFile);
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
   * Check if a path is a valid Claude directory
   */
  async isClaudeDirectory(checkPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(checkPath);
      if (!stats.isDirectory()) return false;

      // Check if at least one config file exists
      const configFiles = ['settings.json', 'claude.json', 'config.json'];
      for (const configFile of configFiles) {
        const filePath = path.join(checkPath, configFile);
        try {
          await fs.access(filePath);
          return true;
        } catch {}
      }

      return false;
    } catch {
      return false;
    }
  }
}
