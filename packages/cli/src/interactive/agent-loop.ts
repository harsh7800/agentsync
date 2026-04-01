import * as readline from 'readline';
import type { SlashCommand, CommandContext, CommandResult, SessionState } from './types.js';
import { CommandRegistry, RegisteredCommand } from './command-registry.js';

export interface AgentLoopConfig {
  /** REPL prompt symbol (default: "> ") */
  prompt?: string;
  /** Entry banner message */
  welcomeMessage?: string;
}

/**
 * AgentLoop - Main REPL for Interactive Agent Mode
 * 
 * Manages the interactive session, command routing, and state persistence.
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

    // Handle special case: just "/" shows help
    if (parsed.command === '') {
      const helpCommand = this.registry.get('help');
      if (helpCommand) {
        return this.executeCommand(helpCommand, parsed.args, parsed.flags);
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
    // Display welcome message
    console.log(this.config.welcomeMessage);

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.config.prompt
    });

    let running = true;

    // Set up line handler
    rl.on('line', async (input: string) => {
      const result = await this.processInput(input);

      // Display message if present
      if (result.message) {
        console.log(result.message);
      }

      // Exit if requested
      if (result.shouldExit) {
        running = false;
        rl.close();
        return;
      }

      // Show prompt again
      rl.prompt();
    });

    // Handle close (Ctrl+C, Ctrl+D, etc.)
    rl.on('close', () => {
      running = false;
      console.log('\nGoodbye! 👋');
    });

    // Show initial prompt
    rl.prompt();

    // Wait until stopped
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!running) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}
