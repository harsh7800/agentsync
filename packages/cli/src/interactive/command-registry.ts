import type { SlashCommand, CommandContext, CommandResult } from './types.js';
import { CommandAlreadyExistsError, InvalidCommandNameError } from './types.js';

// Type for test compatibility
export interface CommandMetadata {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
}

export type CommandHandler = (context: CommandContext) => Promise<CommandResult>;

export interface RegisteredCommand {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  handler: CommandHandler;
}

/**
 * CommandRegistry
 * 
 * Manages slash command registration and parsing for the Agent Loop.
 */
export class CommandRegistry {
  private commands: Map<string, RegisteredCommand> = new Map();
  private aliases: Map<string, string> = new Map(); // alias -> command name

  /**
   * Registers a command in the registry (test-compatible API)
   * @throws CommandAlreadyExistsError if command name already registered
   * @throws InvalidCommandNameError if command name is invalid
   */
  register(metadata: CommandMetadata, handler: CommandHandler): this;
  register(command: SlashCommand): void;
  register(
    metadataOrCommand: CommandMetadata | SlashCommand,
    handler?: CommandHandler
  ): this | void {
    if (handler) {
      // Test-compatible API: register(metadata, handler)
      const metadata = metadataOrCommand as CommandMetadata;
      
      // Strip leading slash for storage
      const name = metadata.name.startsWith('/') ? metadata.name.slice(1) : metadata.name;
      
      if (this.commands.has(name)) {
        throw new CommandAlreadyExistsError(metadata.name);
      }

      if (!this.isValidCommandName(name)) {
        throw new InvalidCommandNameError(metadata.name);
      }

      const command: RegisteredCommand = {
        name: metadata.name,
        description: metadata.description,
        usage: metadata.usage,
        aliases: metadata.aliases,
        handler
      };

      this.commands.set(name, command);

      // Register aliases
      if (metadata.aliases) {
        for (const alias of metadata.aliases) {
          const aliasKey = alias.startsWith('/') ? alias.slice(1) : alias;
          if (this.aliases.has(aliasKey) || this.commands.has(aliasKey)) {
            throw new CommandAlreadyExistsError(alias);
          }
          this.aliases.set(aliasKey, name);
        }
      }

      return this;
    } else {
      // Original API: register(command)
      const command = metadataOrCommand as SlashCommand;
      if (this.commands.has(command.name)) {
        throw new CommandAlreadyExistsError(command.name);
      }

      if (!this.isValidCommandName(command.name)) {
        throw new InvalidCommandNameError(command.name);
      }

      const registeredCommand: RegisteredCommand = {
        name: command.name,
        description: command.description,
        usage: command.usage,
        aliases: command.aliases,
        handler: command.execute
      };

      this.commands.set(command.name, registeredCommand);

      // Register aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          if (this.aliases.has(alias) || this.commands.has(alias)) {
            throw new CommandAlreadyExistsError(alias);
          }
          this.aliases.set(alias, command.name);
        }
      }
    }
  }

  /**
   * Retrieves a command by name (test-compatible)
   */
  resolve(name: string): RegisteredCommand | undefined {
    // Strip leading slash if present
    const key = name.startsWith('/') ? name.slice(1) : name;
    
    // Try direct lookup
    if (this.commands.has(key)) {
      return this.commands.get(key);
    }
    
    // Try alias lookup
    const aliasedName = this.aliases.get(key);
    if (aliasedName) {
      return this.commands.get(aliasedName);
    }
    
    return undefined;
  }

  /**
   * Retrieves a command by name (original API)
   */
  get(name: string): RegisteredCommand | undefined {
    return this.resolve(name);
  }

  /**
   * Returns all registered commands (test-compatible)
   */
  getAllCommands(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Returns all registered commands (original API)
   */
  getAll(): RegisteredCommand[] {
    return this.getAllCommands();
  }

  /**
   * Checks if a command is registered (test-compatible)
   */
  hasCommand(name: string): boolean {
    const key = name.startsWith('/') ? name.slice(1) : name;
    return this.commands.has(key) || this.aliases.has(key);
  }

  /**
   * Checks if a command is registered (original API)
   */
  has(name: string): boolean {
    return this.hasCommand(name);
  }

  /**
   * Unregisters a command by name
   * @returns true if command was found and removed, false otherwise
   */
  unregister(name: string): boolean {
    const key = name.startsWith('/') ? name.slice(1) : name;
    
    // Remove command
    const command = this.commands.get(key);
    if (command) {
      this.commands.delete(key);
      
      // Remove aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          const aliasKey = alias.startsWith('/') ? alias.slice(1) : alias;
          this.aliases.delete(aliasKey);
        }
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Gets help info for all commands
   */
  getHelpInfo(): CommandMetadata[] {
    return this.getAllCommands().map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.usage,
      aliases: cmd.aliases
    }));
  }

  /**
   * Parses a command line input into command, args, and flags
   */
  parse(input: string): { 
    command: string; 
    args: string[]; 
    flags: Record<string, boolean>;
  } {
    const trimmed = input.trim();
    
    // Remove leading slash if present
    const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    
    // Split by whitespace
    const parts = withoutSlash.split(/\s+/).filter(Boolean);
    
    if (parts.length === 0) {
      return { command: '', args: [], flags: {} };
    }

    const command = parts[0];
    const args: string[] = [];
    const flags: Record<string, boolean> = {};

    // Parse remaining parts
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('--')) {
        // Long flag: --flag-name
        const flagName = part.slice(2);
        if (flagName) {
          flags[flagName] = true;
        }
      } else if (part.startsWith('-') && part.length > 1) {
        // Short flag: -f (treat same as long for simplicity)
        const flagName = part.slice(1);
        if (flagName) {
          flags[flagName] = true;
        }
      } else {
        // Regular argument
        args.push(part);
      }
    }

    return { command, args, flags };
  }

  /**
   * Creates a default registry with no commands
   */
  static createDefault(): CommandRegistry {
    return new CommandRegistry();
  }

  private isValidCommandName(name: string): boolean {
    // Command names can optionally start with / and must contain only alphanumeric characters and /
    // Examples: "scan", "/scan", "help", "/help"
    return /^(\/)?[a-zA-Z][a-zA-Z0-9]*$/.test(name);
  }
}
