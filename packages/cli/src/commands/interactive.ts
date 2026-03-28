import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { toolPathRegistry, MigrationService } from '@agent-sync/core';
import type { ToolName } from '@agent-sync/core';
import { Banner, Colors, MigrationSummary, Section } from '../ui/index.js';
import { createMigrateCommand } from './migrate.js';
import * as path from 'path';
import * as os from 'os';

const VALID_TOOLS: ToolName[] = ['claude', 'opencode', 'gemini', 'cursor', 'copilot'];

interface DetectedTool {
  name: ToolName;
  detected: boolean;
  directory?: string;
}

/**
 * Interactive CLI Command
 * 
 * Provides an interactive, guided experience for migrations
 * with prompts for tool selection, directory paths, and options.
 */
export function createInteractiveCommand(): Command {
  const command = new Command('interactive')
    .alias('i')
    .description('Start interactive migration mode with guided prompts')
    .action(async () => {
      try {
        await runInteractiveMode();
      } catch (error) {
        Colors.error(`Interactive mode failed: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }
    });

  return command;
}

async function runInteractiveMode(): Promise<void> {
  // Show welcome banner
  console.clear();
  Banner.show();
  
  console.log(chalk.cyan('Welcome to AgentSync Interactive Mode!\n'));
  console.log(chalk.gray('This wizard will guide you through migrating AI tool configurations.\n'));

  // Step 1: Detect installed tools
  console.log(chalk.bold('Step 1: Detecting installed tools...\n'));
  const detectedTools = await detectInstalledTools();
  
  const detectedNames = detectedTools
    .filter(t => t.detected)
    .map(t => t.name);
  
  if (detectedNames.length === 0) {
    console.log(chalk.yellow('⚠️  No AI tools detected in default locations.'));
    console.log(chalk.gray('You can still specify custom directories manually.\n'));
  } else {
    console.log(chalk.green(`✓ Found ${detectedNames.length} tool(s): ${detectedNames.join(', ')}\n`));
  }

  // Step 2: Select source tool (all tools available, detected ones marked)
  const { sourceTool } = await inquirer.prompt([{
    type: 'list',
    name: 'sourceTool',
    message: 'Select the source tool (where to migrate FROM):',
    choices: VALID_TOOLS.map(tool => {
      const isDetected = detectedTools.find(t => t.name === tool)?.detected;
      return {
        name: `${getToolIcon(tool)} ${capitalize(tool)}${isDetected ? chalk.green(' ✓ detected') : ''}`,
        value: tool
      };
    }),
    pageSize: 10
  }]);

  // Step 3: Select target tool
  const otherTools = VALID_TOOLS.filter(t => t !== sourceTool);
  const { targetTool } = await inquirer.prompt([{
    type: 'list',
    name: 'targetTool',
    message: 'Select the target tool (where to migrate TO):',
    choices: otherTools.map(tool => ({
      name: `${getToolIcon(tool)} ${capitalize(tool)}`,
      value: tool
    })),
    pageSize: 10
  }]);

  console.log(chalk.gray(`\nMigration: ${Colors.tool(sourceTool)} → ${Colors.tool(targetTool)}\n`));

  // Step 4: Get source tool directory
  const defaultSourceDir = toolPathRegistry.getDefaultPath(sourceTool, true);
  const detectedTool = detectedTools.find(t => t.name === sourceTool);
  
  const { sourcePathChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'sourcePathChoice',
    message: 'Source tool directory:',
    choices: [
      ...(detectedTool?.detected && detectedTool.directory ? [{
        name: `📁 Use detected directory (${detectedTool.directory})`,
        value: 'detected'
      }] : []),
      {
        name: `📁 Use default directory (${defaultSourceDir})`,
        value: 'default'
      },
      {
        name: '📝 Specify custom directory',
        value: 'custom'
      }
    ]
  }]);

  let sourcePath: string;
  if (sourcePathChoice === 'detected' && detectedTool?.directory) {
    sourcePath = detectedTool.directory;
  } else if (sourcePathChoice === 'default') {
    sourcePath = defaultSourceDir;
  } else {
    const { customPath } = await inquirer.prompt([{
      type: 'input',
      name: 'customPath',
      message: 'Enter the full path to the source tool root directory:',
      validate: (input: string) => {
        if (input.trim() === '') return 'Path cannot be empty';
        return true;
      }
    }]);
    sourcePath = customPath;
  }

  // Step 5: Get target tool directory
  const defaultTargetDir = toolPathRegistry.getDefaultPath(targetTool, true);
  const { targetPathChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'targetPathChoice',
    message: 'Target tool directory:',
    choices: [
      {
        name: `📁 Use default directory (${defaultTargetDir})`,
        value: 'default'
      },
      {
        name: '📝 Specify custom directory',
        value: 'custom'
      }
    ]
  }]);

  let targetPath: string;
  if (targetPathChoice === 'default') {
    targetPath = defaultTargetDir;
  } else {
    const { customPath } = await inquirer.prompt([{
      type: 'input',
      name: 'customPath',
      message: 'Enter the full path to the target tool root directory:',
      validate: (input: string) => {
        if (input.trim() === '') return 'Path cannot be empty';
        return true;
      }
    }]);
    targetPath = customPath;
  }

  // Step 6: Migration options
  const { dryRun, verbose } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Perform a dry run first? (shows what would change without modifying files)',
      default: true
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose output?',
      default: false
    }
  ]);

  // Step 7: Confirmation
  console.log(chalk.bold('\n📋 Migration Summary:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Source: ${Colors.tool(sourceTool)}`);
  console.log(`  Directory: ${Colors.path(sourcePath)}`);
  console.log(`Target: ${Colors.tool(targetTool)}`);
  console.log(`  Directory: ${Colors.path(targetPath)}`);
  console.log(`Mode: ${dryRun ? chalk.yellow('Dry Run') : chalk.green('Live Migration')}`);
  console.log(chalk.gray('─'.repeat(50)));

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: 'Proceed with migration?',
    default: true
  }]);

  if (!confirmed) {
    console.log(chalk.yellow('\n⚠️  Migration cancelled by user.'));
    return;
  }

  // Execute migration using MigrationService
  const migrationService = new MigrationService();
  
  console.log();
  const migrateSpinner = await import('../ui/index.js').then(m => new m.Spinner());
  migrateSpinner.start(`Migrating ${chalk.cyan(sourceTool)} → ${chalk.cyan(targetTool)}...`);

  try {
    // Validate source directory
    const validation = await migrationService.validateToolDirectory(sourceTool, sourcePath);
    if (!validation.valid) {
      migrateSpinner.fail(`Invalid source directory: ${validation.error}`);
      throw new Error(`Source directory is not a valid ${sourceTool} directory.`);
    }

    // Ensure target directory exists for non-dry-run migrations
    if (!dryRun) {
      const fs = await import('fs/promises');
      try {
        await fs.mkdir(targetPath, { recursive: true });
        if (verbose) {
          Section.info(`Created target directory: ${targetPath}`);
        }
      } catch (error) {
        if (verbose) {
          Section.warning(`Could not create target directory: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    const result = await migrationService.migrate({
      sourceTool,
      targetTool,
      sourcePath,
      targetPath,
      backupDir: path.join(os.homedir(), '.agentsync', 'backups'),
      dryRun,
      verbose
    });
    migrateSpinner.succeed('Migration complete');

    // Show summary
    MigrationSummary.show({
      sourceTool,
      targetTool,
      mcpServersCount: result.itemsMigrated.mcpServers,
      agentsCount: result.itemsMigrated.agents,
      skillsCount: result.itemsMigrated.skills,
      warningsCount: result.warnings.length,
      backupPath: result.backupPath
    });

  } catch (error) {
    migrateSpinner.fail('Migration failed');
    throw error;
  }

  // If this was a dry run, inform the user
  if (dryRun) {
    console.log(chalk.yellow('\n⚠️  This was a dry run. No files were modified.'));
    console.log(chalk.gray('Run the command again without --dry-run to perform the actual migration.'));
  }

  console.log(chalk.green('\n✨ Interactive session complete!'));
}

/**
 * Detect installed AI tools by checking their default directories
 */
async function detectInstalledTools(): Promise<DetectedTool[]> {
  const fs = await import('fs/promises');
  const tools: DetectedTool[] = [];

  for (const tool of VALID_TOOLS) {
    const defaultDir = toolPathRegistry.getDefaultPath(tool, true);
    
    try {
      const stats = await fs.stat(defaultDir);
      if (stats.isDirectory()) {
        tools.push({
          name: tool,
          detected: true,
          directory: defaultDir
        });
      } else {
        tools.push({ name: tool, detected: false });
      }
    } catch {
      tools.push({ name: tool, detected: false });
    }
  }

  return tools;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getToolIcon(tool: string): string {
  const icons: Record<string, string> = {
    claude: '🟣',
    opencode: '🔵',
    gemini: '🔴',
    cursor: '⚪',
    copilot: '⚫'
  };
  return icons[tool.toLowerCase()] || '🔧';
}
