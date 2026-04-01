/**
 * Sync command handler for agent mode
 * 
 * Usage: /sync [scope]
 * 
 * Syncs changes since last scan without full re-scan
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import type { CommandContext, CommandResult } from '../types.js';

export async function syncHandler(
  args: string[],
  context: CommandContext
): Promise<CommandResult> {
  const scope = args[0] || 'current';
  
  console.log(chalk.blue('\n🔄 Starting sync...\n'));

  try {
    // Run the sync command
    const output = execSync(`node ${process.argv[1]} sync --scope ${scope}`, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    return {
      success: true,
      message: 'Sync completed',
    };
  } catch (error) {
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export const syncCommand = {
  name: 'sync',
  description: 'Sync and detect changes since last scan',
  usage: '/sync [current|home|system]',
  examples: [
    '/sync',
    '/sync current',
    '/sync system'
  ],
  handler: syncHandler,
};
