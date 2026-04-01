import { Command } from 'commander';
import chalk from 'chalk';
import { 
  checkForUpdate, 
  displayUpdateStatus,
  performUpdate 
} from '../utils/version-checker.js';

export function createUpdateCommand(): Command {
  const command = new Command('update');
  
  command
    .description('Check for updates and update AgentSync CLI')
    .option('-c, --check', 'Only check for updates, do not install')
    .option('-f, --force', 'Force update even if already on latest version')
    .action(async (options) => {
      console.log(chalk.bold.blue('📦 AgentSync Update Checker\n'));
      
      if (options.check) {
        console.log(chalk.gray('Checking for updates...'));
        console.log();
        
        const updateInfo = await checkForUpdate();
        displayUpdateStatus(updateInfo);
        return;
      }
      
      if (options.force) {
        console.log(chalk.yellow('Force update requested.\n'));
        await performUpdate();
        return;
      }
      
      // Default: check and show status
      console.log(chalk.gray('Checking for updates...'));
      console.log();
      
      const updateInfo = await checkForUpdate();
      displayUpdateStatus(updateInfo);
      
      if (updateInfo.updateAvailable) {
        console.log();
        console.log(chalk.blue('Would you like to update now?'));
        console.log(chalk.gray('This will install the latest version globally.'));
        console.log();
        console.log(chalk.cyan('Run with --force to update automatically:'));
        console.log(chalk.cyan('  agentsync update --force'));
        console.log();
        console.log(chalk.gray('Or manually update with:'));
        console.log(chalk.gray('  npm install -g @agent-sync/cli@latest'));
      }
    });
  
  return command;
}
