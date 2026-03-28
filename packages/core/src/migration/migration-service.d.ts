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
import type { ToolName } from '../registry/index.js';
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
 * Unified Migration Service
 */
export declare class MigrationService {
    private fileOps;
    private parsers;
    private translators;
    constructor();
    /**
     * Perform a migration from one tool to another
     */
    migrate(options: MigrationOptions): Promise<MigrationResult>;
    /**
     * Write target configuration based on tool type
     */
    private writeTargetConfig;
    /**
     * Write OpenCode configuration to opencode.json
     */
    private writeOpenCodeConfig;
    /**
     * Write Claude configuration to settings.json
     */
    private writeClaudeConfig;
    /**
     * Format agent as Markdown with frontmatter
     */
    private formatAgentMarkdown;
    /**
     * Format skill as Markdown with frontmatter
     */
    private formatSkillMarkdown;
    /**
     * Count migrated items from source model
     */
    private countMigratedItems;
    /**
     * Check if a tool directory is valid
     */
    validateToolDirectory(tool: ToolName, dirPath: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Get the default directory for a tool (global installation)
     */
    getDefaultDirectory(tool: ToolName): string;
}
//# sourceMappingURL=migration-service.d.ts.map