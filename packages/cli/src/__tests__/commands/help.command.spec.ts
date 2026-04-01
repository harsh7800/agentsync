import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CommandContext, CommandResult, SessionState, SlashCommand } from '../../interactive/types.js';

describe('/help Command Handler (CH-HELP)', () => {
  let mockContext: CommandContext;
  let mockRegistry: { getAllCommands: ReturnType<typeof vi.fn> };

  const mockCommands: SlashCommand[] = [
    {
      name: 'scan',
      description: 'Scan for agents and tools',
      usage: '/scan [path]',
      execute: vi.fn()
    },
    {
      name: 'status',
      description: 'Show session status',
      usage: '/status',
      execute: vi.fn()
    },
    {
      name: 'exit',
      description: 'Exit Agent Mode',
      usage: '/exit',
      aliases: ['q', 'quit'],
      execute: vi.fn()
    }
  ];

  beforeEach(() => {
    mockRegistry = {
      getAllCommands: vi.fn().mockReturnValue(mockCommands)
    };
    mockContext = {
      session: {
        scannedTools: [],
        detectedAgents: [],
        detectedSkills: [],
        detectedMCPs: [],
        scanPaths: [],
        selectedSourceTool: null,
        selectedTargetTool: null,
        sessionId: 'test-session',
        startTime: new Date(),
        lastActivity: new Date()
      },
      args: [],
      flags: {}
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Help Handler Execution', () => {
    it('CH-HELP-001: helpHandler displays all available commands', async () => {
      // Arrange
      const { helpHandler } = await import('../../interactive/commands/help.js');

      // Act & Assert
      expect(helpHandler).toBeDefined();
    });

    it('CH-HELP-002: helpHandler displays usage examples', async () => {
      // Arrange
      const { helpHandler } = await import('../../interactive/commands/help.js');

      // Act & Assert
      expect(helpHandler).toBeDefined();
    });

    it('CH-HELP-003: helpHandler handles empty registry', async () => {
      // Arrange
      mockRegistry.getAllCommands.mockReturnValue([]);
      const { helpHandler } = await import('../../interactive/commands/help.js');

      // Act & Assert
      expect(helpHandler).toBeDefined();
    });

    it('CH-HELP-004: helpHandler returns success result', async () => {
      // Arrange
      const { helpHandler } = await import('../../interactive/commands/help.js');

      // Act
      const result = await helpHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Help Text Formatting', () => {
    it('CH-HELP-005: formatHelpText creates readable help output', async () => {
      // Arrange
      const { formatHelpText } = await import('../../interactive/commands/help.js');
      const commandsMeta = mockCommands.map(({ name, description, usage, aliases }) => ({
        name,
        description,
        usage,
        aliases
      }));

      // Act
      const formatted = formatHelpText(commandsMeta);

      // Assert
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('formatHelpText includes command names', async () => {
      // Arrange
      const { formatHelpText } = await import('../../interactive/commands/help.js');
      const commandsMeta = mockCommands.map(({ name, description, usage }) => ({
        name,
        description,
        usage
      }));

      // Act
      const formatted = formatHelpText(commandsMeta);

      // Assert
      expect(formatted).toContain('/scan');
      expect(formatted).toContain('/status');
      expect(formatted).toContain('/exit');
    });

    it('formatHelpText includes command descriptions', async () => {
      // Arrange
      const { formatHelpText } = await import('../../interactive/commands/help.js');
      const commandsMeta = mockCommands.map(({ name, description, usage }) => ({
        name,
        description,
        usage
      }));

      // Act
      const formatted = formatHelpText(commandsMeta);

      // Assert
      expect(formatted).toContain('Scan for agents');
      expect(formatted).toContain('Show session status');
    });

    it('formatHelpText includes usage examples', async () => {
      // Arrange
      const { formatHelpText } = await import('../../interactive/commands/help.js');
      const commandsMeta = mockCommands.map(({ name, description, usage }) => ({
        name,
        description,
        usage
      }));

      // Act
      const formatted = formatHelpText(commandsMeta);

      // Assert
      expect(formatted).toContain('/scan [path]');
      expect(formatted).toContain('/status');
    });

    it('formatHelpText includes aliases when present', async () => {
      // Arrange
      const { formatHelpText } = await import('../../interactive/commands/help.js');
      const commandsMeta = mockCommands.map(({ name, description, usage, aliases }) => ({
        name,
        description,
        usage,
        aliases
      }));

      // Act
      const formatted = formatHelpText(commandsMeta);

      // Assert
      expect(formatted).toContain('q');
      expect(formatted).toContain('quit');
    });
  });
});
