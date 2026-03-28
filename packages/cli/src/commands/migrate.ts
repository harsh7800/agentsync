import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import { MigrationService } from '@agent-sync/core';
import { toolPathRegistry } from '@agent-sync/core';
import type { ToolName } from '@agent-sync/core';
import { MigrationSummary, Section, Spinner } from '../ui/index.js';

const VALID_TOOLS: ToolName[] = ['claude', 'opencode', 'gemini', 'cursor', 'copilot'];

export function createMigrateCommand(): Command {
  const command = new Command('migrate')
    .description('Migrate configuration from one AI tool to another')
    .requiredOption('--from <tool>', 'Source tool (claude, opencode, gemini, cursor, copilot)')
    .requiredOption('--to <tool>', 'Target tool (claude, opencode, gemini, cursor, copilot)')
    .option('--source <path>', 'Path to source tool root directory')
    .option('--target <path>', 'Path to target tool root directory')
    .option('--backup-dir <path>', 'Directory for backups', path.join(os.homedir(), '.agentsync', 'backups'))
    .option('--dry-run', 'Show what would be migrated without making changes')
    .option('--verbose', 'Enable verbose logging')
    .option('--ai-assist', 'Use AI-assisted mapping with smart suggestions')
    .option('--manual', 'Use manual mapping mode (no AI suggestions)')
    .action(async (options) => {
      try {
        await executeMigration(options);
      } catch (error) {
        Section.error(`Migration failed: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  return command;
}

interface MigrationOptions {
  from: string;
  to: string;
  source?: string;
  target?: string;
  backupDir: string;
  dryRun?: boolean;
  verbose?: boolean;
  aiAssist?: boolean;
  manual?: boolean;
}

async function executeMigration(options: MigrationOptions): Promise<void> {
  const sourceTool = options.from as ToolName;
  const targetTool = options.to as ToolName;

  // Validate tool names
  if (!VALID_TOOLS.includes(sourceTool)) {
    throw new Error(`Invalid source tool: ${sourceTool}. Valid options: ${VALID_TOOLS.join(', ')}`);
  }
  if (!VALID_TOOLS.includes(targetTool)) {
    throw new Error(`Invalid target tool: ${targetTool}. Valid options: ${VALID_TOOLS.join(', ')}`);
  }
  if (sourceTool === targetTool) {
    throw new Error('Source and target tools must be different');
  }

  // Determine tool root directories (not config files)
  const sourcePath = options.source || toolPathRegistry.getDefaultPath(sourceTool, true);
  const targetPath = options.target || toolPathRegistry.getDefaultPath(targetTool, true);

  if (options.verbose) {
    Section.info(`Source tool: ${sourceTool}`);
    Section.info(`Source directory: ${sourcePath}`);
    Section.info(`Target tool: ${targetTool}`);
    Section.info(`Target directory: ${targetPath}`);
    Section.info(`Backup directory: ${options.backupDir}`);
  }

  // Initialize migration service
  const migrationService = new MigrationService();

  // Validate source directory
  const validationSpinner = new Spinner();
  validationSpinner.start(`Validating source directory: ${sourcePath}`);
  const validation = await migrationService.validateToolDirectory(sourceTool, sourcePath);
  
  if (!validation.valid) {
    validationSpinner.fail(`Invalid source directory: ${validation.error}`);
    throw new Error(
      `Source directory is not a valid ${sourceTool} directory.\n` +
      `Please specify the tool root directory (e.g., ~/.config/${sourceTool}/)\n` +
      `or use --source to specify a custom path.`
    );
  }
  validationSpinner.succeed('Source directory validated');

  // Check if target directory exists
  const fs = await import('fs/promises');
  const targetValidation = await migrationService.validateToolDirectory(targetTool, targetPath);
  
  // Create backup if target exists and not dry run
  let backupPath: string | undefined;
  if (targetValidation.valid && !options.dryRun) {
    const backupSpinner = new Spinner();
    backupSpinner.start('Creating backup...');
    try {
      await fs.mkdir(options.backupDir, { recursive: true });
      const targetFiles = await fs.readdir(targetPath);
      if (targetFiles.length > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path.join(options.backupDir, `${targetTool}-${timestamp}`);
        await fs.cp(targetPath, backupPath, { recursive: true });
      }
      backupSpinner.succeed('Backup created');
    } catch (error) {
      backupSpinner.fail('Backup failed');
      if (options.verbose) {
        Section.warning(`Could not create backup: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  if (!targetValidation.valid && !options.dryRun) {
    // Create target directory if it doesn't exist
    try {
      await fs.mkdir(targetPath, { recursive: true });
      if (options.verbose) {
        Section.info(`Created target directory: ${targetPath}`);
      }
    } catch {
      // Directory might already exist or we don't have permissions
    }
  }

  // Perform migration using MigrationService
  const migrateSpinner = new Spinner();
  migrateSpinner.start(`Migrating ${chalk.cyan(sourceTool)} → ${chalk.cyan(targetTool)}...`);

  try {
    const result = await migrationService.migrate({
      sourceTool,
      targetTool,
      sourcePath,
      targetPath,
      backupDir: options.backupDir,
      dryRun: options.dryRun || false,
      verbose: options.verbose
    });
    migrateSpinner.succeed('Migration complete');

    // Calculate migration stats
    const mcpServersCount = result.itemsMigrated.mcpServers;
    const agentsCount = result.itemsMigrated.agents;
    const skillsCount = result.itemsMigrated.skills;

    // Handle warnings and errors
    if (result.warnings.length > 0 && options.verbose) {
      for (const warning of result.warnings) {
        Section.warning(warning);
      }
    }

    if (!result.success) {
      throw new Error(result.errors.join('\n'));
    }

    // Dry run mode
    if (options.dryRun) {
      MigrationSummary.showDryRun({
        sourceTool,
        targetTool,
        mcpServersCount,
        agentsCount,
        skillsCount,
        warningsCount: result.warnings.length
      });
      return;
    }

    // Show migration summary
    MigrationSummary.show({
      sourceTool,
      targetTool,
      mcpServersCount,
      agentsCount,
      skillsCount,
      warningsCount: result.warnings.length,
      backupPath
    });

  } catch (error) {
    migrateSpinner.fail('Migration failed');
    throw error;
  }
}
