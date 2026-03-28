import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

/**
 * CLI Banner Component
 * 
 * Displays the AgentSync CLI banner with ASCII art and gradient colors.
 */
export class Banner {
  private static readonly TITLE = 'AgentSync';
  private static readonly SUBTITLE = 'AI Agent Environment Migration Tool';

  /**
   * Display the full gradient banner
   */
  static show(): void {
    const banner = figlet.textSync(this.TITLE, {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    });

    const gradientBanner = gradient(['cyan', 'purple', 'magenta'])(banner);
    console.log(gradientBanner);
    console.log(chalk.gray(this.SUBTITLE));
    console.log();
  }

  /**
   * Display a minimal banner (for compact mode)
   */
  static showMinimal(): void {
    console.log(chalk.bold.cyan('◆ AgentSync CLI'));
    console.log(chalk.gray('  Migrate AI agents, MCP servers, and configs between tools'));
    console.log();
  }

  /**
   * Display version info with banner
   */
  static showWithVersion(version: string): void {
    this.show();
    console.log(chalk.bold(`Version: ${version}`));
    console.log();
  }
}

/**
 * Color scheme for CLI elements
 */
export const Colors = {
  // Element colors as specified in cli-ui-branding.md
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  tool: chalk.cyan,
  path: chalk.gray,
  summary: chalk.magenta,
  header: chalk.bold.white,
  prompt: chalk.cyan,
  ai: chalk.hex('#9333ea'), // Purple
  
  // Utility helpers
  dim: chalk.gray,
  bold: chalk.bold,
  underline: chalk.underline
};
