import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentLoop } from '../interactive/agent-loop';
import { CommandRegistry } from '../interactive/command-registry';
import { SessionState } from '../interactive/session-state';
import type { SlashCommand, CommandContext, CommandResult } from '../interactive/types';

// Mock commands for testing
const mockHelpCommand: SlashCommand = {
  name: 'help',
  description: 'Show help',
  usage: '/help',
  execute: async (): Promise<CommandResult> => ({ 
    success: true, 
    message: 'Help text' 
  })
};

const mockExitCommand: SlashCommand = {
  name: 'exit',
  description: 'Exit REPL',
  usage: '/exit',
  execute: async (): Promise<CommandResult> => ({ 
    success: true, 
    shouldExit: true 
  })
};

const mockScanCommand: SlashCommand = {
  name: 'scan',
  description: 'Scan for tools',
  usage: '/scan [path]',
  execute: async (ctx: CommandContext): Promise<CommandResult> => ({
    success: true,
    message: `Scanned: ${ctx.args.join(', ') || 'default'}`,
    updatedSession: {
      scannedTools: ['claude', 'opencode'],
      scanPaths: ctx.args.length > 0 ? ctx.args : ['~/.config']
    }
  })
};

const mockErrorCommand: SlashCommand = {
  name: 'error',
  description: 'Throw error',
  usage: '/error',
  execute: async (): Promise<CommandResult> => {
    throw new Error('Test error');
  }
};

describe('AgentLoop', () => {
  let agentLoop: AgentLoop;

  beforeEach(() => {
    agentLoop = new AgentLoop();
  });

  // UNIT-AGENT-001: Creates AgentLoop with default config
  it('should create AgentLoop with default config', () => {
    expect(agentLoop).toBeDefined();
    expect(agentLoop.getPrompt()).toBe('> ');
    expect(agentLoop.getRegisteredCommands()).toHaveLength(0);
  });

  // UNIT-AGENT-002: Creates AgentLoop with custom config
  it('should create AgentLoop with custom config', () => {
    const customLoop = new AgentLoop({
      prompt: '~> ',
      welcomeMessage: 'Custom welcome'
    });
    expect(customLoop.getPrompt()).toBe('~> ');
  });

  // UNIT-AGENT-003: Initializes empty command registry
  it('should initialize with empty command registry', () => {
    expect(agentLoop.getRegisteredCommands()).toHaveLength(0);
  });

  // UNIT-AGENT-004: Registers single command successfully
  it('should register single command successfully', () => {
    agentLoop.registerCommand(mockHelpCommand);
    expect(agentLoop.getRegisteredCommands()).toHaveLength(1);
    expect(agentLoop.getCommand('help')).toBeDefined();
  });

  // UNIT-AGENT-005: Registers multiple commands
  it('should register multiple commands', () => {
    agentLoop.registerCommand(mockHelpCommand);
    agentLoop.registerCommand(mockScanCommand);
    agentLoop.registerCommand(mockExitCommand);
    expect(agentLoop.getRegisteredCommands()).toHaveLength(3);
  });

  // UNIT-AGENT-006: Rejects duplicate command names
  it('should reject duplicate command names', () => {
    agentLoop.registerCommand(mockHelpCommand);
    expect(() => agentLoop.registerCommand(mockHelpCommand)).toThrow('Command "help" already exists');
  });

  // UNIT-AGENT-007: Rejects invalid command names
  it('should reject invalid command names', () => {
    const invalidCommand: SlashCommand = {
      name: '123invalid',
      description: 'Invalid',
      usage: '/123invalid',
      execute: async () => ({ success: true })
    };
    expect(() => agentLoop.registerCommand(invalidCommand)).toThrow('Invalid command name');
  });

  // UNIT-AGENT-008: Empty input returns silently
  it('should handle empty input silently', async () => {
    agentLoop.registerCommand(mockHelpCommand);
    const result = await agentLoop.processInput('');
    expect(result.success).toBe(true);
    expect(result.message).toBeUndefined();
  });

  // UNIT-AGENT-009: Whitespace-only input returns silently
  it('should handle whitespace-only input silently', async () => {
    agentLoop.registerCommand(mockHelpCommand);
    const result = await agentLoop.processInput('   ');
    expect(result.success).toBe(true);
    expect(result.message).toBeUndefined();
  });

  // UNIT-AGENT-010: Valid command executes successfully
  it('should execute valid command successfully', async () => {
    agentLoop.registerCommand(mockHelpCommand);
    const result = await agentLoop.processInput('/help');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Help text');
  });

  // UNIT-AGENT-011: Unknown command returns error
  it('should return error for unknown command', async () => {
    const result = await agentLoop.processInput('/unknown');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Unknown command');
  });

  // UNIT-AGENT-012: Command with arguments parses correctly
  it('should parse command with arguments', async () => {
    agentLoop.registerCommand(mockScanCommand);
    const result = await agentLoop.processInput('/scan /custom/path');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Scanned: /custom/path');
  });

  // UNIT-AGENT-013: Command with flags parses correctly
  it('should parse command with flags', async () => {
    const flagCommand: SlashCommand = {
      name: 'test',
      description: 'Test flags',
      usage: '/test',
      execute: async (ctx: CommandContext) => ({
        success: true,
        message: `Flags: ${Object.keys(ctx.flags).join(', ')}`
      })
    };
    agentLoop.registerCommand(flagCommand);
    const result = await agentLoop.processInput('/test --verbose --current-dir');
    expect(result.success).toBe(true);
    expect(result.message).toContain('verbose');
    expect(result.message).toContain('current-dir');
  });

  // UNIT-AGENT-014: Mixed args and flags parse correctly
  it('should parse mixed args and flags', async () => {
    const mixedCommand: SlashCommand = {
      name: 'migrate',
      description: 'Migrate command',
      usage: '/migrate <from> <to>',
      execute: async (ctx: CommandContext) => ({
        success: true,
        message: `Args: ${ctx.args.join(', ')}, Flags: ${Object.keys(ctx.flags).join(', ')}`
      })
    };
    agentLoop.registerCommand(mixedCommand);
    const result = await agentLoop.processInput('/migrate claude cursor --dry-run');
    expect(result.success).toBe(true);
    expect(result.message).toContain('claude');
    expect(result.message).toContain('cursor');
    expect(result.message).toContain('dry-run');
  });

  // UNIT-AGENT-015: Get initial state returns defaults
  it('should return default initial state', () => {
    const state = agentLoop.getSessionState();
    expect(state.scannedTools).toEqual([]);
    expect(state.detectedAgents).toEqual([]);
    expect(state.detectedSkills).toEqual([]);
    expect(state.detectedMCPs).toEqual([]);
    expect(state.scanPaths).toEqual([]);
    expect(state.selectedSourceTool).toBeNull();
    expect(state.selectedTargetTool).toBeNull();
    expect(state.sessionId).toBeDefined();
    expect(state.startTime).toBeInstanceOf(Date);
    expect(state.lastActivity).toBeInstanceOf(Date);
  });

  // UNIT-AGENT-016: Update state merges values
  it('should update session state', async () => {
    agentLoop.registerCommand(mockScanCommand);
    await agentLoop.processInput('/scan');
    const state = agentLoop.getSessionState();
    expect(state.scannedTools).toContain('claude');
    expect(state.scannedTools).toContain('opencode');
    expect(state.scanPaths).toContain('~/.config');
  });

  // UNIT-AGENT-017: State persists between commands
  it('should persist state between commands', async () => {
    agentLoop.registerCommand(mockScanCommand);
    const statusCommand: SlashCommand = {
      name: 'status',
      description: 'Show status',
      usage: '/status',
      execute: async (ctx: CommandContext) => ({
        success: true,
        message: `Tools: ${ctx.session.scannedTools.length}`
      })
    };
    agentLoop.registerCommand(statusCommand);

    await agentLoop.processInput('/scan');
    const result = await agentLoop.processInput('/status');
    expect(result.message).toBe('Tools: 2');
  });

  // UNIT-AGENT-018: Clear state resets to defaults
  it('should clear session state', async () => {
    agentLoop.registerCommand(mockScanCommand);
    await agentLoop.processInput('/scan');
    
    const stateBefore = agentLoop.getSessionState();
    expect(stateBefore.scannedTools).toHaveLength(2);
    
    agentLoop.clearSession();
    
    const stateAfter = agentLoop.getSessionState();
    expect(stateAfter.scannedTools).toHaveLength(0);
    expect(stateAfter.sessionId).toBe(stateBefore.sessionId); // Session ID preserved
  });

  // UNIT-AGENT-019: Success result displays message
  it('should return success result with message', async () => {
    agentLoop.registerCommand(mockHelpCommand);
    const result = await agentLoop.processInput('/help');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Help text');
  });

  // UNIT-AGENT-020: Error result displays error
  it('should handle command errors gracefully', async () => {
    agentLoop.registerCommand(mockErrorCommand);
    const result = await agentLoop.processInput('/error');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Error');
  });

  // UNIT-AGENT-021: Exit flag stops REPL
  it('should handle exit command', async () => {
    agentLoop.registerCommand(mockExitCommand);
    const result = await agentLoop.processInput('/exit');
    expect(result.success).toBe(true);
    expect(result.shouldExit).toBe(true);
  });

  // UNIT-AGENT-022: Session updates applied
  it('should apply session updates from commands', async () => {
    agentLoop.registerCommand(mockScanCommand);
    await agentLoop.processInput('/scan /custom/path');
    const state = agentLoop.getSessionState();
    expect(state.scanPaths).toContain('/custom/path');
  });
});

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  // UNIT-REGISTRY-001: Register command stores correctly
  it('should register and retrieve command', () => {
    registry.register(mockHelpCommand);
    const cmd = registry.get('help');
    expect(cmd).toBeDefined();
    expect(cmd?.name).toBe('help');
  });

  // UNIT-REGISTRY-002: Get returns undefined for unknown command
  it('should return undefined for unknown command', () => {
    const cmd = registry.get('unknown');
    expect(cmd).toBeUndefined();
  });

  // UNIT-REGISTRY-003: GetAll returns all commands
  it('should return all registered commands', () => {
    registry.register(mockHelpCommand);
    registry.register(mockScanCommand);
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });

  // UNIT-REGISTRY-004: Parse simple command
  it('should parse simple command', () => {
    const parsed = registry.parse('/help');
    expect(parsed.command).toBe('help');
    expect(parsed.args).toEqual([]);
    expect(parsed.flags).toEqual({});
  });

  // UNIT-REGISTRY-005: Parse command with args
  it('should parse command with args', () => {
    const parsed = registry.parse('/scan /path/to/scan');
    expect(parsed.command).toBe('scan');
    expect(parsed.args).toEqual(['/path/to/scan']);
  });

  // UNIT-REGISTRY-006: Parse command with flags
  it('should parse command with flags', () => {
    const parsed = registry.parse('/scan --verbose --current-dir');
    expect(parsed.command).toBe('scan');
    expect(parsed.flags).toEqual({ verbose: true, 'current-dir': true });
  });

  // UNIT-REGISTRY-007: Parse mixed args and flags
  it('should parse mixed args and flags', () => {
    const parsed = registry.parse('/migrate claude cursor --dry-run');
    expect(parsed.command).toBe('migrate');
    expect(parsed.args).toEqual(['claude', 'cursor']);
    expect(parsed.flags).toEqual({ 'dry-run': true });
  });

  // UNIT-REGISTRY-008: Parse handles extra whitespace
  it('should handle extra whitespace', () => {
    const parsed = registry.parse('/scan   /path   --verbose');
    expect(parsed.command).toBe('scan');
    expect(parsed.args).toEqual(['/path']);
    expect(parsed.flags).toEqual({ verbose: true });
  });
});

describe('SessionState', () => {
  let sessionState: SessionState;

  beforeEach(() => {
    sessionState = new SessionState();
  });

  // UNIT-SESSION-001: GetState returns current snapshot
  it('should return current state', () => {
    const state = sessionState.getState();
    expect(state).toBeDefined();
    expect(state.scannedTools).toEqual([]);
  });

  // UNIT-SESSION-002: Update merges partial state
  it('should update state with partial values', () => {
    sessionState.update({ scannedTools: ['claude'] });
    const state = sessionState.getState();
    expect(state.scannedTools).toEqual(['claude']);
    expect(state.detectedAgents).toEqual([]);
  });

  // UNIT-SESSION-003: Update overwrites existing values
  it('should overwrite existing values', () => {
    sessionState.update({ scannedTools: ['claude'] });
    sessionState.update({ scannedTools: ['opencode'] });
    const state = sessionState.getState();
    expect(state.scannedTools).toEqual(['opencode']);
  });

  // UNIT-SESSION-004: Clear resets arrays to empty
  it('should clear all arrays', () => {
    sessionState.update({
      scannedTools: ['claude'],
      detectedAgents: [{ name: 'test-agent' } as any],
      scanPaths: ['/path']
    });
    sessionState.clear();
    const state = sessionState.getState();
    expect(state.scannedTools).toEqual([]);
    expect(state.detectedAgents).toEqual([]);
    expect(state.scanPaths).toEqual([]);
  });

  // UNIT-SESSION-005: Clear preserves sessionId
  it('should preserve sessionId on clear', () => {
    const before = sessionState.getState();
    const originalId = before.sessionId;
    sessionState.update({ scannedTools: ['claude'] });
    sessionState.clear();
    const after = sessionState.getState();
    expect(after.sessionId).toBe(originalId);
  });

  // UNIT-SESSION-006: Update updates lastActivity
  it('should update lastActivity timestamp', async () => {
    const before = sessionState.getState().lastActivity;
    await new Promise(resolve => setTimeout(resolve, 10));
    sessionState.update({ scannedTools: ['claude'] });
    const after = sessionState.getState().lastActivity;
    expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
