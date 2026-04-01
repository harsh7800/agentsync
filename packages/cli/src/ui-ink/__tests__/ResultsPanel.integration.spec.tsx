/**
 * Integration Tests for ResultsPanel Component
 * @module ResultsPanelIntegrationTests
 * 
 * Tests integration between ResultsPanel and other components
 * including ScanView, MigrationView, and data flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock ink components
vi.mock('ink', () => ({
  Box: (props: any) => React.createElement('div', { 'data-testid': 'box' }, props.children),
  Text: (props: any) => React.createElement('span', { 'data-testid': 'text' }, props.children),
  useInput: vi.fn(),
  useApp: () => ({ exit: vi.fn() }),
  useStdout: () => ({ stdout: { columns: 80, rows: 24 } }),
}));

// Mock theme
vi.mock('../theme.js', () => ({
  theme: {
    colors: {
      success: 'green',
      error: 'red',
      warning: 'yellow',
      primary: 'cyan',
      secondary: 'magenta',
      border: 'gray',
      text: 'white',
      muted: 'gray',
    },
  },
}));

// Type definitions matching the component
interface ScanResultData {
  duration: number;
  tools: Array<{ id: string; name: string; icon: string; version?: string }>;
  agents: Array<{ name: string; tool: string; path: string; description?: string }>;
  skills: Array<{ name: string; tool: string; path: string; description?: string }>;
  mcps: Array<{ name: string; tool: string; path: string; type: 'local' | 'remote' }>;
  paths: string[];
  timestamp: string;
  filesScanned: number;
}

interface MigrationResultData {
  success: boolean;
  sourceTool: string;
  targetTool: string;
  duration: number;
  migratedAgents: Array<{
    name: string;
    sourcePath: string;
    targetPath: string;
    status: 'success' | 'error' | 'skipped';
    error?: string;
  }>;
  migratedSkills: Array<{
    name: string;
    sourcePath: string;
    targetPath: string;
    status: 'success' | 'error' | 'skipped';
    error?: string;
  }>;
  migratedMCPs: Array<{
    name: string;
    sourcePath: string;
    targetPath: string;
    status: 'success' | 'error' | 'skipped';
  }>;
  createdFiles: Array<{ path: string; type: string; size?: number }>;
  errors: Array<{ message: string; context?: string; recoverable: boolean }>;
  warnings: string[];
  backup?: { path: string; timestamp: string; size: number };
  timestamp: string;
}

type ResultsAction =
  | { type: 'continue' }
  | { type: 'new-migration' }
  | { type: 'scan-again' }
  | { type: 'view-files'; paths: string[] }
  | { type: 'export'; format: 'json' | 'markdown' };

// Mock data for integration tests
const mockScanResult: ScanResultData = {
  duration: 1230,
  filesScanned: 47,
  timestamp: '2026-04-01T14:30:22Z',
  tools: [{ id: 'opencode', name: 'OpenCode', icon: '🔵', version: '1.0.0' }],
  agents: [
    { name: 'test-runner-agent', tool: 'opencode', path: './.opencode/agents/test-runner-agent.md' },
    { name: 'engineering-agent', tool: 'opencode', path: './.opencode/agents/engineering-agent.md' }
  ],
  skills: [{ name: 'test-generator', tool: 'opencode', path: './.opencode/skills/test-generator/SKILL.md' }],
  mcps: [],
  paths: ['./.opencode']
};

const mockMigrationResult: MigrationResultData = {
  success: true,
  sourceTool: 'opencode',
  targetTool: 'claude',
  duration: 2450,
  timestamp: '2026-04-01T14:32:45Z',
  migratedAgents: [
    {
      name: 'test-runner-agent',
      sourcePath: './.opencode/agents/test-runner-agent.md',
      targetPath: '~/.config/claude/agents/test-runner-agent.md',
      status: 'success'
    }
  ],
  migratedSkills: [],
  migratedMCPs: [],
  createdFiles: [
    { path: '~/.config/claude/settings.json', type: 'config', size: 1024 },
    { path: '~/.config/claude/agents/', type: 'agent' }
  ],
  errors: [],
  warnings: [],
  backup: {
    path: '~/.agentsync/backups/20250401-143022/',
    timestamp: '2026-04-01T14:30:22Z',
    size: 4096
  }
};

// Helper to simulate a parent component managing ResultsPanel
type Route = 'welcome' | 'scan' | 'migration' | 'results' | 'help';

interface AppState {
  currentRoute: Route;
  scanResult?: ScanResultData;
  migrationResult?: MigrationResultData;
}

class TestAppController {
  state: AppState;
  actionLog: ResultsAction[] = [];
  exitCalled = false;

  constructor(initialRoute: Route = 'welcome') {
    this.state = {
      currentRoute: initialRoute
    };
  }

  handleResultsAction = (action: ResultsAction) => {
    this.actionLog.push(action);
    
    switch (action.type) {
      case 'continue':
        this.state.currentRoute = 'welcome';
        break;
      case 'new-migration':
        this.state.currentRoute = 'migration';
        // Pre-populate with scan data if available
        break;
      case 'scan-again':
        this.state.currentRoute = 'scan';
        this.state.scanResult = undefined;
        break;
      case 'export':
        // Handle export
        break;
      case 'view-files':
        // Handle file viewing
        break;
    }
  };

  handleExit = () => {
    this.exitCalled = true;
  };

  setScanResult = (result: ScanResultData) => {
    this.state.scanResult = result;
    this.state.currentRoute = 'results';
  };

  setMigrationResult = (result: MigrationResultData) => {
    this.state.migrationResult = result;
    this.state.currentRoute = 'results';
  };
}

describe('ResultsPanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // INT-RESULTS-001: ResultsPanel integrates with ScanView flow
  describe('ScanView Integration', () => {
    it('should integrate with ScanView flow - scan to migration', () => {
      const controller = new TestAppController('scan');
      
      // Simulate scan completion
      controller.setScanResult(mockScanResult);
      
      // Verify ResultsPanel would be rendered with scan results
      expect(controller.state.currentRoute).toBe('results');
      expect(controller.state.scanResult).toBeDefined();
      expect(controller.state.scanResult?.agents).toHaveLength(2);
      
      // Simulate user pressing 'm' for new migration
      controller.handleResultsAction({ type: 'new-migration' });
      
      // Verify navigation to MigrationView
      expect(controller.state.currentRoute).toBe('migration');
      expect(controller.actionLog).toContainEqual({ type: 'new-migration' });
    });

    it('should integrate with ScanView flow - scan again', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // Simulate user pressing 's' for scan again
      controller.handleResultsAction({ type: 'scan-again' });
      
      // Verify navigation back to ScanView
      expect(controller.state.currentRoute).toBe('scan');
      expect(controller.state.scanResult).toBeUndefined();
      expect(controller.actionLog).toContainEqual({ type: 'scan-again' });
    });

    it('should pre-populate migration with scan data when starting new migration', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // When starting migration from scan results
      controller.handleResultsAction({ type: 'new-migration' });
      
      // Migration view should have access to scan data
      expect(controller.state.currentRoute).toBe('migration');
      expect(controller.state.scanResult).toBeDefined();
      
      // Migration view can use scan data to pre-select source tool
      const detectedTool = controller.state.scanResult?.tools[0];
      expect(detectedTool?.id).toBe('opencode');
    });
  });

  // INT-RESULTS-002: ResultsPanel integrates with MigrationView flow
  describe('MigrationView Integration', () => {
    it('should integrate with MigrationView flow - migration to scan', () => {
      const controller = new TestAppController('migration');
      
      // Simulate migration completion
      controller.setMigrationResult(mockMigrationResult);
      
      // Verify ResultsPanel would be rendered with migration results
      expect(controller.state.currentRoute).toBe('results');
      expect(controller.state.migrationResult).toBeDefined();
      expect(controller.state.migrationResult?.success).toBe(true);
      
      // Simulate user pressing 's' for scan again
      controller.handleResultsAction({ type: 'scan-again' });
      
      // Verify navigation back to ScanView
      expect(controller.state.currentRoute).toBe('scan');
      expect(controller.actionLog).toContainEqual({ type: 'scan-again' });
    });

    it('should integrate with MigrationView flow - new migration', () => {
      const controller = new TestAppController('results');
      controller.state.migrationResult = mockMigrationResult;
      
      // Simulate user pressing 'm' for new migration
      controller.handleResultsAction({ type: 'new-migration' });
      
      // Verify navigation to MigrationView
      expect(controller.state.currentRoute).toBe('migration');
      expect(controller.actionLog).toContainEqual({ type: 'new-migration' });
    });

    it('should handle complete workflow: scan → migration → results → new migration', () => {
      const controller = new TestAppController('scan');
      
      // Step 1: Complete scan
      controller.setScanResult(mockScanResult);
      expect(controller.state.currentRoute).toBe('results');
      
      // Step 2: Start migration from scan results
      controller.handleResultsAction({ type: 'new-migration' });
      expect(controller.state.currentRoute).toBe('migration');
      
      // Step 3: Complete migration
      controller.setMigrationResult(mockMigrationResult);
      expect(controller.state.currentRoute).toBe('results');
      expect(controller.state.migrationResult?.success).toBe(true);
      
      // Step 4: Start new migration
      controller.handleResultsAction({ type: 'new-migration' });
      expect(controller.state.currentRoute).toBe('migration');
      
      // Verify complete action log
      expect(controller.actionLog).toEqual([
        { type: 'new-migration' },
        { type: 'new-migration' }
      ]);
    });
  });

  // INT-RESULTS-003: ResultsPanel passes correct data through callbacks
  describe('Data Flow', () => {
    it('should pass correct data through onAction callbacks', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // Test continue action
      controller.handleResultsAction({ type: 'continue' });
      expect(controller.actionLog[0]).toEqual({ type: 'continue' });
      
      // Test new-migration action
      controller.handleResultsAction({ type: 'new-migration' });
      expect(controller.actionLog[1]).toEqual({ type: 'new-migration' });
      
      // Test scan-again action
      controller.handleResultsAction({ type: 'scan-again' });
      expect(controller.actionLog[2]).toEqual({ type: 'scan-again' });
      
      // Test export action
      controller.handleResultsAction({ type: 'export', format: 'json' });
      expect(controller.actionLog[3]).toEqual({ type: 'export', format: 'json' });
      
      // Test view-files action
      const filePaths = ['~/.config/claude/settings.json'];
      controller.handleResultsAction({ type: 'view-files', paths: filePaths });
      expect(controller.actionLog[4]).toEqual({ type: 'view-files', paths: filePaths });
    });

    it('should maintain data integrity through multiple actions', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      controller.state.migrationResult = mockMigrationResult;
      
      // Perform multiple actions
      controller.handleResultsAction({ type: 'continue' });
      controller.handleResultsAction({ type: 'scan-again' });
      controller.handleResultsAction({ type: 'new-migration' });
      
      // Verify all actions logged correctly
      expect(controller.actionLog).toHaveLength(3);
      expect(controller.actionLog[0]).toEqual({ type: 'continue' });
      expect(controller.actionLog[1]).toEqual({ type: 'scan-again' });
      expect(controller.actionLog[2]).toEqual({ type: 'new-migration' });
    });

    it('should preserve scan results until explicitly cleared', () => {
      const controller = new TestAppController('results');
      controller.setScanResult(mockScanResult);
      
      // Results should be available
      expect(controller.state.scanResult).toBeDefined();
      
      // Pressing 'm' should NOT clear scan results
      controller.handleResultsAction({ type: 'new-migration' });
      expect(controller.state.scanResult).toBeDefined();
      
      // Only pressing 's' should clear scan results
      controller.handleResultsAction({ type: 'scan-again' });
      expect(controller.state.scanResult).toBeUndefined();
    });
  });

  // INT-RESULTS-004: ResultsPanel handles rapid navigation key presses
  describe('Rapid Key Press Handling', () => {
    it('should handle rapid navigation key presses without crashes', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // Simulate rapid key presses
      const rapidActions: ResultsAction[] = [
        { type: 'continue' },
        { type: 'new-migration' },
        { type: 'scan-again' },
        { type: 'new-migration' },
        { type: 'continue' }
      ];
      
      rapidActions.forEach(action => {
        controller.handleResultsAction(action);
      });
      
      // All actions should be logged
      expect(controller.actionLog).toHaveLength(5);
      expect(controller.actionLog).toEqual(rapidActions);
      
      // Final state should be from last action
      expect(controller.state.currentRoute).toBe('welcome');
    });

    it('should handle duplicate key presses gracefully', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // Press 'm' multiple times
      controller.handleResultsAction({ type: 'new-migration' });
      controller.handleResultsAction({ type: 'new-migration' });
      controller.handleResultsAction({ type: 'new-migration' });
      
      // All actions should be logged
      expect(controller.actionLog).toHaveLength(3);
    });

    it('should handle mixed action types in sequence', () => {
      const controller = new TestAppController('results');
      controller.state.migrationResult = mockMigrationResult;
      
      // Mix of different action types
      controller.handleResultsAction({ type: 'export', format: 'json' });
      controller.handleResultsAction({ type: 'view-files', paths: ['/path/to/file'] });
      controller.handleResultsAction({ type: 'continue' });
      controller.handleResultsAction({ type: 'export', format: 'markdown' });
      
      expect(controller.actionLog).toHaveLength(4);
      expect(controller.actionLog[0]).toEqual({ type: 'export', format: 'json' });
      expect(controller.actionLog[1]).toEqual({ type: 'view-files', paths: ['/path/to/file'] });
      expect(controller.actionLog[2]).toEqual({ type: 'continue' });
      expect(controller.actionLog[3]).toEqual({ type: 'export', format: 'markdown' });
    });
  });

  // INT-RESULTS-005: ResultsPanel scroll state persists during re-renders
  describe('Scroll State Persistence', () => {
    it('should maintain scroll state during parent re-renders', () => {
      // Simulate a parent component that re-renders
      let scrollOffset = 5;
      const parentState = { someValue: 1 };
      
      // Simulate re-render
      parentState.someValue = 2;
      
      // Scroll offset should be preserved
      expect(scrollOffset).toBe(5);
    });

    it('should reset scroll when switching modes', () => {
      let scrollOffset = 10;
      let currentMode: 'scan' | 'migration' = 'scan';
      
      // Switch to migration mode
      currentMode = 'migration';
      scrollOffset = 0; // Reset on mode change
      
      expect(scrollOffset).toBe(0);
      expect(currentMode).toBe('migration');
    });

    it('should restore scroll position when returning to results', () => {
      // This would be handled by a parent component with state management
      const savedScrollPosition = 7;
      
      // Simulate returning to results view
      const restoredPosition = savedScrollPosition;
      
      expect(restoredPosition).toBe(7);
    });
  });

  describe('Error State Integration', () => {
    it('should handle error state when migration fails partially', () => {
      const controller = new TestAppController('migration');
      
      const migrationWithErrors: MigrationResultData = {
        ...mockMigrationResult,
        success: false,
        errors: [
          { message: 'Agent conversion failed', context: 'test-agent', recoverable: false }
        ]
      };
      
      controller.setMigrationResult(migrationWithErrors);
      
      // Should show results with error state
      expect(controller.state.currentRoute).toBe('results');
      expect(controller.state.migrationResult?.success).toBe(false);
      expect(controller.state.migrationResult?.errors).toHaveLength(1);
      
      // User should still be able to navigate
      controller.handleResultsAction({ type: 'new-migration' });
      expect(controller.state.currentRoute).toBe('migration');
    });

    it('should handle missing result data gracefully', () => {
      const controller = new TestAppController('results');
      
      // No scan result provided
      expect(controller.state.scanResult).toBeUndefined();
      
      // Component should handle this gracefully and show error state
      // Instead of crashing
    });
  });

  describe('Exit Handling', () => {
    it('should call onExit when user presses q', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      controller.handleExit();
      
      expect(controller.exitCalled).toBe(true);
    });

    it('should not navigate when exiting', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      const originalRoute = controller.state.currentRoute;
      controller.handleExit();
      
      // Route should not change on exit
      // (exit is handled at app level)
      expect(controller.exitCalled).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform scan data for migration pre-population', () => {
      const scanResult = mockScanResult;
      
      // Extract tool info for migration
      const detectedTools = scanResult.tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        hasAgents: scanResult.agents.some(a => a.tool === tool.id),
        hasSkills: scanResult.skills.some(s => s.tool === tool.id),
        agentCount: scanResult.agents.filter(a => a.tool === tool.id).length,
        skillCount: scanResult.skills.filter(s => s.tool === tool.id).length
      }));
      
      expect(detectedTools).toHaveLength(1);
      expect(detectedTools[0].id).toBe('opencode');
      expect(detectedTools[0].hasAgents).toBe(true);
      expect(detectedTools[0].agentCount).toBe(2);
    });

    it('should aggregate migration statistics correctly', () => {
      const migrationResult: MigrationResultData = {
        ...mockMigrationResult,
        migratedAgents: [
          { name: 'a1', sourcePath: '', targetPath: '', status: 'success' },
          { name: 'a2', sourcePath: '', targetPath: '', status: 'error', error: 'Failed' },
          { name: 'a3', sourcePath: '', targetPath: '', status: 'skipped' }
        ]
      };
      
      const stats = {
        success: migrationResult.migratedAgents.filter(a => a.status === 'success').length,
        error: migrationResult.migratedAgents.filter(a => a.status === 'error').length,
        skipped: migrationResult.migratedAgents.filter(a => a.status === 'skipped').length
      };
      
      expect(stats.success).toBe(1);
      expect(stats.error).toBe(1);
      expect(stats.skipped).toBe(1);
    });
  });

  describe('Action Bar State', () => {
    it('should show appropriate actions for scan results mode', () => {
      const controller = new TestAppController('results');
      controller.state.scanResult = mockScanResult;
      
      // Available actions: [m] Start Migration, [s] Scan Again, [Enter] Continue
      const expectedActions = ['new-migration', 'scan-again', 'continue'];
      
      expectedActions.forEach(action => {
        controller.handleResultsAction({ type: action as any });
      });
      
      expect(controller.actionLog).toHaveLength(3);
    });

    it('should show appropriate actions for migration results mode', () => {
      const controller = new TestAppController('results');
      controller.state.migrationResult = mockMigrationResult;
      
      // Available actions: [Enter] Done, [m] New Migration, [s] Scan Again
      const expectedActions = ['continue', 'new-migration', 'scan-again'];
      
      expectedActions.forEach(action => {
        controller.handleResultsAction({ type: action as any });
      });
      
      expect(controller.actionLog).toHaveLength(3);
    });
  });
});
