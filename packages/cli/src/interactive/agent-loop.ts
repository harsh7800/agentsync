import inquirer from 'inquirer';
import type { SlashCommand, CommandContext, CommandResult, SessionState } from './types.js';
import { CommandRegistry, RegisteredCommand } from './command-registry.js';
import { Banner } from '../ui/index.js';
import chalk from 'chalk';

export interface AgentLoopConfig {
  /** REPL prompt symbol (default: "> ") */
  prompt?: string;
  /** Entry banner message */
  welcomeMessage?: string;
}

/**
 * AgentLoop - Main REPL for Interactive Agent Mode
 * 
 * Manages the interactive session with enhanced UX:
 * - Guided welcome flow
 * - Slash command autocomplete (triggers on "/")
 * - File browser for path selection
 * - Interactive prompts throughout
 */
export class AgentLoop {
  private registry: CommandRegistry;
  private session: SessionState;
  private config: Required<AgentLoopConfig>;

  constructor(config?: AgentLoopConfig) {
    this.registry = new CommandRegistry();
    this.session = this.createInitialState();
    this.config = {
      prompt: config?.prompt ?? '> ',
      welcomeMessage: config?.welcomeMessage ?? this.getDefaultWelcomeMessage()
    };
  }

  private getDefaultWelcomeMessage(): string {
    return [
      '',
      'AgentSync Interactive Mode',
      '',
      'Type / to see available commands.',
      'Type /scan to scan for agents and tools.',
      'Type /migrate to start migration.',
      'Type /exit to quit.',
      ''
    ].join('\n');
  }

  private createInitialState(): SessionState {
    return {
      scannedTools: [],
      detectedAgents: [],
      detectedSkills: [],
      detectedMCPs: [],
      scanPaths: [],
      selectedSourceTool: null,
      selectedTargetTool: null,
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the configured prompt string
   */
  getPrompt(): string {
    return this.config.prompt;
  }

  /**
   * Get the welcome message
   */
  getWelcomeMessage(): string {
    return this.config.welcomeMessage;
  }

  /**
   * Show guided welcome prompt
   */
  private async showWelcomePrompt(): Promise<'commands' | 'typing' | 'help'> {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: chalk.cyan('Welcome to AgentSync! How would you like to proceed?'),
      choices: [
        { 
          name: '🚀 Start with guided commands (recommended)', 
          value: 'commands',
          short: 'Guided'
        },
        { 
          name: '⌨️  Start typing commands manually', 
          value: 'typing',
          short: 'Manual'
        },
        { 
          name: '❓ Show me what\'s available', 
          value: 'help',
          short: 'Help'
        }
      ],
      default: 'commands'
    }]);

    return action;
  }

  /**
   * Show command selector with autocomplete
   */
  private async showCommandSelector(): Promise<string | null> {
    const commands = this.registry.getAll();
    
    const { command } = await inquirer.prompt([{
      type: 'list',
      name: 'command',
      message: 'Select a command:',
      choices: [
        ...commands.map(cmd => ({
          name: `/${cmd.name.padEnd(12)} ${chalk.gray(cmd.description)}`,
          value: cmd.name,
          short: `/${cmd.name}`
        })),
        new inquirer.Separator(),
        { name: chalk.gray('Cancel'), value: null, short: 'Cancel' }
      ],
      pageSize: 10
    }]);

    return command;
  }

  /**
   * Get input from user (either command selector or typed input)
   */
  private async getInput(): Promise<string | null> {
    const { input } = await inquirer.prompt([{
      type: 'input',
      name: 'input',
      message: this.config.prompt,
      transformer: (input: string) => {
        // If user types "/", trigger command selector
        if (input === '/') {
          return chalk.cyan('/') + chalk.gray(' (press Enter to see commands)');
        }
        return input;
      }
    }]);

    // If user typed "/", show command selector
    if (input.trim() === '/') {
      const selectedCommand = await this.showCommandSelector();
      if (selectedCommand) {
        return `/${selectedCommand}`;
      }
      return null; // User cancelled
    }

    return input;
  }

  /**
   * Process a single input line
   */
  async processInput(input: string): Promise<CommandResult> {
    const trimmed = input.trim();

    // Empty input - return silently
    if (!trimmed) {
      return { success: true };
    }

    // Parse the input
    const parsed = this.registry.parse(trimmed);

    // Handle special case: just "/" shows command selector
    if (parsed.command === '') {
      const selectedCommand = await this.showCommandSelector();
      if (selectedCommand) {
        const command = this.registry.get(selectedCommand);
        if (command) {
          return this.executeCommand(command, [], {});
        }
      }
      return { success: true };
    }

    // Find command
    const command = this.registry.get(parsed.command);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: /${parsed.command}. Type /help for available commands.`
      };
    }

    return this.executeCommand(command, parsed.args, parsed.flags);
  }

  private async executeCommand(
    command: RegisteredCommand,
    args: string[],
    flags: Record<string, boolean>
  ): Promise<CommandResult> {
    try {
      const context: CommandContext = {
        session: this.session,
        args,
        flags
      };

      const result = await command.handler(context);

      // Update session if needed
      if (result.updatedSession) {
        this.updateSessionState(result.updatedSession);
      }

      // Update last activity
      this.session.lastActivity = new Date();

      return result;
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Register a slash command
   */
  registerCommand(command: SlashCommand): void {
    this.registry.register(command);
  }

  /**
   * Get a command by name
   */
  getCommand(name: string): RegisteredCommand | undefined {
    return this.registry.get(name);
  }

  /**
   * Get all registered commands
   */
  getRegisteredCommands(): RegisteredCommand[] {
    return this.registry.getAll();
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    return this.session;
  }

  /**
   * Update session state with partial updates
   */
  private updateSessionState(updates: Partial<SessionState>): void {
    Object.assign(this.session, updates);
  }

  /**
   * Clear session state (reset to defaults, preserve session ID)
   */
  clearSession(): void {
    const sessionId = this.session.sessionId;
    this.session = this.createInitialState();
    this.session.sessionId = sessionId;
  }

  /**
   * Start the Agent Loop REPL
   */
  async start(): Promise<void> {
    // Note: Banner is already displayed in index.ts before AgentLoop starts
    
    // Show welcome prompt
    const action = await this.showWelcomePrompt();

    if (action === 'help') {
      const helpCommand = this.registry.get('help');
      if (helpCommand) {
        const result = await this.executeCommand(helpCommand, [], {});
        if (result.message) {
          console.log(result.message);
        }
      }
    }

    let running = true;
    let initialCommandShown = false;

    while (running) {
      try {
        // If guided mode selected and first iteration, show command selector immediately
        let input: string | null;
        if (action === 'commands' && !initialCommandShown) {
          initialCommandShown = true;
          input = await this.showCommandSelector();
          if (input) {
            input = `/${input}`;
          }
        } else {
          // Get input (either typed or from command selector)
          input = await this.getInput();
        }

        // User cancelled command selector
        if (input === null) {
          continue;
        }

        // Process the input
        const result = await this.processInput(input);

        // Display message if present
        if (result.message) {
          console.log(result.message);
        }

        // Exit if requested
        if (result.shouldExit) {
          running = false;
          console.log('\nGoodbye! 👋');
          break;
        }

      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
  }
}
