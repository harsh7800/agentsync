import type { SlashCommand } from './types.js';
import { CommandAlreadyExistsError, InvalidCommandNameError } from './types.js';

/**
 * CommandRegistry
 * 
 * Manages slash command registration and parsing for the Agent Loop.
 */
export class CommandRegistry {
  private commands: Map<string, SlashCommand> = new Map();

  /**
   * Registers a command in the registry
   * @throws CommandAlreadyExistsError if command name already registered
   * @throws InvalidCommandNameError if command name is invalid
   */
  register(command: SlashCommand): void {
    if (this.commands.has(command.name)) {
      throw new CommandAlreadyExistsError(command.name);
    }

    if (!this.isValidCommandName(command.name)) {
      throw new InvalidCommandNameError(command.name);
    }

    this.commands.set(command.name, command);
  }

  /**
   * Retrieves a command by name
   */
  get(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Returns all registered commands
   */
  getAll(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Checks if a command is registered
   */
  has(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Unregisters a command by name
   * @returns true if command was found and removed, false otherwise
   */
  unregister(name: string): boolean {
    return this.commands.delete(name);
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
    // Command names must start with a letter and contain only alphanumeric characters
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(name);
  }
}
