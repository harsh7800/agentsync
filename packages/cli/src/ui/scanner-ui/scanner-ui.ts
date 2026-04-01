import ora, { type Ora } from 'ora';
import chalk from 'chalk';

/**
 * Options for ScannerUI
 */
export interface ScannerUIOptions {
  /** Suppress all output (useful for testing) */
  silent?: boolean;
  /** Show verbose output */
  verbose?: boolean;
}

/**
 * Scan scope types
 */
export type ScanScope = 'current' | 'system' | 'custom';

/**
 * Progress update during scanning
 */
export interface ScanProgress {
  /** Current directory being scanned */
  currentDirectory: string;
  /** Number of directories scanned so far */
  directoriesScanned: number;
  /** Total number of directories to scan */
  totalDirectories: number;
  /** Number of agents found so far */
  agentsFound: number;
  /** Number of skills found so far */
  skillsFound: number;
  /** Number of MCP servers found so far */
  mcpServersFound: number;
  /** Tools detected during scan */
  toolsDetected: string[];
}

/**
 * Summary of completed scan
 */
export interface ScanSummary {
  /** Tools that were detected */
  toolsDetected: string[];
  /** Total number of agents found */
  totalAgents: number;
  /** Total number of skills found */
  totalSkills: number;
  /** Total number of MCP servers found */
  totalMCPServers: number;
  /** Paths that were scanned */
  scannedPaths: string[];
  /** Duration of scan in milliseconds */
  duration: number;
  /** Whether the scan was successful */
  success: boolean;
}

/**
 * ScannerUI provides real-time visual feedback during directory scanning.
 * Uses ora spinners and chalk for colorized terminal output.
 */
export class ScannerUI {
  private spinner: Ora | null = null;
  private options: ScannerUIOptions;
  private agents: string[] = [];
  private skills: string[] = [];
  private mcpServers: string[] = [];
  private tools: string[] = [];

  constructor(options: ScannerUIOptions = {}) {
    this.options = {
      silent: false,
      verbose: false,
      ...options
    };
  }

  /**
   * Starts the scanning process with initial spinner state
   * @param scope - The scan scope (current, system, or custom)
   * @param customPath - Optional custom path for 'custom' scope
   */
  startScan(scope: ScanScope, customPath?: string): void {
    if (this.options.silent) {
      return;
    }

    // Reset internal state
    this.agents = [];
    this.skills = [];
    this.mcpServers = [];
    this.tools = [];

    let text: string;
    switch (scope) {
      case 'current':
        text = 'Scanning current directory...';
        break;
      case 'system':
        text = 'Scanning system-wide configurations...';
        break;
      case 'custom':
        text = `Scanning ${customPath || 'custom path'}...`;
        break;
      default:
        text = 'Scanning...';
    }

    this.spinner = ora({
      text: chalk.blue(text),
      spinner: 'dots'
    }).start();
  }

  /**
   * Updates the spinner with current progress information
   * @param progress - Current scan progress
   */
  updateProgress(progress: ScanProgress): void {
    if (this.options.silent || !this.spinner) {
      return;
    }

    const counts: string[] = [];
    if (progress.agentsFound > 0) {
      counts.push(`${progress.agentsFound} agents`);
    }
    if (progress.skillsFound > 0) {
      counts.push(`${progress.skillsFound} skills`);
    }
    if (progress.mcpServersFound > 0) {
      counts.push(`${progress.mcpServersFound} MCP servers`);
    }

    const countText = counts.length > 0 ? ` (Found ${counts.join(', ')})` : '';
    this.spinner.text = chalk.blue(`Scanning ${progress.currentDirectory}...${countText}`);
  }

  /**
   * Reports discovery of an agent configuration
   * @param agentName - Name of the discovered agent
   * @param source - Source path of the agent
   */
  reportAgentFound(agentName: string, source: string): void {
    this.agents.push(agentName);
    
    if (this.options.silent) {
      return;
    }

    const truncatedSource = this.truncatePath(source, 40);
    console.log(chalk.green(`  ✓ Found agent: ${agentName}`) + chalk.gray(` (${truncatedSource})`));
  }

  /**
   * Reports discovery of a skill
   * @param skillName - Name of the discovered skill
   * @param source - Source path of the skill
   */
  reportSkillFound(skillName: string, source: string): void {
    this.skills.push(skillName);
    
    if (this.options.silent) {
      return;
    }

    const truncatedSource = this.truncatePath(source, 40);
    console.log(chalk.green(`  ✓ Found skill: ${skillName}`) + chalk.gray(` (${truncatedSource})`));
  }

  /**
   * Reports discovery of an MCP server
   * @param serverName - Name of the discovered MCP server
   * @param source - Source path of the server
   */
  reportMCPServerFound(serverName: string, source: string): void {
    this.mcpServers.push(serverName);
    
    if (this.options.silent) {
      return;
    }

    const truncatedSource = this.truncatePath(source, 40);
    console.log(chalk.green(`  ✓ Found MCP server: ${serverName}`) + chalk.gray(` (${truncatedSource})`));
  }

  /**
   * Reports detection of a tool
   * @param toolName - Name of the detected tool
   */
  reportToolDetected(toolName: string): void {
    if (!this.tools.includes(toolName)) {
      this.tools.push(toolName);
    }
    
    if (this.options.silent) {
      return;
    }

    console.log(chalk.cyan(`  ℹ Detected tool: ${toolName}`));
  }

  /**
   * Completes the scan and displays formatted summary
   * @param summary - Summary of the completed scan
   */
  completeScan(summary: ScanSummary): void {
    if (!this.options.silent && this.spinner) {
      this.spinner.succeed(chalk.green('Scan complete!'));
    }

    if (this.options.silent) {
      return;
    }

    // Build summary output
    const lines: string[] = [];
    
    lines.push('');
    lines.push(chalk.bold.cyan('═══════════════════════════════════════════'));
    lines.push(chalk.bold.cyan('           SCAN COMPLETE'));
    lines.push(chalk.bold.cyan('═══════════════════════════════════════════'));
    lines.push('');
    
    // Tools detected
    if (summary.toolsDetected.length === 0) {
      lines.push(chalk.yellow('No tools detected.'));
    } else {
      lines.push(chalk.bold('Tools Detected:'));
      summary.toolsDetected.forEach(tool => {
        lines.push(chalk.green(`  ✔ ${tool}`));
      });
    }
    
    lines.push('');
    
    // Agents found
    lines.push(chalk.bold(`Agents Found: ${summary.totalAgents}`));
    if (summary.totalAgents > 0) {
      const agentsToShow = this.agents.slice(0, 3);
      agentsToShow.forEach(agent => {
        lines.push(chalk.gray(`  • ${agent}`));
      });
      if (summary.totalAgents > 3) {
        lines.push(chalk.gray(`  • (${summary.totalAgents - 3} more...)`));
      }
    }
    
    lines.push('');
    
    // Skills found
    lines.push(chalk.bold(`Skills Found: ${summary.totalSkills}`));
    if (summary.totalSkills > 0 && this.skills.length > 0) {
      const skillsToShow = this.skills.slice(0, 5);
      skillsToShow.forEach(skill => {
        lines.push(chalk.gray(`  • ${skill}`));
      });
      if (summary.totalSkills > 5) {
        lines.push(chalk.gray(`  • (${summary.totalSkills - 5} more...)`));
      }
    }
    
    lines.push('');
    
    // MCP servers
    lines.push(chalk.bold('MCP Servers:'));
    if (summary.totalMCPServers === 0) {
      lines.push(chalk.gray('  None found'));
    } else {
      lines.push(chalk.green(`  ${summary.totalMCPServers} server(s) detected`));
    }
    
    lines.push('');
    
    // Locations
    if (summary.scannedPaths.length > 0) {
      lines.push(chalk.bold('Locations:'));
      summary.scannedPaths.forEach(path => {
        lines.push(chalk.gray(`  ${path}`));
      });
      lines.push('');
    }
    
    // Duration
    const durationSec = (summary.duration / 1000).toFixed(1);
    lines.push(chalk.gray(`Duration: ${durationSec}s`));
    
    lines.push('');
    lines.push(chalk.bold.cyan('═══════════════════════════════════════════'));
    
    console.log(lines.join('\n'));
  }

  /**
   * Handles scan failure with error display
   * @param error - Error that caused the failure
   */
  failScan(error: Error): void {
    if (!this.options.silent && this.spinner) {
      this.spinner.fail(chalk.red(`Scan failed: ${error.message}`));
    }

    if (this.options.silent) {
      return;
    }

    console.log('');
    console.log(chalk.red('═══════════════════════════════════════════'));
    console.log(chalk.red('           SCAN FAILED'));
    console.log(chalk.red('═══════════════════════════════════════════'));
    console.log('');
    console.log(chalk.red(`Error: ${error.message}`));
    console.log('');
    console.log(chalk.yellow('Troubleshooting tips:'));
    console.log(chalk.gray('  • Check that you have permission to access the scanned directories'));
    console.log(chalk.gray('  • Verify the paths exist and are accessible'));
    console.log(chalk.gray('  • Try running with a more specific scope'));
    console.log('');
    console.log(chalk.red('═══════════════════════════════════════════'));
  }

  /**
   * Truncates a path to a maximum length
   * @param path - Path to truncate
   * @param maxLength - Maximum length
   * @returns Truncated path
   */
  private truncatePath(path: string, maxLength: number): string {
    if (path.length <= maxLength) {
      return path;
    }
    return '...' + path.slice(-(maxLength - 3));
  }
}

export default ScannerUI;
