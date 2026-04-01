import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SessionState } from '../interactive/types.js';

describe('Session State Manager (session-state.ts)', () => {
  let SessionStateManager: new (initialState?: SessionState) => {
    getState(): Readonly<SessionState>;
    update(updates: Partial<SessionState>): void;
    clear(): void;
    hasScanData(): boolean;
    getStatusDisplay(): string;
  };
  let createSessionState: () => SessionState;
  let updateSessionState: (current: SessionState, updates: Partial<SessionState>) => SessionState;
  let clearSessionState: () => SessionState;
  let createCommandContext: (initialState?: SessionState) => unknown;

  const mockEmptySession: SessionState = {
    scannedTools: [],
    detectedAgents: [],
    detectedSkills: [],
    detectedMCPs: [],
    scanPaths: [],
    selectedTargetTool: null,
    scanTimestamp: null,
    hasScanned: false
  };

  const mockPopulatedSession: SessionState = {
    scannedTools: ['claude', 'cursor'],
    detectedAgents: ['agent1', 'agent2'],
    detectedSkills: ['skill1'],
    detectedMCPs: ['mcp1'],
    scanPaths: ['/path/to/project'],
    selectedTargetTool: 'cursor',
    scanTimestamp: new Date('2026-04-01T10:00:00Z'),
    hasScanned: true
  };

  beforeEach(async () => {
    const module = await import('../interactive/session-state.js');
    SessionStateManager = module.SessionStateManager as unknown as typeof SessionStateManager;
    createSessionState = module.createSessionState as () => SessionState;
    updateSessionState = module.updateSessionState as typeof updateSessionState;
    clearSessionState = module.clearSessionState as () => SessionState;
    createCommandContext = module.createCommandContext as typeof createCommandContext;
  });

  describe('State Initialization (SS-INIT)', () => {
    it('SS-INIT-001: createSessionState returns empty state', () => {
      // Act
      const state = createSessionState();

      // Assert
      expect(state.scannedTools).toEqual([]);
      expect(state.detectedAgents).toEqual([]);
      expect(state.detectedSkills).toEqual([]);
      expect(state.detectedMCPs).toEqual([]);
      expect(state.scanPaths).toEqual([]);
      expect(state.selectedTargetTool).toBeNull();
      expect(state.scanTimestamp).toBeNull();
      expect(state.hasScanned).toBe(false);
    });

    it('SS-INIT-002: SessionStateManager initializes with empty state', () => {
      // Act
      const manager = new SessionStateManager();

      // Assert
      const state = manager.getState();
      expect(state.scannedTools).toEqual([]);
      expect(state.hasScanned).toBe(false);
    });

    it('SS-INIT-003: SessionStateManager initializes with provided state', () => {
      // Act
      const manager = new SessionStateManager(mockPopulatedSession);

      // Assert
      const state = manager.getState();
      expect(state.scannedTools).toEqual(['claude', 'cursor']);
      expect(state.hasScanned).toBe(true);
    });

    it('SS-INIT-004: createCommandContext creates context with state and functions', () => {
      // Act
      const context = createCommandContext(mockEmptySession);

      // Assert
      expect(context).toBeDefined();
      expect(context).toHaveProperty('session');
      expect(context).toHaveProperty('updateSession');
      expect(context).toHaveProperty('clearSession');
      expect(context).toHaveProperty('registry');
    });
  });

  describe('State Updates (SS-UPDATE)', () => {
    it('SS-UPDATE-001: updateSessionState merges partial updates', () => {
      // Arrange
      const current: SessionState = {
        ...mockEmptySession,
        scannedTools: ['claude']
      };

      // Act
      const updated = updateSessionState(current, { detectedAgents: ['agent1'] });

      // Assert
      expect(updated.scannedTools).toEqual(['claude']);
      expect(updated.detectedAgents).toEqual(['agent1']);
    });

    it('SS-UPDATE-002: updateSessionState overwrites existing values', () => {
      // Arrange
      const current: SessionState = {
        ...mockEmptySession,
        scannedTools: ['claude']
      };

      // Act
      const updated = updateSessionState(current, { scannedTools: ['opencode'] });

      // Assert
      expect(updated.scannedTools).toEqual(['opencode']);
    });

    it('SS-UPDATE-003: SessionStateManager.update applies changes', () => {
      // Arrange
      const manager = new SessionStateManager();

      // Act
      manager.update({ hasScanned: true });

      // Assert
      expect(manager.getState().hasScanned).toBe(true);
    });

    it('SS-UPDATE-004: Update updates scanTimestamp', () => {
      // Arrange
      const manager = new SessionStateManager();
      const timestamp = new Date('2026-04-01T10:00:00Z');

      // Act
      manager.update({ scanTimestamp: timestamp });

      // Assert
      expect(manager.getState().scanTimestamp).toEqual(timestamp);
    });

    it('SS-UPDATE-005: Update updates selectedTargetTool', () => {
      // Arrange
      const manager = new SessionStateManager();

      // Act
      manager.update({ selectedTargetTool: 'cursor' });

      // Assert
      expect(manager.getState().selectedTargetTool).toBe('cursor');
    });
  });

  describe('State Retrieval (SS-GET)', () => {
    it('SS-GET-001: SessionStateManager.getState returns immutable state', () => {
      // Arrange
      const manager = new SessionStateManager(mockPopulatedSession);
      const state = manager.getState();

      // Act & Assert
      expect(() => {
        // @ts-expect-error - Testing immutability
        state.scannedTools.push('new-tool');
      }).toThrow();
    });

    it('SS-GET-002: SessionStateManager.getStatusDisplay formats state correctly', () => {
      // Arrange
      const manager = new SessionStateManager(mockPopulatedSession);

      // Act
      const display = manager.getStatusDisplay();

      // Assert
      expect(display).toContain('claude');
      expect(display).toContain('cursor');
    });
  });

  describe('State Reset (SS-RESET)', () => {
    it('SS-RESET-001: clearSessionState returns fresh empty state', () => {
      // Act
      const cleared = clearSessionState();

      // Assert
      expect(cleared).toEqual(createSessionState());
    });

    it('SS-RESET-002: SessionStateManager.clear resets to initial state', () => {
      // Arrange
      const manager = new SessionStateManager(mockPopulatedSession);

      // Act
      manager.clear();

      // Assert
      const state = manager.getState();
      expect(state.scannedTools).toEqual([]);
      expect(state.detectedAgents).toEqual([]);
      expect(state.hasScanned).toBe(false);
      expect(manager.hasScanData()).toBe(false);
    });
  });

  describe('State Queries (SS-QUERY)', () => {
    it('SS-QUERY-001: hasScanData returns false when no scan performed', () => {
      // Arrange
      const manager = new SessionStateManager();

      // Assert
      expect(manager.hasScanData()).toBe(false);
    });

    it('SS-QUERY-002: hasScanData returns true when scan performed', () => {
      // Arrange
      const manager = new SessionStateManager(mockPopulatedSession);

      // Assert
      expect(manager.hasScanData()).toBe(true);
    });
  });
});
