import ora, { type Ora } from 'ora';
import chalk from 'chalk';

/**
 * Spinner Manager for CLI operations
 * 
 * Provides visual feedback for long-running operations like:
 * - Reading configs
 * - Parsing configs
 * - AI mapping
 * - Writing files
 * - Backups
 */
export class Spinner {
  private spinner: Ora | null = null;

  /**
   * Start a spinner with the given text
   */
  start(text: string): this {
    this.spinner = ora({
      text: chalk.blue(text),
      spinner: 'dots'
    }).start();
    return this;
  }

  /**
   * Update spinner text
   */
  setText(text: string): this {
    if (this.spinner) {
      this.spinner.text = chalk.blue(text);
    }
    return this;
  }

  /**
   * Stop spinner with success
   */
  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text ? chalk.green(text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with warning
   */
  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text ? chalk.yellow(text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text ? chalk.red(text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner without changing text
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

/**
 * Predefined spinner steps for migration workflow
 */
export const MigrationSpinners = {
  async run<T>(
    operation: () => Promise<T>,
    startText: string,
    successText: string
  ): Promise<T> {
    const spinner = new Spinner();
    spinner.start(startText);
    
    try {
      const result = await operation();
      spinner.succeed(successText);
      return result;
    } catch (error) {
      spinner.fail(`Failed: ${startText}`);
      throw error;
    }
  },

  // Predefined migration steps
  readingSource: 'Reading source configuration...',
  parsingMCP: 'Parsing MCP servers...',
  parsingAgents: 'Parsing agents...',
  mappingConfig: 'Mapping configuration...',
  maskingKeys: 'Masking API keys...',
  creatingBackup: 'Creating backup...',
  writingConfig: 'Writing target configuration...',
  validatingConfig: 'Validating configuration...'
};
