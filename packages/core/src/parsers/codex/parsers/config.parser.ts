/**
 * Config Parser for Codex
 *
 * Parses configuration from TOML files across the Codex config hierarchy:
 * - /etc/codex/config.toml (system scope)
 * - ~/.codex/config.toml (user scope, or $CODEX_HOME/config.toml)
 * - .codex/config.toml (project scope)
 * - requirements.toml (enterprise/policy)
 *
 * Override flow: system → user → project (later scopes override earlier)
 *
 * Config.toml structure:
 * ```toml
 * [provider]
 * provider = "openai"
 * model = "gpt-4"
 * api_key = "sk-..."
 *
 * [mcp.server-name]
 * type = "local"
 * command = ["npx", "-y", "package"]
 *
 * [sandbox]
 * enabled = true
 * network_access = false
 *
 * [hooks]
 * pre_run = "echo starting"
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseToml } from 'smol-toml';
import type {
  CodexSettings,
  CodexMCPServer,
  CodexConfigInput,
  CodexMCPInput,
  CodexSandboxConfig,
  CodexHookConfig,
  CodexProviderConfig
} from '../types.js';

export class CodexConfigParser {
  /**
   * Scan and merge settings from config files across all scopes
   * Merge order: system → user → project (later overrides earlier)
   */
  async scanSettings(rootPath: string, projectPath?: string): Promise<CodexSettings | undefined> {
    const settings: CodexSettings = {};
    const systemConfigPath = path.join('/etc', 'codex', 'config.toml');
    const userConfigPath = path.join(rootPath, 'config.toml');
    const projectConfigPath = projectPath ? path.join(projectPath, 'config.toml') : undefined;
    const requirementsPath = path.join(rootPath, 'requirements.toml');

    // Merge in order: system → user → project → requirements
    await this.mergeConfigFile(systemConfigPath, settings);
    await this.mergeConfigFile(userConfigPath, settings);
    if (projectConfigPath) {
      await this.mergeConfigFile(projectConfigPath, settings);
    }
    await this.mergeConfigFile(requirementsPath, settings);

    return Object.keys(settings).length > 0 ? settings : undefined;
  }

  /**
   * Parse a single TOML config file and merge into settings
   */
  private async mergeConfigFile(filePath: string, settings: CodexSettings): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = parseToml(content) as unknown as CodexConfigInput;
      this.applyConfigInput(data, settings);
    } catch (error) {
      // File not existing is expected at various scopes
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Warning: Failed to read config at ${filePath}: ${error}`);
      }
    }
  }

  /**
   * Apply a parsed config input to settings object
   */
  private applyConfigInput(data: CodexConfigInput, settings: CodexSettings): void {
    if (data.provider) {
      settings.provider = { ...settings.provider, ...data.provider } as CodexProviderConfig;
    }

    if (data.sandbox) {
      settings.sandbox = { ...settings.sandbox, ...data.sandbox } as CodexSandboxConfig;
    }

    if (data.hooks) {
      settings.hooks = { ...settings.hooks, ...data.hooks } as CodexHookConfig;
    }

    if (data.default_agent) {
      settings.defaultAgent = data.default_agent;
    }

    if (data.default_skill) {
      settings.defaultSkill = data.default_skill;
    }

    // Preserve any additional keys
    for (const [key, value] of Object.entries(data)) {
      if (!['provider', 'mcp', 'sandbox', 'hooks', 'default_agent', 'default_skill'].includes(key)) {
        settings[key] = value;
      }
    }
  }

  /**
   * Parse MCP servers from config.toml files
   * MCP servers can be defined in any scope's config.toml under the [mcp] table
   */
  async scanMCPServers(rootPath: string, projectPath?: string): Promise<CodexMCPServer[]> {
    const servers: CodexMCPServer[] = [];
    const seen = new Set<string>();

    // Collect MCP configs from all scopes
    const configPaths = [
      path.join('/etc', 'codex', 'config.toml'),
      path.join(rootPath, 'config.toml'),
    ];
    if (projectPath) {
      configPaths.push(path.join(projectPath, 'config.toml'));
    }

    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const data = parseToml(content) as unknown as CodexConfigInput;
        const mcpConfig = data.mcp || {};

        for (const [name, serverConfig] of Object.entries(mcpConfig)) {
          // Later scopes override earlier (project > user > system)
          if (!seen.has(name)) {
            seen.add(name);
            const server = this.parseServer(name, serverConfig);
            if (server) {
              servers.push(server);
            }
          }
        }
      } catch (error) {
        // File not existing is fine
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Warning: Failed to parse MCP from ${configPath}: ${error}`);
        }
      }
    }

    return servers;
  }

  /**
   * Parse a single MCP server entry from TOML config
   */
  private parseServer(name: string, config: CodexMCPInput): CodexMCPServer | null {
    const type = config.type || (config.url ? 'remote' : 'local');

    if (type === 'remote') {
      if (!config.url) {
        console.warn(`Warning: Remote MCP server "${name}" missing url, skipping`);
        return null;
      }

      return {
        name,
        type: 'remote',
        command: '',
        args: [],
        url: config.url,
        headers: config.headers
      };
    }

    // Local server
    let command = '';
    let args: string[] = [];

    if (Array.isArray(config.command)) {
      command = config.command[0] || '';
      args = config.command.slice(1);
    } else if (typeof config.command === 'string') {
      command = config.command;
      args = config.args || [];
    }

    if (!command) {
      console.warn(`Warning: Local MCP server "${name}" missing command, skipping`);
      return null;
    }

    return {
      name,
      type: 'local',
      command,
      args,
      env: config.env
    };
  }

  /**
   * Check if a path contains a valid Codex config
   */
  async hasConfig(rootPath: string): Promise<boolean> {
    const configPath = path.join(rootPath, 'config.toml');
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }
}
