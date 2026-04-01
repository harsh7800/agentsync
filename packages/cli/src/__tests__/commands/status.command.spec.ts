import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext, CommandResult, SessionState } from '../../interactive/types.js';

describe('/status Command Handler (CH-STATUS)', () => {
  let mockContext: CommandContext;
  let emptySession: SessionState;
  let populatedSession: SessionState;

  beforeEach(() => {
    emptySession = {
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
    };

    populatedSession = {
      scannedTools: ['claude', 'cursor'],
      detectedAgents: [{ name: 'agent1' }, { name: 'agent2' }] as any,
      detectedSkills: [{ name: 'skill1' }] as any,
      detectedMCPs: [{ name: 'mcp1' }] as any,
      scanPaths: ['/path/to/project'],
      selectedSourceTool: 'claude',
      selectedTargetTool: 'cursor',
      sessionId: 'test-session',
      startTime: new Date(),
      lastActivity: new Date()
    };
  });

  describe('Status Handler Execution', () => {
    it('CH-STATUS-001: statusHandler displays empty state message', async () => {
      // Arrange
      const { statusHandler } = await import('../../interactive/commands/status.js');
      mockContext = { session: emptySession, args: [], flags: {} };

      // Act
      const result = await statusHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('CH-STATUS-002: statusHandler displays session state', async () => {
      // Arrange
      const { statusHandler } = await import('../../interactive/commands/status.js');
      mockContext = { session: populatedSession, args: [], flags: {} };

      // Act
      const result = await statusHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });

    it('CH-STATUS-003: statusHandler returns success result', async () => {
      // Arrange
      const { statusHandler } = await import('../../interactive/commands/status.js');
      mockContext = { session: emptySession, args: [], flags: {} };

      // Act
      const result = await statusHandler([], mockContext);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Session Status Formatting', () => {
    it('CH-STATUS-004: formatSessionStatus formats empty state correctly', async () => {
      // Arrange
      const { formatSessionStatus } = await import('../../interactive/commands/status.js');

      // Act
      const formatted = formatSessionStatus(emptySession);

      // Assert
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('CH-STATUS-004: formatSessionStatus formats populated state correctly', async () => {
      // Arrange
      const { formatSessionStatus } = await import('../../interactive/commands/status.js');

      // Act
      const formatted = formatSessionStatus(populatedSession);

      // Assert
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('formatSessionStatus includes scanned tools count', async () => {
      // Arrange
      const { formatSessionStatus } = await import('../../interactive/commands/status.js');

      // Act
      const formatted = formatSessionStatus(populatedSession);

      // Assert
      expect(formatted).toContain('claude');
      expect(formatted).toContain('cursor');
    });

    it('formatSessionStatus includes detected agents', async () => {
      // Arrange
      const { formatSessionStatus } = await import('../../interactive/commands/status.js');

      // Act
      const formatted = formatSessionStatus(populatedSession);

      // Assert
      expect(formatted).toContain('agent1');
    });

    it('formatSessionStatus includes scan paths', async () => {
      // Arrange
      const { formatSessionStatus } = await import('../../interactive/commands/status.js');

      // Act
      const formatted = formatSessionStatus(populatedSession);

      // Assert
      expect(formatted).toContain('/path/to/project');
    });
  });
});
