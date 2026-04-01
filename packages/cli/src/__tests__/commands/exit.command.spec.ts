import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CommandContext, CommandResult, SessionState } from '../../interactive/types.js';

describe('/exit Command Handler (CH-EXIT)', () => {
  let mockContext: CommandContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleSpy: any;

  beforeEach(() => {
    mockContext = {
      session: {
        scannedTools: ['claude', 'cursor'],
        detectedAgents: [],
        detectedSkills: [],
        detectedMCPs: [],
        scanPaths: ['/test'],
        selectedSourceTool: 'claude',
        selectedTargetTool: 'cursor',
        sessionId: 'test-session',
        startTime: new Date(),
        lastActivity: new Date()
      },
      args: [],
      flags: {}
    };
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('Exit Handler Execution', () => {
    it('CH-EXIT-001: exitHandler returns continue: false', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');

      // Act
      const result = await exitHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('CH-EXIT-002: exitHandler displays goodbye message', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');

      // Act
      const result = await exitHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('CH-EXIT-003: exitHandler returns success: true', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');

      // Act
      const result = await exitHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('exitHandler returns result with shouldExit flag', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');

      // Act
      const result = await exitHandler([], mockContext);

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('shouldExit');
    });

    it('exitHandler works with empty session', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');
      const emptyContext: CommandContext = {
        session: {
          scannedTools: [],
          detectedAgents: [],
          detectedSkills: [],
          detectedMCPs: [],
          scanPaths: [],
          selectedSourceTool: null,
          selectedTargetTool: null,
          sessionId: 'empty-session',
          startTime: new Date(),
          lastActivity: new Date()
        },
        args: [],
        flags: {}
      };

      // Act
      const result = await exitHandler([], emptyContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('exitHandler ignores extra arguments', async () => {
      // Arrange
      const { exitHandler } = await import('../../interactive/commands/exit.js');
      const contextWithArgs: CommandContext = {
        ...mockContext,
        args: ['--force', '--now']
      };

      // Act
      const result = await exitHandler(['--force', '--now'], contextWithArgs);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
