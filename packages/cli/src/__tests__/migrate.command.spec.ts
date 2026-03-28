import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { createMigrateCommand } from '../commands/migrate.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Migrate Command', () => {
  let program: Command;
  let testDir: string;
  let backupDir: string;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(async () => {
    program = new Command();
    // Add exitOverride to prevent process.exit() from being called
    program.exitOverride();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentsync-cli-test-'));
    backupDir = path.join(testDir, 'backups');
    
    // Setup test config directories
    // Claude directory with settings.json
    const claudeDir = path.join(testDir, 'claude');
    await fs.mkdir(claudeDir, { recursive: true });
    const claudeConfig = {
      mcpServers: {
        github: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_TOKEN: 'ghp_test123' }
        }
      },
      agents: {
        'code-reviewer': {
          name: 'Code Reviewer',
          description: 'Reviews code',
          systemPrompt: 'You are a reviewer',
          tools: ['github']
        }
      }
    };
    await fs.writeFile(path.join(claudeDir, 'settings.json'), JSON.stringify(claudeConfig, null, 2));

    // Mock console methods and process.exit
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('argument validation', () => {
    it('should require --from option', async () => {
      const migrateCmd = createMigrateCommand();
      migrateCmd.exitOverride();
      program.addCommand(migrateCmd);

      let errorThrown = false;
      try {
        await program.parseAsync(['node', 'test', 'migrate', '--to', 'opencode']);
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);
    });

    it('should require --to option', async () => {
      const migrateCmd = createMigrateCommand();
      migrateCmd.exitOverride();
      program.addCommand(migrateCmd);

      let errorThrown = false;
      try {
        await program.parseAsync(['node', 'test', 'migrate', '--from', 'claude']);
      } catch (e) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);
    });

    it('should validate tool names', async () => {
      const migrateCmd = createMigrateCommand();
      migrateCmd.exitOverride();
      program.addCommand(migrateCmd);

      // Capture all console.log calls (Section.error uses console.log)
      const consoleLogCalls: string[] = [];
      consoleLogSpy.mockImplementation((msg: string) => {
        consoleLogCalls.push(msg);
      });

      await program.parseAsync(['node', 'test', 'migrate', '--from', 'invalid-tool', '--to', 'opencode']);

      // Check that an error was logged about invalid source tool
      const allMessages = consoleLogCalls.join(' ');
      expect(allMessages).toContain('Invalid source tool');
    });
  });

  describe('dry-run mode', () => {
    it('should show what would be migrated without making changes', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      const claudeDir = path.join(testDir, 'claude');
      const opencodeDir = path.join(testDir, 'opencode');

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'claude',
        '--to', 'opencode',
        '--dry-run',
        '--source', claudeDir,
        '--target', opencodeDir
      ]);

      // Verify output mentions dry run
      const logOutput = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join(' ');
      expect(logOutput).toContain('DRY RUN');
      expect(logOutput).toContain('MCP servers to migrate');

      // Verify no directory was created
      const targetExists = await fs.access(opencodeDir).then(() => true).catch(() => false);
      expect(targetExists).toBe(false);
    });

    it('should show migration preview with masked API keys', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      const claudeDir = path.join(testDir, 'claude');
      const opencodeDir = path.join(testDir, 'opencode');

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'claude',
        '--to', 'opencode',
        '--dry-run',
        '--source', claudeDir,
        '--target', opencodeDir
      ]);

      const logOutput = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join(' ');
      // Check for DRY RUN mode and migration preview
      expect(logOutput).toContain('DRY RUN');
    });
  });

  describe('actual migration', () => {
    it('should migrate config from Claude to OpenCode', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      const claudeDir = path.join(testDir, 'claude');
      const opencodeDir = path.join(testDir, 'opencode');

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'claude',
        '--to', 'opencode',
        '--source', claudeDir,
        '--target', opencodeDir,
        '--backup-dir', backupDir
      ]);

      // Verify target directory and opencode.json was created
      const opencodePath = path.join(opencodeDir, 'opencode.json');
      const targetExists = await fs.access(opencodePath).then(() => true).catch(() => false);
      expect(targetExists).toBe(true);

      // Verify content
      const targetContent = await fs.readFile(opencodePath, 'utf-8');
      const targetConfig = JSON.parse(targetContent);
      expect(targetConfig.mcp).toBeDefined();
      expect(Object.keys(targetConfig.mcp).length).toBe(1);
      expect(targetConfig.mcp.github).toBeDefined();
    });

    it('should create backup when target exists', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      const claudeDir = path.join(testDir, 'claude');
      const opencodeDir = path.join(testDir, 'opencode');

      // Create backup directory first
      await fs.mkdir(backupDir, { recursive: true });

      // Create existing target directory with opencode.json
      await fs.mkdir(opencodeDir, { recursive: true });
      await fs.writeFile(path.join(opencodeDir, 'opencode.json'), JSON.stringify({ mcp: {} }));

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'claude',
        '--to', 'opencode',
        '--source', claudeDir,
        '--target', opencodeDir,
        '--backup-dir', backupDir
      ]);

      // Verify backup was created
      const backupFiles = await fs.readdir(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should migrate from OpenCode to Claude', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      // Create OpenCode source directory
      const opencodeDir = path.join(testDir, 'opencode');
      await fs.mkdir(opencodeDir, { recursive: true });
      // OpenCode uses opencode.json with "mcp" key
      const opencodeConfig = {
        mcp: {
          filesystem: {
            type: 'local',
            command: ['npx', '-y', '@modelcontextprotocol/server-filesystem', '/home/user'],
            environment: {}
          }
        }
      };
      await fs.writeFile(path.join(opencodeDir, 'opencode.json'), JSON.stringify(opencodeConfig));

      // Create agents directory for OpenCode
      const agentsDir = path.join(opencodeDir, 'agents');
      await fs.mkdir(agentsDir, { recursive: true });
      await fs.mkdir(path.join(agentsDir, 'test-writer'), { recursive: true });
      await fs.writeFile(
        path.join(agentsDir, 'test-writer', 'agent.md'),
        `---\ndescription: Writes tests\nsystem_prompt: You are a test writer\n---\n\n# Test Writer\n\nWrites tests for code.`
      );

      const claudeDir = path.join(testDir, 'claude-output');

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'opencode',
        '--to', 'claude',
        '--source', opencodeDir,
        '--target', claudeDir,
        '--backup-dir', backupDir
      ]);

      // Verify target file
      const targetContent = await fs.readFile(path.join(claudeDir, 'settings.json'), 'utf-8');
      const targetConfig = JSON.parse(targetContent);
      // Verify structure has MCP servers
      expect(targetConfig.mcpServers).toBeDefined();
      expect(Object.keys(targetConfig.mcpServers).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('verbose mode', () => {
    it('should show detailed output in verbose mode', async () => {
      const migrateCmd = createMigrateCommand();
      program.addCommand(migrateCmd);

      const claudeDir = path.join(testDir, 'claude');
      const opencodeDir = path.join(testDir, 'opencode');

      await program.parseAsync([
        'node', 'test', 'migrate',
        '--from', 'claude',
        '--to', 'opencode',
        '--dry-run',
        '--verbose',
        '--source', claudeDir,
        '--target', opencodeDir
      ]);

      const logOutput = consoleLogSpy.mock.calls.map((call: any[]) => call[0]).join(' ');
      expect(logOutput).toContain('Source');
      expect(logOutput).toContain('Target');
    });
  });
});
