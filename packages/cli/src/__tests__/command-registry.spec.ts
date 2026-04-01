import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandMetadata, CommandHandler, RegisteredCommand } from '../interactive/types.js';

describe('Command Registry (command-registry.ts)', () => {
  let CommandRegistry: new () => {
    register(metadata: CommandMetadata, handler: CommandHandler): unknown;
    unregister(name: string): boolean;
    resolve(name: string): RegisteredCommand | undefined;
    getAllCommands(): RegisteredCommand[];
    hasCommand(name: string): boolean;
    getHelpInfo(): CommandMetadata[];
  };
  let registry: InstanceType<typeof CommandRegistry>;

  const mockHandler: CommandHandler = async () => ({
    success: true,
    message: 'Test executed',
    continue: true
  });

  const mockScanMetadata: CommandMetadata = {
    name: '/scan',
    description: 'Scan for agents, tools, and MCP servers',
    usage: '/scan [path] [--current-dir]',
    aliases: ['s']
  };

  const mockHelpMetadata: CommandMetadata = {
    name: '/help',
    description: 'Show available commands',
    usage: '/help [command]',
    aliases: ['h', '?']
  };

  const mockExitMetadata: CommandMetadata = {
    name: '/exit',
    description: 'Exit Agent Mode',
    usage: '/exit',
    aliases: ['q', 'quit']
  };

  beforeEach(async () => {
    const module = await import('../interactive/command-registry.js');
    CommandRegistry = module.CommandRegistry as unknown as typeof CommandRegistry;
    registry = new CommandRegistry();
  });

  describe('Command Registration (CR-REG)', () => {
    it('CR-REG-001: Register command stores command in registry', () => {
      // Act
      registry.register(mockScanMetadata, mockHandler);

      // Assert
      const resolved = registry.resolve('scan');
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe('/scan');
    });

    it('CR-REG-002: Register returns registry for chaining', () => {
      // Act
      const result = registry
        .register(mockScanMetadata, mockHandler)
        .register(mockHelpMetadata, mockHandler);

      // Assert
      expect(result).toBe(registry);
      expect(registry.hasCommand('scan')).toBe(true);
      expect(registry.hasCommand('help')).toBe(true);
    });

    it('CR-REG-003: Register with alias stores alias mapping', () => {
      // Act
      registry.register(mockScanMetadata, mockHandler);

      // Assert
      expect(registry.resolve('s')).toBeDefined();
      expect(registry.resolve('s')?.name).toBe('/scan');
    });

    it('CR-REG-004: Register duplicate command name throws error', () => {
      // Arrange
      registry.register(mockHelpMetadata, mockHandler);

      // Act & Assert
      expect(() => {
        registry.register(mockHelpMetadata, mockHandler);
      }).toThrow();
    });

    it('CR-REG-005: Register duplicate alias throws error', () => {
      // Arrange
      registry.register(mockScanMetadata, mockHandler);
      const anotherCommand: CommandMetadata = {
        name: '/search',
        description: 'Search command',
        usage: '/search',
        aliases: ['s'] // Same alias as scan
      };

      // Act & Assert
      expect(() => {
        registry.register(anotherCommand, mockHandler);
      }).toThrow();
    });
  });

  describe('Command Resolution (CR-RES)', () => {
    beforeEach(() => {
      registry.register(mockScanMetadata, mockHandler);
    });

    it('CR-RES-001: Resolve by name returns registered command', () => {
      // Act
      const command = registry.resolve('scan');

      // Assert
      expect(command).toBeDefined();
      expect(command?.name).toBe('/scan');
      expect(command?.description).toBe(mockScanMetadata.description);
    });

    it('CR-RES-002: Resolve by alias returns registered command', () => {
      // Act
      const command = registry.resolve('s');

      // Assert
      expect(command).toBeDefined();
      expect(command?.name).toBe('/scan');
    });

    it('CR-RES-003: Resolve unknown command returns undefined', () => {
      // Act
      const command = registry.resolve('unknown');

      // Assert
      expect(command).toBeUndefined();
    });

    it('CR-RES-004: Resolve handles empty string', () => {
      // Act
      const command = registry.resolve('');

      // Assert
      expect(command).toBeUndefined();
    });
  });

  describe('Command Listing and Checks (CR-LIST)', () => {
    beforeEach(() => {
      registry.register(mockScanMetadata, mockHandler);
      registry.register(mockHelpMetadata, mockHandler);
      registry.register(mockExitMetadata, mockHandler);
    });

    it('CR-LIST-001: getAllCommands returns all registered commands', () => {
      // Act
      const commands = registry.getAllCommands();

      // Assert
      expect(commands).toHaveLength(3);
      expect(commands.map(c => c.name)).toContain('/scan');
      expect(commands.map(c => c.name)).toContain('/help');
      expect(commands.map(c => c.name)).toContain('/exit');
    });

    it('CR-LIST-002: getHelpInfo returns metadata for all commands', () => {
      // Act
      const helpInfo = registry.getHelpInfo();

      // Assert
      expect(helpInfo).toHaveLength(3);
      expect(helpInfo[0]).not.toHaveProperty('handler');
    });

    it('CR-CHECK-001: hasCommand returns true for registered command', () => {
      // Assert
      expect(registry.hasCommand('scan')).toBe(true);
    });

    it('CR-CHECK-002: hasCommand returns true for registered alias', () => {
      // Assert
      expect(registry.hasCommand('s')).toBe(true);
      expect(registry.hasCommand('h')).toBe(true);
    });

    it('CR-CHECK-003: hasCommand returns false for unknown command', () => {
      // Assert
      expect(registry.hasCommand('unknown')).toBe(false);
    });
  });

  describe('Unregistration (CR-UNREG)', () => {
    beforeEach(() => {
      registry.register(mockScanMetadata, mockHandler);
    });

    it('CR-UNREG-001: Unregister removes command from registry', () => {
      // Act
      const result = registry.unregister('scan');

      // Assert
      expect(result).toBe(true);
      expect(registry.resolve('scan')).toBeUndefined();
    });

    it('CR-UNREG-002: Unregister unknown command returns false', () => {
      // Act
      const result = registry.unregister('unknown');

      // Assert
      expect(result).toBe(false);
    });

    it('CR-UNREG-003: Unregister removes aliases', () => {
      // Act
      registry.unregister('scan');

      // Assert
      expect(registry.resolve('s')).toBeUndefined();
      expect(registry.hasCommand('s')).toBe(false);
    });
  });

  describe('Default Registry (CR-DEFAULT)', () => {
    it('CR-DEFAULT-001: createDefault creates registry with all built-in commands', async () => {
      // Arrange
      const module = await import('../interactive/command-registry.js');
      const createDefault = module.CommandRegistry.createDefault as () => InstanceType<typeof CommandRegistry>;

      // Act
      const defaultRegistry = createDefault();

      // Assert
      expect(defaultRegistry.hasCommand('scan')).toBe(true);
      expect(defaultRegistry.hasCommand('migrate')).toBe(true);
      expect(defaultRegistry.hasCommand('status')).toBe(true);
      expect(defaultRegistry.hasCommand('help')).toBe(true);
      expect(defaultRegistry.hasCommand('exit')).toBe(true);
      expect(defaultRegistry.hasCommand('detect')).toBe(true);
    });
  });
});
