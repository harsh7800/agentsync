/**
 * /update command - Check for and install updates
 */

import chalk from 'chalk';
import type { CommandContext, CommandResult } from '../types.js';
import { 
  checkForUpdate, 
  displayUpdateStatus, 
  performUpdate 
} from '../../utils/version-checker.js';

export const name = 'update';
export const description = 'Check for updates and update AgentSync CLI';
export const shortcut = 'u';

export async function execute(context: CommandContext): Promise<CommandResult> {
  console.log(chalk.bold.blue('📦 AgentSync Update Checker\n'));
  
  const force = context.args.includes('--force') || context.args.includes('-f');
  
  console.log(chalk.gray('Checking for updates...'));
  console.log();
  
  const updateInfo = await checkForUpdate();
  
  if (!updateInfo.updateAvailable && !force) {
    displayUpdateStatus(updateInfo);
    return { success: true };
  }
  
  if (force) {
    console.log(chalk.yellow('Force update requested.\n'));
  }
  
  // Show current status
  displayUpdateStatus(updateInfo);
  
  if (updateInfo.updateAvailable || force) {
    console.log();
    console.log(chalk.blue('Would you like to update now?'));
    console.log(chalk.gray('This will install the latest version globally.'));
    console.log();
    
    // For now, just show instructions
    // In a real interactive mode, we'd prompt the user
    console.log(chalk.cyan('To update, run:'));
    console.log(chalk.cyan('  npm install -g @agent-sync/cli@latest'));
    console.log();
    console.log(chalk.gray('Or use your preferred package manager:'));
    console.log(chalk.gray('  pnpm add -g @agent-sync/cli@latest'));
    console.log(chalk.gray('  yarn global add @agent-sync/cli@latest'));
    
    // Note: Automatic update can be implemented with inquirer prompt
    // await performUpdate();
  }
  
  return { success: true };
}

export async function help(): Promise<string> {
  return `
${chalk.bold('/update')} ${chalk.gray('[options]')}

Check for available updates and update AgentSync CLI to the latest version.

${chalk.bold('Options:')}
  -f, --force    Force update check even if already on latest version

${chalk.bold('Examples:')}
  /update        Check for updates
  /update -f     Force update check

${chalk.bold('Note:')}
If an update is available, you'll see instructions for updating.
You can also run ${chalk.cyan('npm install -g @agent-sync/cli@latest')} manually.
  `;
}
