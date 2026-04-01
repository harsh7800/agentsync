#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { createMigrateCommand } from './commands/migrate.js';
import { createInteractiveCommand } from './commands/interactive.js';
import { createScanCommand } from './commands/scan.js';
import { createVerifyCommand } from './commands/verify.js';
import { Banner, Colors } from './ui/index.js';
import { FileOperations } from '@agent-sync/core';
import * as path from 'path';
import * as os from 'os';

// Export interactive components
export { InteractiveConflictResolver } from './interactive/conflict-resolver.js';
export { InteractiveMappingPrompts } from './interactive/mapping-prompts.js';

// Export Agent Mode components
export { AgentLoop } from './interactive/agent-loop.js';
export { CommandRegistry } from './interactive/command-registry.js';
export { SessionStateManager, createSessionState } from './interactive/session-state.js';
export { scanHandler } from './interactive/commands/scan.js';
export { statusHandler } from './interactive/commands/status.js';
export { helpHandler } from './interactive/commands/help.js';
export { exitHandler } from './interactive/commands/exit.js';

// Export types
export type { SlashCommand, CommandContext, CommandResult, SessionState } from './interactive/types.js';

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
program.addCommand(createVerifyCommand());

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

// Import types for Agent Mode
import type { SlashCommand } from './interactive/types.js';

// If no args provided, launch Agent Mode (REPL with slash commands)
if (noArgsProvided) {
  setTimeout(async () => {
    const { AgentLoop } = await import('./interactive/agent-loop.js');
    const { scanHandler } = await import('./interactive/commands/scan.js');
    const { statusHandler } = await import('./interactive/commands/status.js');
    const { helpHandler } = await import('./interactive/commands/help.js');
    const { exitHandler } = await import('./interactive/commands/exit.js');

    // Create Agent Loop instance
    const agentLoop = new AgentLoop();

    // Register slash commands
    const scanCommand: SlashCommand = {
      name: 'scan',
      description: 'Scan for agents and tools',
      usage: '/scan [current|system|custom]',
      execute: scanHandler
    };

    const statusCommand: SlashCommand = {
      name: 'status',
      description: 'Show current session state',
      usage: '/status',
      execute: statusHandler
    };

    const helpCommand: SlashCommand = {
      name: 'help',
      description: 'Show available commands',
      usage: '/help',
      aliases: ['h'],
      execute: helpHandler
    };

    const exitCommand: SlashCommand = {
      name: 'exit',
      description: 'Exit Agent Mode',
      usage: '/exit',
      aliases: ['quit', 'q'],
      execute: exitHandler
    };

    // Register commands
    agentLoop.registerCommand(scanCommand);
    agentLoop.registerCommand(statusCommand);
    agentLoop.registerCommand(helpCommand);
    agentLoop.registerCommand(exitCommand);

    // Start Agent Mode
    try {
      await agentLoop.start();
    } catch (error) {
      console.error('Error in Agent Mode:', error);
      process.exit(1);
    }
  }, 100);
} else {
  program.parse();
}
