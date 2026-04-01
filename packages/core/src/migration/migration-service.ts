/**
 * Unified Migration Service
 * 
 * This service handles migrations between tools using the directory-based
 * parsing architecture. It accepts tool root directories and produces
 * tool models that can be translated.
 * 
 * Migration Flow:
 * ```
 * Tool Root Directory
 *        ↓
 * Tool-Specific Parser (OpenCodeToolParser, ClaudeToolParser, etc.)
 *        ↓
 * Tool Model (unified format)
 *        ↓
 * Translator (ClaudeToOpenCodeTranslator, etc.)
 *        ↓
 * Target Tool Model
 *        ↓
 * Target Tool Writer (writes to target directory)
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  OpenCodeToolParser, 
  ClaudeToolParser,
  GeminiParser,
  CursorParser,
  toolPathRegistry 
} from '../parsers/index.js';
import { 
  ClaudeToOpenCodeTranslator, 
  OpenCodeToClaudeTranslator,
  GeminiToClaudeTranslator,
  GeminiToOpenCodeTranslator,
  CursorToClaudeTranslator,
  CursorToOpenCodeTranslator
} from '../translators/index.js';
import { FileOperations } from '../file-operations.js';
import type { ToolName } from '../registry/index.js';
import type { OpenCodeToolModel } from '../parsers/opencode/types.js';
import type { ClaudeToolModel } from '../parsers/claude/types.js';

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
}

/**
 * Tool parser interface for polymorphism
 */
interface ToolParser {
  scan(basePath: string): Promise<{ model: unknown; errors: unknown }>;
  isValid(path: string): Promise<boolean>;
}

/**
 * Unified Migration Service
 */
export class MigrationService {
  private fileOps: FileOperations;
  
  // Tool parsers
  private parsers: Map<ToolName, ToolParser>;
  
  // Translators - use any to allow different translate signatures
  private translators: Map<string, unknown>;
  
  constructor() {
    this.fileOps = new FileOperations();
    
    // Initialize parsers with type assertions
    // Note: Gemini and Cursor use legacy parsers as directory-based parsers don't exist yet
    this.parsers = new Map<ToolName, ToolParser>([
      ['opencode', new OpenCodeToolParser() as ToolParser],
      ['claude', new ClaudeToolParser() as ToolParser]
    ]);
    
    // Initialize translators for all supported tool combinations
    this.translators = new Map<string, unknown>([
      // Claude ↔ OpenCode
      ['claude→opencode', new ClaudeToOpenCodeTranslator()],
      ['opencode→claude', new OpenCodeToClaudeTranslator()],
      // Gemini → Claude/OpenCode
      ['gemini→claude', new GeminiToClaudeTranslator()],
      ['gemini→opencode', new GeminiToOpenCodeTranslator()],
      // Cursor → Claude/OpenCode
      ['cursor→claude', new CursorToClaudeTranslator()],
      ['cursor→opencode', new CursorToOpenCodeTranslator()]
    ]);
  }
  
  /**
   * Perform a migration from one tool to another
   */
  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const { sourceTool, targetTool, sourcePath, targetPath, backupDir, dryRun, verbose } = options;
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Step 1: Validate source path is a directory
      if (verbose) console.log(`Validating source path: ${sourcePath}`);
      
      const sourceStats = await fs.stat(sourcePath);
      if (!sourceStats.isDirectory()) {
        throw new Error(`Source path is not a directory: ${sourcePath}. Please specify the tool root directory.`);
      }
      
      // Step 2: Get source parser
      const sourceParser = this.parsers.get(sourceTool);
      if (!sourceParser) {
        throw new Error(`Unsupported source tool: ${sourceTool}`);
      }
      
      // Step 3: Validate and scan source
      if (verbose) console.log(`Scanning source: ${sourceTool}`);
      
      const isValid = await sourceParser.isValid(sourcePath);
      if (!isValid) {
        throw new Error(`Invalid ${sourceTool} directory: ${sourcePath}`);
      }
      
      const sourceScanResult = await sourceParser.scan(sourcePath);
      const sourceModel = sourceScanResult.model;
      
      // Step 4: Get translator
      const translatorKey = `${sourceTool}→${targetTool}`;
      const translator = this.translators.get(translatorKey);
      
      if (!translator) {
        throw new Error(`No translator available for ${sourceTool} → ${targetTool}`);
      }
      
      // Step 5: Translate
      if (verbose) console.log(`Translating: ${sourceTool} → ${targetTool}`);
      
      // Type-safe translate call based on source/target tools
      let targetModel: unknown;
      
      // Handle Claude ↔ OpenCode
      if (sourceTool === 'claude' && targetTool === 'opencode') {
        const t = translator as ClaudeToOpenCodeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      } else if (sourceTool === 'opencode' && targetTool === 'claude') {
        const t = translator as OpenCodeToClaudeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      }
      // Handle Gemini → Claude/OpenCode
      else if (sourceTool === 'gemini' && targetTool === 'claude') {
        const t = translator as GeminiToClaudeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      } else if (sourceTool === 'gemini' && targetTool === 'opencode') {
        const t = translator as GeminiToOpenCodeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      }
      // Handle Cursor → Claude/OpenCode
      else if (sourceTool === 'cursor' && targetTool === 'claude') {
        const t = translator as CursorToClaudeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      } else if (sourceTool === 'cursor' && targetTool === 'opencode') {
        const t = translator as CursorToOpenCodeTranslator;
        targetModel = t.translate(sourceModel as Parameters<typeof t.translate>[0]);
      }
      // Note: Reverse translations (Claude/OpenCode → Gemini/Cursor) are not yet implemented
      else {
        throw new Error(`Translation from ${sourceTool} to ${targetTool} not yet supported`);
      }
      
      // Step 6: Write target config
      if (dryRun) {
        if (verbose) console.log('Dry run - skipping write');
      } else {
        // Validate target directory exists
        const targetDirStats = await fs.stat(targetPath);
        if (!targetDirStats.isDirectory()) {
          throw new Error(`Target path is not a directory: ${targetPath}`);
        }
        
        // Write based on target tool type
        if (verbose) console.log(`Writing target: ${targetTool}`);
        await this.writeTargetConfig(targetTool, targetPath, targetModel);
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
        errors
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
        errors
      };
    }
  }
  
  /**
   * Write target configuration based on tool type
   */
  private async writeTargetConfig(
    tool: ToolName, 
    targetPath: string, 
    config: unknown
  ): Promise<void> {
    switch (tool) {
      case 'opencode':
        await this.writeOpenCodeConfig(targetPath, config as OpenCodeToolModel);
        break;
      case 'claude':
        await this.writeClaudeConfig(targetPath, config as ClaudeToolModel);
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
   * Write Claude configuration to settings.json
   */
  private async writeClaudeConfig(targetPath: string, config: ClaudeToolModel): Promise<void> {
    const configData: Record<string, unknown> = {};
    
    // Write MCP servers
    if (config.mcpServers && config.mcpServers.length > 0) {
      const mcpData: Record<string, unknown> = {};
      for (const server of config.mcpServers) {
        mcpData[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env
        };
      }
      configData.mcpServers = mcpData;
    }
    
    // Write agents
    if (config.agents && config.agents.length > 0) {
      const agentsData: Record<string, unknown> = {};
      for (const agent of config.agents) {
        agentsData[agent.name] = {
          description: agent.description,
          system_prompt: agent.systemPrompt,
          tools: agent.tools
        };
      }
      configData.agents = agentsData;
    }
    
    await this.fileOps.writeConfigFile(
      path.join(targetPath, 'settings.json'),
      configData
    );
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
