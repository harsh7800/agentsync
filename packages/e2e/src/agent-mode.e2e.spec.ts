import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  AgentLoop,
  scanHandler,
  statusHandler,
  helpHandler,
  exitHandler
} from '@agent-sync/cli';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('E2E: Full Interactive Agent Mode Flow', () => {
  let tempDir: string;
  let agentLoop: AgentLoop;

  beforeAll(async () => {
    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentsync-e2e-agent-mode-'));
  });

  afterAll(async () => {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Complete Agent Mode Workflow', () => {
    it('E2E-AGENT-001: Full workflow - scan, status, help, exit', async () => {
      // Create Agent Loop instance
      agentLoop = new AgentLoop();

      // Step 1: Execute /help command
      const helpResult = await agentLoop.processInput('/help');
      expect(helpResult.success).toBe(true);

      // Step 2: Execute /scan command
      const scanResult = await agentLoop.processInput('/scan');
      expect(scanResult.success).toBe(true);
      expect(scanResult.updatedSession).toBeDefined();

      // Step 3: Execute /status command (should show scan results)
      const statusResult = await agentLoop.processInput('/status');
      expect(statusResult.success).toBe(true);

      // Step 4: Execute /exit command
      const exitResult = await agentLoop.processInput('/exit');
      expect(exitResult.success).toBe(true);
      expect(exitResult.shouldExit).toBe(true);
    });

    it('E2E-AGENT-002: Session state persists across commands', async () => {
      agentLoop = new AgentLoop();

      // Execute scan
      const scanResult = await agentLoop.processInput('/scan');
      expect(scanResult.success).toBe(true);

      // Get session state after scan
      const sessionAfterScan = agentLoop.getSessionState();
      expect(sessionAfterScan.hasScanned).toBe(true);

      // Execute status - should see same data
      const statusResult = await agentLoop.processInput('/status');
      expect(statusResult.success).toBe(true);

      // Verify session still has scan data
      const sessionAfterStatus = agentLoop.getSessionState();
      expect(sessionAfterStatus.hasScanned).toBe(true);
    });

    it('E2E-AGENT-003: Unknown command returns error', async () => {
      agentLoop = new AgentLoop();

      const result = await agentLoop.processInput('/unknowncommand');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('E2E-AGENT-004: Empty input handled gracefully', async () => {
      agentLoop = new AgentLoop();

      const result = await agentLoop.processInput('');
      expect(result.success).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('E2E-AGENT-005: Command with arguments parsed correctly', async () => {
      agentLoop = new AgentLoop();

      // Test command parsing with arguments
      const result = await agentLoop.processInput('/scan current');
      expect(result.success).toBe(true);
    });

    it('E2E-AGENT-006: Multiple commands in sequence', async () => {
      agentLoop = new AgentLoop();

      // Execute multiple commands
      const results = [];

      results.push(await agentLoop.processInput('/help'));
      results.push(await agentLoop.processInput('/scan'));
      results.push(await agentLoop.processInput('/status'));
      results.push(await agentLoop.processInput('/exit'));

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);

      // Exit should have shouldExit flag
      expect(results[3].shouldExit).toBe(true);
    });
  });

  describe('Agent Mode Entry Point', () => {
    it('E2E-AGENT-007: AgentLoop has welcome message', () => {
      agentLoop = new AgentLoop();
      const welcomeMessage = agentLoop.getWelcomeMessage();

      expect(welcomeMessage).toContain('AgentSync Interactive Mode');
      expect(welcomeMessage).toContain('/scan');
      expect(welcomeMessage).toContain('/exit');
    });

    it('E2E-AGENT-008: AgentLoop has default prompt', () => {
      agentLoop = new AgentLoop();
      const prompt = agentLoop.getPrompt();

      expect(prompt).toBe('> ');
    });

    it('E2E-AGENT-009: AgentLoop accepts custom config', () => {
      agentLoop = new AgentLoop({
        prompt: '~> ',
        welcomeMessage: 'Custom Welcome'
      });

      expect(agentLoop.getPrompt()).toBe('~> ');
      expect(agentLoop.getWelcomeMessage()).toBe('Custom Welcome');
    });
  });

  describe('Session State Management', () => {
    it('E2E-AGENT-010: Session state initializes with defaults', () => {
      agentLoop = new AgentLoop();
      const session = agentLoop.getSessionState();

      expect(session.scannedTools).toEqual([]);
      expect(session.detectedAgents).toEqual([]);
      expect(session.detectedSkills).toEqual([]);
      expect(session.detectedMCPs).toEqual([]);
      expect(session.scanPaths).toEqual([]);
      expect(session.selectedSourceTool).toBeNull();
      expect(session.selectedTargetTool).toBeNull();
      expect(session.sessionId).toBeDefined();
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
    });

    it('E2E-AGENT-011: Clear session preserves session ID', async () => {
      agentLoop = new AgentLoop();

      const sessionBefore = agentLoop.getSessionState();
      const originalId = sessionBefore.sessionId;

      // Modify session
      await agentLoop.processInput('/scan');

      // Clear session
      agentLoop.clearSession();

      const sessionAfter = agentLoop.getSessionState();
      expect(sessionAfter.sessionId).toBe(originalId);
      expect(sessionAfter.scannedTools).toEqual([]);
    });
  });

  describe('Command Registry', () => {
    it('E2E-AGENT-012: Commands can be registered and retrieved', () => {
      agentLoop = new AgentLoop();

      const testCommand = {
        name: 'test',
        description: 'Test command',
        usage: '/test',
        execute: async () => ({ success: true })
      };

      agentLoop.registerCommand(testCommand);

      const retrieved = agentLoop.getCommand('test');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test');
    });

    it('E2E-AGENT-013: Duplicate command registration throws error', () => {
      agentLoop = new AgentLoop();

      const testCommand = {
        name: 'test',
        description: 'Test command',
        usage: '/test',
        execute: async () => ({ success: true })
      };

      agentLoop.registerCommand(testCommand);

      expect(() => agentLoop.registerCommand(testCommand)).toThrow('already exists');
    });

    it('E2E-AGENT-014: Get all registered commands', () => {
      agentLoop = new AgentLoop();

      agentLoop.registerCommand({
        name: 'cmd1',
        description: 'Command 1',
        usage: '/cmd1',
        execute: async () => ({ success: true })
      });

      agentLoop.registerCommand({
        name: 'cmd2',
        description: 'Command 2',
        usage: '/cmd2',
        execute: async () => ({ success: true })
      });

      const commands = agentLoop.getRegisteredCommands();
      expect(commands).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('E2E-AGENT-015: Command execution errors handled gracefully', async () => {
      agentLoop = new AgentLoop();

      const errorCommand = {
        name: 'error',
        description: 'Error command',
        usage: '/error',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      agentLoop.registerCommand(errorCommand);

      const result = await agentLoop.processInput('/error');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });

    it('E2E-AGENT-016: Invalid command names rejected', async () => {
      agentLoop = new AgentLoop();

      const invalidCommand = {
        name: '123invalid',
        description: 'Invalid',
        usage: '/123invalid',
        execute: async () => ({ success: true })
      };

      expect(() => agentLoop.registerCommand(invalidCommand)).toThrow('Invalid');
    });
  });
});
