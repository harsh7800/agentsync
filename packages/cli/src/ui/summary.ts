import Table from 'cli-table3';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

/**
 * Migration Summary Table
 * 
 * Formats migration results in a clean, readable table format.
 */
export interface MigrationSummaryData {
  sourceTool: string;
  targetTool: string;
  mcpServersCount: number;
  agentsCount: number;
  skillsCount?: number;
  maskedKeysCount?: number;
  warningsCount: number;
  backupPath?: string;
}

export class MigrationSummary {
  /**
   * Display migration summary table
   */
  static show(data: MigrationSummaryData): void {
    console.log();
    console.log(chalk.bold.magenta('📊 Migration Summary'));
    console.log(chalk.gray('─'.repeat(50)));

    // Migration direction
    console.log(`${chalk.cyan(data.sourceTool)} ${chalk.gray('→')} ${chalk.cyan(data.targetTool)}`);
    console.log();

    // Stats table
    const table = new Table({
      style: { head: ['cyan'] },
      colWidths: [30, 20]
    });

    table.push(
      ['MCP servers migrated', data.mcpServersCount.toString()],
      ['Agents migrated', data.agentsCount.toString()],
      ...(data.maskedKeysCount !== undefined ? [['API keys masked', data.maskedKeysCount.toString()]] : [])
    );

    if (data.skillsCount !== undefined) {
      table.push(['Skills migrated', data.skillsCount.toString()]);
    }

    if (data.warningsCount > 0) {
      table.push([chalk.yellow('Warnings'), chalk.yellow(data.warningsCount.toString())]);
    }

    console.log(table.toString());

    // Backup info
    if (data.backupPath) {
      console.log();
      console.log(`${logSymbols.info} Backup created: ${chalk.gray(data.backupPath)}`);
    }

    console.log();
    console.log(chalk.green.bold(`${logSymbols.success} Migration completed successfully!`));
    console.log();
  }

  /**
   * Show dry-run summary (what would happen)
   */
  static showDryRun(data: MigrationSummaryData): void {
    console.log();
    console.log(chalk.bold.cyan('🧪 DRY RUN MODE'));
    console.log(chalk.gray('No files were changed. This is what would happen:'));
    console.log();

    console.log(`${chalk.cyan(data.sourceTool)} ${chalk.gray('→')} ${chalk.cyan(data.targetTool)}`);
    console.log();

    const table = new Table({
      style: { head: ['cyan'] },
      colWidths: [30, 20]
    });

    table.push(
      ['MCP servers to migrate', data.mcpServersCount.toString()],
      ['Agents to migrate', data.agentsCount.toString()],
      ...(data.maskedKeysCount !== undefined ? [['API keys to mask', data.maskedKeysCount.toString()]] : [])
    );

    console.log(table.toString());
    console.log();
    console.log(chalk.yellow('⚠️  Run without --dry-run to perform the actual migration.'));
    console.log();
  }

  /**
   * Show tool detection results
   */
  static showDetectedTools(tools: Array<{ name: string; detected: boolean }>): void {
    console.log();
    console.log(chalk.bold('Detected tools:'));
    console.log();

    for (const tool of tools) {
      if (tool.detected) {
        console.log(`  ${logSymbols.success} ${chalk.cyan(tool.name)}`);
      } else {
        console.log(`  ${logSymbols.error} ${chalk.gray(tool.name)} (not found)`);
      }
    }
    console.log();
  }
}

/**
 * Section Headers
 */
export class Section {
  static header(title: string): void {
    console.log();
    console.log(chalk.bold.white(title));
    console.log(chalk.gray('─'.repeat(50)));
  }

  static subheader(title: string): void {
    console.log();
    console.log(chalk.bold(title));
  }

  static info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  static success(message: string): void {
    console.log(chalk.green(`${logSymbols.success} ${message}`));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(`${logSymbols.warning} ${message}`));
  }

  static error(message: string): void {
    console.log(chalk.red(`${logSymbols.error} ${message}`));
  }
}
