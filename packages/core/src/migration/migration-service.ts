/**
 * Unified Migration Service - Refactored with Common Schema Support
 *
 * This service handles migrations between tools using either:
 * 1. Legacy: Direct Tool→Tool translators (existing behavior)
 * 2. Common Schema: Tool→Common Schema→Tool (new architecture)
 *
 * Migration Flow (Common Schema):
 * ```
 * Tool Root Directory
 *        ↓
 * Tool-Specific Parser
 *        ↓
 * Tool Model
 *        ↓
 * Normalizer → Common Schema (canonical format)
 *        ↓
 * Adapter → Target Tool Model
 *        ↓
 * Target Tool Writer
 * ```
 *
 * Feature Flag:
 * - USE_COMMON_SCHEMA=true: Use new Common Schema architecture
 * - USE_COMMON_SCHEMA=false (default): Use legacy direct translators
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  OpenCodeToolParser,
  ClaudeToolParser,
  toolPathRegistry
} from '../parsers/index.js';
import {
  ClaudeToOpenCodeTranslator,
  OpenCodeToClaudeTranslator
} from '../translators/index.js';
import { FileOperations } from '../file-operations.js';
import type { ToolName } from '../registry/index.js';
import type { OpenCodeToolModel } from '../parsers/opencode/types.js';
import type { ClaudeToolModel, ClaudeAgent } from '../parsers/claude/types.js';

// Common Schema imports
import {
  OpenCodeNormalizer,
  OpenCodeAdapter,
  ClaudeNormalizer,
  ClaudeAdapter
} from '../parsers/index.js';
import type { CommonSchema } from '../common-schema/types.js';

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  sourceTool: ToolName;
  targetTool: ToolName;
  sourcePath: string;
  targetPath: string;
  itemsMigrated: {
    mcpServers: number;
    agents: number;
    skills: number;
  };
  warnings: string[];
  errors: string[];
  backupPath?: string;
  usingCommonSchema?: boolean;
}

/**
 * Options for migration
 */
export interface MigrationOptions {
  sourceTool: ToolName;
  targetTool: ToolName;
  sourcePath: string;
  targetPath: string;
  backupDir: string;
  dryRun: boolean;
  verbose?: boolean;
  useCommonSchema?: boolean;
}

/**
 * Tool parser interface for polymorphism
 */
interface ToolParser {
  scan(basePath: string): Promise<{ model: unknown; errors: unknown }>;
  isValid(path: string): Promise<boolean>;
}

/**
 * Unified Migration Service with Common Schema Support
 */
export class MigrationService {
  private fileOps: FileOperations;

  // Tool parsers
  private parsers: Map<ToolName, ToolParser>;

  // Legacy translators (direct Tool→Tool)
  private translators: Map<string, unknown>;

  // Common Schema normalizers (Tool→Common)
  private normalizers: Map<ToolName, unknown>;

  // Common Schema adapters (Common→Tool)
  private adapters: Map<ToolName, unknown>;

  // Feature flag
  private useCommonSchema: boolean;

  constructor(options?: { useCommonSchema?: boolean }) {
    this.fileOps = new FileOperations();

    // Check environment variable or constructor option
    this.useCommonSchema = options?.useCommonSchema ??
      process.env.USE_COMMON_SCHEMA === 'true';

    // Initialize parsers
    this.parsers = new Map<ToolName, ToolParser>([
      ['opencode', new OpenCodeToolParser() as ToolParser],
      ['claude', new ClaudeToolParser() as ToolParser]
    ]);

    // Legacy translators (kept for backward compatibility)
    this.translators = new Map<string, unknown>([
      ['claude→opencode', new ClaudeToOpenCodeTranslator()],
      ['opencode→claude', new OpenCodeToClaudeTranslator()]
    ]);

    // Common Schema normalizers (NEW)
    this.normalizers = new Map<ToolName, unknown>([
      ['opencode', new OpenCodeNormalizer()],
      ['claude', new ClaudeNormalizer()]
    ]);

    // Common Schema adapters (NEW)
    this.adapters = new Map<ToolName, unknown>([
      ['opencode', new OpenCodeAdapter()],
      ['claude', new ClaudeAdapter()]
    ]);
  }

  /**
   * Check if Common Schema mode is enabled
   */
  isUsingCommonSchema(): boolean {
    return this.useCommonSchema;
  }

  /**
   * Enable/disable Common Schema mode
   */
  setUseCommonSchema(enabled: boolean): void {
    this.useCommonSchema = enabled;
  }

  /**
   * Perform a migration from one tool to another
   */
  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const { sourceTool, targetTool, sourcePath, targetPath, dryRun, verbose } = options;
    const warnings: string[] = [];
    const errors: string[] = [];

    // Override with per-call option if provided
    const useCommonSchema = options.useCommonSchema ?? this.useCommonSchema;

    try {
      if (verbose) {
        console.log(`Migration mode: ${useCommonSchema ? 'Common Schema' : 'Legacy (Direct)'}`);
      }

      // Validate source path
      if (verbose) console.log(`Validating source path: ${sourcePath}`);

      const sourceStats = await fs.stat(sourcePath);
      if (!sourceStats.isDirectory()) {
        throw new Error(`Source path is not a directory: ${sourcePath}`);
      }

      // Get source parser
      const sourceParser = this.parsers.get(sourceTool);
      if (!sourceParser) {
        throw new Error(`Unsupported source tool: ${sourceTool}`);
      }

      // Validate and scan source
      if (verbose) console.log(`Scanning source: ${sourceTool}`);

      const isValid = await sourceParser.isValid(sourcePath);
      if (!isValid) {
        throw new Error(`Invalid ${sourceTool} directory: ${sourcePath}`);
      }

      const sourceScanResult = await sourceParser.scan(sourcePath);
      const sourceModel = sourceScanResult.model;

      // Perform migration using selected architecture
      let targetModel: unknown;

      if (useCommonSchema) {
        // NEW: Common Schema architecture
        if (verbose) console.log(`Using Common Schema: ${sourceTool} → Common → ${targetTool}`);
        targetModel = await this.migrateViaCommonSchema(sourceTool, targetTool, sourceModel);
      } else {
        // LEGACY: Direct translator architecture
        if (verbose) console.log(`Using Legacy: ${sourceTool} → ${targetTool}`);
        targetModel = await this.migrateViaLegacyTranslator(sourceTool, targetTool, sourceModel);
      }

      // Write target config
      if (dryRun) {
        if (verbose) console.log('Dry run - skipping write');
      } else {
        const targetDirStats = await fs.stat(targetPath);
        if (!targetDirStats.isDirectory()) {
          throw new Error(`Target path is not a directory: ${targetPath}`);
        }

        // Check if source has a global .md file (for conditional CLAUDE.md creation)
        const hasGlobalMdFile = await this.hasGlobalMdFile(sourcePath);
        if (verbose && hasGlobalMdFile) console.log('Source has global .md file - will create CLAUDE.md');

        if (verbose) console.log(`Writing target: ${targetTool}`);
        await this.writeTargetConfig(targetTool, targetPath, targetModel, { hasGlobalMdFile });
      }

      // Calculate items migrated
      const itemsMigrated = this.countMigratedItems(sourceModel);

      return {
        success: true,
        sourceTool,
        targetTool,
        sourcePath,
        targetPath,
        itemsMigrated,
        warnings,
        errors,
        usingCommonSchema: useCommonSchema
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        sourceTool,
        targetTool,
        sourcePath,
        targetPath,
        itemsMigrated: { mcpServers: 0, agents: 0, skills: 0 },
        warnings,
        errors,
        usingCommonSchema: useCommonSchema
      };
    }
  }

  /**
   * Migrate using Common Schema architecture (NEW)
   * Tool → Normalizer → Common Schema → Adapter → Tool
   */
  private async migrateViaCommonSchema(
    sourceTool: ToolName,
    targetTool: ToolName,
    sourceModel: unknown
  ): Promise<unknown> {
    // Step 1: Normalize source to Common Schema
    const normalizer = this.normalizers.get(sourceTool);
    if (!normalizer) {
      throw new Error(`No normalizer available for ${sourceTool}`);
    }

    let commonSchema: CommonSchema;
    if (sourceTool === 'opencode') {
      const n = normalizer as OpenCodeNormalizer;
      commonSchema = n.toCommonSchema(sourceModel as OpenCodeToolModel);
    } else if (sourceTool === 'claude') {
      const n = normalizer as ClaudeNormalizer;
      commonSchema = n.toCommonSchema(sourceModel as ClaudeToolModel);
    } else {
      throw new Error(`Common Schema not yet supported for ${sourceTool}`);
    }

    // Step 2: Adapt Common Schema to target
    const adapter = this.adapters.get(targetTool);
    if (!adapter) {
      throw new Error(`No adapter available for ${targetTool}`);
    }

    if (targetTool === 'opencode') {
      const a = adapter as OpenCodeAdapter;
      return a.fromCommonSchema(commonSchema);
    } else if (targetTool === 'claude') {
      const a = adapter as ClaudeAdapter;
      return a.fromCommonSchema(commonSchema);
    } else {
      throw new Error(`Common Schema not yet supported for ${targetTool}`);
    }
  }

  /**
   * Migrate using legacy direct translators (LEGACY)
   * Tool → Translator → Tool
   */
  private async migrateViaLegacyTranslator(
    sourceTool: ToolName,
    targetTool: ToolName,
    sourceModel: unknown
  ): Promise<unknown> {
    const translatorKey = `${sourceTool}→${targetTool}`;
    const translator = this.translators.get(translatorKey);

    if (!translator) {
      throw new Error(`No legacy translator available for ${sourceTool} → ${targetTool}`);
    }

    // Handle Claude ↔ OpenCode
    if (sourceTool === 'claude' && targetTool === 'opencode') {
      const t = translator as ClaudeToOpenCodeTranslator;
      return t.translate(sourceModel as Parameters<typeof t.translate>[0]);
    } else if (sourceTool === 'opencode' && targetTool === 'claude') {
      const t = translator as OpenCodeToClaudeTranslator;
      return t.translate(sourceModel as Parameters<typeof t.translate>[0]);
    }

    throw new Error(`Legacy translation from ${sourceTool} to ${targetTool} not supported`);
  }

  /**
   * Check if source directory has a global .md file (CLAUDE.md, README.md, etc.)
   */
  private async hasGlobalMdFile(sourcePath: string): Promise<boolean> {
    const globalMdFiles = ['CLAUDE.md', 'README.md', 'AGENTS.md', 'claude.md', 'readme.md'];
    
    for (const file of globalMdFiles) {
      try {
        await fs.access(path.join(sourcePath, file));
        return true;
      } catch {
        // File doesn't exist, continue checking
      }
    }
    
    return false;
  }

  /**
   * Write target configuration based on tool type
   */
  private async writeTargetConfig(
    tool: ToolName,
    targetPath: string,
    config: unknown,
    options: { hasGlobalMdFile?: boolean } = {}
  ): Promise<void> {
    switch (tool) {
      case 'opencode':
        await this.writeOpenCodeConfig(targetPath, config as OpenCodeToolModel);
        break;
      case 'claude':
        await this.writeClaudeConfig(targetPath, config as ClaudeToolModel, options);
        break;
      default:
        throw new Error(`Writing ${tool} config not yet implemented`);
    }
  }

  /**
   * Write OpenCode configuration to opencode.json
   */
  private async writeOpenCodeConfig(targetPath: string, config: OpenCodeToolModel): Promise<void> {
    // Write MCP servers to opencode.json format
    if (config.mcpServers && config.mcpServers.length > 0) {
      const mcpData: Record<string, unknown> = {};
      for (const server of config.mcpServers) {
        mcpData[server.name] = {
          type: server.type || 'local',
          command: server.url ? server.url : [server.command, ...server.args],
          environment: server.env,
          headers: server.headers
        };
      }
      await this.fileOps.writeConfigFile(
        path.join(targetPath, 'opencode.json'),
        { mcp: mcpData }
      );
    }

    // Write agents as individual files
    if (config.agents && config.agents.length > 0) {
      const agentsDir = path.join(targetPath, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });

      for (const agent of config.agents) {
        const agentDir = path.join(agentsDir, agent.name);
        await fs.mkdir(agentDir, { recursive: true });

        const agentContent = this.formatAgentMarkdown(agent);
        await fs.writeFile(
          path.join(agentDir, 'agent.md'),
          agentContent,
          'utf-8'
        );
      }
    }

    // Write skills as individual files
    if (config.skills && config.skills.length > 0) {
      const skillsDir = path.join(targetPath, 'skills');
      await fs.mkdir(skillsDir, { recursive: true });

      for (const skill of config.skills) {
        const skillDir = path.join(skillsDir, skill.name);
        await fs.mkdir(skillDir, { recursive: true });

        const skillContent = this.formatSkillMarkdown(skill);
        await fs.writeFile(
          path.join(skillDir, 'skill.md'),
          skillContent,
          'utf-8'
        );
      }
    }
  }

  /**
   * Write Claude Code configuration
   * 
   * Creates proper Claude Code structure:
   * - .claude/settings.json - Settings and permissions
   * - .mcp.json - MCP server configurations
   * - CLAUDE.md - Main system prompt (from primary agent) - ONLY if source has global .md
   * - .claude/agents/ - Agent definitions (if multiple agents)
   */
  private async writeClaudeConfig(
    targetPath: string, 
    config: ClaudeToolModel,
    options: { hasGlobalMdFile?: boolean } = {}
  ): Promise<void> {
    // Create .claude directory
    const claudeDir = path.join(targetPath, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });

    // 1. Write .mcp.json with MCP servers (separate file as per Claude Code spec)
    if (config.mcpServers && config.mcpServers.length > 0) {
      const mcpData: Record<string, unknown> = {};
      for (const server of config.mcpServers) {
        mcpData[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env
        };
      }
      await this.fileOps.writeConfigFile(
        path.join(targetPath, '.mcp.json'),
        { mcpServers: mcpData }
      );
    }

    // 2. Write .claude/settings.json with permissions and other settings
    const settingsData: Record<string, unknown> = {
      $schema: 'https://json.schemastore.org/claude-code-settings.json'
    };

    // Add agent tools as permissions if present
    if (config.agents && config.agents.length > 0) {
      const allTools = new Set<string>();
      config.agents.forEach(agent => {
        agent.tools?.forEach(tool => allTools.add(tool));
      });

      if (allTools.size > 0) {
        settingsData.permissions = {
          allow: Array.from(allTools).map(tool => `MCP(${tool})`)
        };
      }
    }

    await this.fileOps.writeConfigFile(
      path.join(claudeDir, 'settings.json'),
      settingsData
    );

    // 3. Write CLAUDE.md with full system prompt from primary agent
    // ONLY if the source has a global .md file (CLAUDE.md, README.md, etc.)
    if (options.hasGlobalMdFile && config.agents && config.agents.length > 0) {
      const primaryAgent = config.agents[0];
      const claudeMdContent = this.buildClaudeMd(primaryAgent, config.agents);
      
      await fs.writeFile(
        path.join(targetPath, 'CLAUDE.md'),
        claudeMdContent,
        'utf-8'
      );
    }

    // 4. Write agents to .claude/agents/ (ALWAYS, regardless of global .md file)
    // In Claude Code, agents are separate from CLAUDE.md
    if (config.agents && config.agents.length > 0) {
      const agentsDir = path.join(claudeDir, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });

      for (const agent of config.agents) {
        const agentContent = this.buildAgentMd(agent);
        await fs.writeFile(
          path.join(agentsDir, `${agent.name}.md`),
          agentContent,
          'utf-8'
        );
      }
    }

    // 5. Migrate skills to .claude/skills/<name>/SKILL.md
    if (config.skills && config.skills.length > 0) {
      const skillsDir = path.join(claudeDir, 'skills');
      await fs.mkdir(skillsDir, { recursive: true });

      for (const skill of config.skills) {
        const skillDir = path.join(skillsDir, skill.name);
        await fs.mkdir(skillDir, { recursive: true });

        const skillContent = this.buildSkillMd(skill);
        await fs.writeFile(
          path.join(skillDir, 'SKILL.md'),
          skillContent,
          'utf-8'
        );
      }
    }

    // 6. Write original agent files backup to preserve full content
    if (config.agents && config.agents.length > 0) {
      const backupDir = path.join(targetPath, '.claude', 'migrated-agents');
      await fs.mkdir(backupDir, { recursive: true });

      for (const agent of config.agents) {
        const agentBackup = {
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          tools: agent.tools,
          _migratedFrom: 'opencode',
          _migratedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
          path.join(backupDir, `${agent.name}.json`),
          JSON.stringify(agentBackup, null, 2),
          'utf-8'
        );
      }
    }
  }

  /**
   * Build SKILL.md content for Claude Code skills
   * Full content preserved with proper frontmatter
   */
  private buildSkillMd(skill: { name: string; description: string; instructions?: string; enabled: boolean; content: string }): string {
    const sections: string[] = [];

    // Frontmatter
    sections.push('---');
    sections.push(`name: ${skill.name}`);
    sections.push(`description: ${skill.description}`);
    sections.push(`enabled: ${skill.enabled}`);
    if (skill.instructions) {
      sections.push(`instructions: ${skill.instructions}`);
    }
    sections.push('---');
    sections.push('');

    // Full content (instructions + any additional content)
    if (skill.content) {
      sections.push(skill.content);
    } else if (skill.instructions) {
      sections.push(skill.instructions);
    }

    return sections.join('\n');
  }

  /**
   * Build CLAUDE.md content from primary agent
   * Preserves full system prompt and all agent details
   */
  private buildClaudeMd(primaryAgent: ClaudeAgent, allAgents: ClaudeAgent[]): string {
    const sections: string[] = [];

    // Title and description
    sections.push(`# ${primaryAgent.name}`);
    sections.push('');
    sections.push(primaryAgent.description);
    sections.push('');

    // Full system prompt (the main content)
    if (primaryAgent.systemPrompt) {
      sections.push(primaryAgent.systemPrompt);
      sections.push('');
    }

    // Additional agents section if multiple
    if (allAgents.length > 1) {
      sections.push('## Additional Agents');
      sections.push('');
      sections.push('This project has multiple specialized agents available in `.claude/agents/`:');
      sections.push('');

      for (let i = 1; i < allAgents.length; i++) {
        const agent = allAgents[i];
        sections.push(`- **${agent.name}**: ${agent.description}`);
      }
      sections.push('');
      sections.push('Use `@agent-name` to invoke a specific agent.');
      sections.push('');
    }

    // Tools section
    if (primaryAgent.tools && primaryAgent.tools.length > 0) {
      sections.push('## Available Tools');
      sections.push('');
      sections.push('This agent has access to the following tools:');
      sections.push('');

      for (const tool of primaryAgent.tools) {
        sections.push(`- ${tool}`);
      }
      sections.push('');
    }

    // Migration metadata
    sections.push('---');
    sections.push('');
    sections.push('*Migrated from OpenCode to Claude Code*');
    sections.push(`*Migration date: ${new Date().toISOString()}*`);

    return sections.join('\n');
  }

  /**
   * Build individual agent .md file for .claude/agents/
   */
  private buildAgentMd(agent: ClaudeAgent): string {
    const sections: string[] = [];

    // Frontmatter
    sections.push('---');
    sections.push(`name: ${agent.name}`);
    sections.push(`description: ${agent.description}`);
    if (agent.tools && agent.tools.length > 0) {
      sections.push('tools:');
      for (const tool of agent.tools) {
        sections.push(`  - ${tool}`);
      }
    }
    sections.push('---');
    sections.push('');

    // Title
    sections.push(`# ${agent.name}`);
    sections.push('');
    sections.push(agent.description);
    sections.push('');

    // Full system prompt
    if (agent.systemPrompt) {
      sections.push(agent.systemPrompt);
    }

    return sections.join('\n');
  }

  /**
   * Format agent as Markdown with frontmatter
   */
  private formatAgentMarkdown(agent: { name: string; description: string; systemPrompt?: string; tools?: string[] }): string {
    const frontmatter = [
      '---',
      `description: ${agent.description}`,
      agent.systemPrompt ? `system_prompt: ${agent.systemPrompt}` : '',
      agent.tools && agent.tools.length > 0
        ? `tools:\n${agent.tools.map(t => `  - ${t}`).join('\n')}`
        : '',
      '---',
      '',
      `# ${agent.name}`,
      '',
      agent.description
    ].filter(line => line !== '').join('\n');

    return frontmatter;
  }

  /**
   * Format skill as Markdown with frontmatter
   */
  private formatSkillMarkdown(skill: { name: string; description: string; instructions?: string; enabled: boolean; content: string }): string {
    const frontmatter = [
      '---',
      `description: ${skill.description}`,
      skill.instructions ? `instructions: ${skill.instructions}` : '',
      `enabled: ${skill.enabled}`,
      '---',
      '',
      `# ${skill.name}`,
      '',
      skill.content
    ].filter(line => line !== '').join('\n');

    return frontmatter;
  }

  /**
   * Count migrated items from source model
   */
  private countMigratedItems(model: unknown): { mcpServers: number; agents: number; skills: number } {
    const m = model as { mcpServers?: unknown[]; agents?: unknown[]; skills?: unknown[] };
    return {
      mcpServers: m.mcpServers?.length || 0,
      agents: m.agents?.length || 0,
      skills: m.skills?.length || 0
    };
  }

  /**
   * Check if a tool directory is valid
   */
  async validateToolDirectory(tool: ToolName, dirPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return { valid: false, error: 'Path is not a directory' };
      }

      const parser = this.parsers.get(tool);
      if (!parser) {
        return { valid: false, error: `Unsupported tool: ${tool}` };
      }

      const isValid = await parser.isValid(dirPath);
      if (!isValid) {
        return { valid: false, error: `Not a valid ${tool} directory` };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get the default directory for a tool (global installation)
   */
  getDefaultDirectory(tool: ToolName): string {
    return toolPathRegistry.getDefaultPath(tool, true);
  }
}
