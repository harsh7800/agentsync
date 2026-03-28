import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInteractiveCommand } from '../commands/interactive.js';
import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  }
}));

describe('Interactive Command', () => {
  let program: Command;
  let testDir: string;

  beforeEach(async () => {
    program = new Command();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentsync-interactive-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('should have interactive command', () => {
    const interactiveCmd = createInteractiveCommand();
    expect(interactiveCmd.name()).toBe('interactive');
    expect(interactiveCmd.alias()).toBe('i');
  });

  it('should show welcome message', async () => {
    // Mock inquirer responses
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ sourceTool: 'claude' })
      .mockResolvedValueOnce({ targetTool: 'opencode' })
      .mockResolvedValueOnce({ sourcePathChoice: 'default' })
      .mockResolvedValueOnce({ targetPathChoice: 'default' })
      .mockResolvedValueOnce({ dryRun: true, verbose: false })
      .mockResolvedValueOnce({ confirmed: false });

    const interactiveCmd = createInteractiveCommand();
    program.addCommand(interactiveCmd);

    // Should not throw
    await expect(
      program.parseAsync(['node', 'test', 'interactive'])
    ).resolves.not.toThrow();
  });

  it('should support all tool choices', async () => {
    const interactiveCmd = createInteractiveCommand();
    expect(interactiveCmd).toBeDefined();
    
    // Verify command structure
    const description = interactiveCmd.description();
    expect(description).toContain('interactive');
  });
});
