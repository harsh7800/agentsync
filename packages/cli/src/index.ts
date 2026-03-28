#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { createMigrateCommand } from './commands/migrate.js';
import { createInteractiveCommand } from './commands/interactive.js';
import { createScanCommand } from './commands/scan.js';
import { Banner, Colors } from './ui/index.js';
import { FileOperations } from '@agent-sync/core';
import * as path from 'path';
import * as os from 'os';

// Export interactive components
export { InteractiveConflictResolver } from './interactive/conflict-resolver.js';
export { InteractiveMappingPrompts } from './interactive/mapping-prompts.js';

const program = new Command();

// Check if interactive mode should be launched
const args = process.argv.slice(2);
const noArgsProvided = args.length === 0;

// Show banner on startup
if (noArgsProvided || (!args[0]?.startsWith('-') && args[0] !== 'migrate')) {
  Banner.show();
}

program
  .name('agentsync')
  .description('AI-assisted CLI for migrating AI tool configurations')
  .version('1.0.0');

// Add commands
program.addCommand(createMigrateCommand());
program.addCommand(createInteractiveCommand());
program.addCommand(createScanCommand());

program
  .command('detect')
  .description('Detect installed AI tools and their configurations')
  .action(async () => {
    console.log(chalk.bold('\n🔍 Detecting installed AI tools...\n'));
    
    const fileOps = new FileOperations();
    const cwd = process.cwd();
    
    interface ToolCheck {
      name: string;
      systemPath: string;
      localPaths: string[];
    }
    
    const tools: ToolCheck[] = [
      { 
        name: 'Claude Code', 
        systemPath: path.join(os.homedir(), '.config', 'claude', 'settings.json'),
        localPaths: [
          path.join(cwd, '.claude', 'settings.json'),
          path.join(cwd, 'claude', 'settings.json'),
          path.join(cwd, '.claude.json')
        ]
      },
      { 
        name: 'OpenCode', 
        systemPath: path.join(os.homedir(), '.config', 'opencode', 'config.json'),
        localPaths: [
          path.join(cwd, '.opencode', 'config.json'),
          path.join(cwd, '.opencode.json'),
          path.join(cwd, 'packages', 'opencode', 'config.json'),
          path.join(cwd, 'opencode', 'config.json'),
          path.join(cwd, '.opencode'),  // Directory exists check
          path.join(cwd, 'opencode')
        ]
      },
      { 
        name: 'Gemini CLI', 
        systemPath: path.join(os.homedir(), '.config', 'gemini', 'config.json'),
        localPaths: [
          path.join(cwd, '.gemini', 'config.json'),
          path.join(cwd, '.gemini.json')
        ]
      },
      { 
        name: 'Cursor', 
        systemPath: path.join(os.homedir(), '.cursor', 'config.json'),
        localPaths: [
          path.join(cwd, '.cursor', 'config.json'),
          path.join(cwd, '.cursorrules')
        ]
      },
      { 
        name: 'GitHub Copilot', 
        systemPath: path.join(os.homedir(), '.config', 'github-copilot', 'config.json'),
        localPaths: [
          path.join(cwd, '.github', 'copilot', 'config.json')
        ]
      }
    ];

    let foundCount = 0;
    for (const tool of tools) {
      // Check system path
      const systemDetected = await fileOps.detectTool(tool.systemPath);
      
      // Check local paths
      let localDetected = false;
      let localPath: string | undefined;
      for (const localConfigPath of tool.localPaths) {
        if (await fileOps.detectTool(localConfigPath)) {
          localDetected = true;
          localPath = localConfigPath;
          break;
        }
      }
      
      const detected = systemDetected || localDetected;
      const displayPath = systemDetected ? tool.systemPath : localPath;
      const location = systemDetected ? 'system' : localDetected ? 'local' : 'not found';
      
      if (detected) {
        console.log(`  ${Colors.success('✔')} ${Colors.tool(tool.name)} ${chalk.gray(`(${location})`)}`);
        if (displayPath) {
          console.log(`    ${Colors.path(displayPath)}`);
        }
        foundCount++;
      } else {
        console.log(`  ${Colors.dim('✗')} ${Colors.dim(tool.name)} (not found)`);
      }
    }

    console.log();
    if (foundCount > 0) {
      Colors.success(`Found ${foundCount} tool(s) installed.`);
      console.log(chalk.gray('\nTip: Run "agentsync interactive" to start a guided migration.\n'));
    } else {
      Colors.warning('No AI tools detected in default locations.');
      console.log(chalk.gray('\nYou can still use "agentsync migrate" with custom paths.\n'));
    }
  });

// Override help to show banner
program.on('--help', () => {
  Banner.showMinimal();
});

// If no args provided, launch interactive mode
if (noArgsProvided) {
  setTimeout(async () => {
    const interactiveCmd = createInteractiveCommand();
    const interactiveProgram = new Command();
    interactiveProgram.addCommand(interactiveCmd);
    await interactiveProgram.parseAsync(['node', 'agentsync', 'interactive']);
  }, 100);
} else {
  program.parse();
}
