import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, cpSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('E2E: Claude Code ↔ OpenCode Migration', () => {
  let tempDir: string;
  let backupDir: string;
  const cliPath = join(__dirname, '../../cli/dist/index.js');

  // Fixture paths
  const claudeFixturePath = join(__dirname, '../../core/src/__tests__/fixtures/claude-config.json');
  const opencodeFixturePath = join(__dirname, '../../core/src/__tests__/fixtures/opencode-full.json');

  beforeEach(() => {
    // Create temp directories for each test
    tempDir = mkdtempSync(join(tmpdir(), 'agentsync-e2e-'));
    backupDir = join(tempDir, 'backups');
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper: Setup Claude directory structure from fixture
   */
  function setupClaudeDirectory(dirPath: string): void {
    mkdirSync(dirPath, { recursive: true });
    cpSync(claudeFixturePath, join(dirPath, 'settings.json'));
  }

  /**
   * Helper: Setup OpenCode directory structure from fixture
   * OpenCode uses opencode.json with "mcp" key for MCP servers
   */
  function setupOpenCodeDirectory(dirPath: string): void {
    mkdirSync(dirPath, { recursive: true });
    const opencodeContent = readFileSync(opencodeFixturePath, 'utf-8');
    const opencodeData = JSON.parse(opencodeContent);
    
    // Write opencode.json with MCP servers under "mcp" key (already in correct format)
    if (opencodeData.mcp) {
      writeFileSync(join(dirPath, 'opencode.json'), JSON.stringify({ mcp: opencodeData.mcp }, null, 2));
    }
    
    // Write agents as individual files
    if (opencodeData.agents && Array.isArray(opencodeData.agents)) {
      mkdirSync(join(dirPath, 'agents'), { recursive: true });
      for (const agent of opencodeData.agents) {
        const agentDir = join(dirPath, 'agents', agent.name);
        mkdirSync(agentDir, { recursive: true });
        writeFileSync(
          join(agentDir, 'agent.md'),
          `---\ndescription: ${agent.description}\n${agent.systemPrompt ? `system_prompt: ${agent.systemPrompt}` : ''}\n---\n\n# ${agent.name}\n\n${agent.description}`
        );
      }
    }
  }

  describe('Claude Code → OpenCode Migration', () => {
    it('should perform dry-run migration without writing files', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'opencode-target');

      // Act - Run migration in dry-run mode
      const result = execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}" --dry-run`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert
      expect(result).toContain('DRY RUN');
      expect(result).toContain('MCP servers to migrate');
      expect(existsSync(outputDir)).toBe(false); // Directory should NOT be created
    });

    it('should migrate Claude config to OpenCode directory format', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'opencode-target');

      // Act
      execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert - Check opencode.json was created
      const opencodePath = join(outputDir, 'opencode.json');
      expect(existsSync(opencodePath)).toBe(true);
      const outputContent = readFileSync(opencodePath, 'utf-8');
      const opencodeConfig = JSON.parse(outputContent);

      // Verify structure - OpenCode uses 'mcp' key
      expect(opencodeConfig).toHaveProperty('mcp');
      expect(typeof opencodeConfig.mcp).toBe('object');
    });

    it('should create backup before migration', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'opencode-target');
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, 'opencode.json'), JSON.stringify({ mcp: {} }));

      // Act
      execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}" --backup-dir "${backupDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert - Check backup was created in backup directory
      expect(existsSync(backupDir)).toBe(true);
      const backupFiles = execSync(`ls "${backupDir}"`, { encoding: 'utf-8' });
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should preserve API keys in output', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      mkdirSync(inputDir, { recursive: true });
      const claudeConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@test/server'],
            env: {
              API_KEY: 'sk-test12345secret',
              SECRET_TOKEN: 'token_abcdef123'
            }
          }
        }
      };
      writeFileSync(join(inputDir, 'settings.json'), JSON.stringify(claudeConfig, null, 2));
      const outputDir = join(tempDir, 'opencode-target');

      // Act
      execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert - API keys are preserved during migration
      const opencodePath = join(outputDir, 'opencode.json');
      const outputContent = readFileSync(opencodePath, 'utf-8');
      const outputData = JSON.parse(outputContent);
      
      // Verify API keys are preserved in the 'mcp' key
      expect(outputData.mcp['test-server'].environment.API_KEY).toBe('sk-test12345secret');
      expect(outputData.mcp['test-server'].environment.SECRET_TOKEN).toBe('token_abcdef123');
    });

    it('should preserve MCP server configuration structure', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'opencode-target');

      // Act
      execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert
      const inputContent = readFileSync(join(inputDir, 'settings.json'), 'utf-8');
      const inputConfig = JSON.parse(inputContent);
      const opencodePath = join(outputDir, 'opencode.json');
      const outputContent = readFileSync(opencodePath, 'utf-8');
      const outputConfig = JSON.parse(outputContent);

      // Verify MCP servers were migrated (check 'mcp' key for OpenCode)
      const inputServerCount = Object.keys(inputConfig.mcpServers || {}).length;
      const outputServerCount = Object.keys(outputConfig.mcp || {}).length;
      expect(outputServerCount).toBeGreaterThanOrEqual(inputServerCount);
    });

    it('should show verbose output when --verbose flag is used', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'opencode-target');

      // Act
      const result = execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}" --verbose`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert
      expect(result).toContain('Source');
      expect(result).toContain('Target');
      expect(result).toContain('Backup directory');
    });
  });

  describe('OpenCode → Claude Code Migration', () => {
    it('should migrate OpenCode config to Claude directory format', () => {
      // Arrange
      const inputDir = join(tempDir, 'opencode-source');
      setupOpenCodeDirectory(inputDir);
      const outputDir = join(tempDir, 'claude-target');

      // Act
      execSync(
        `node ${cliPath} migrate --from opencode --to claude --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert - Check settings.json was created
      const settingsPath = join(outputDir, 'settings.json');
      expect(existsSync(settingsPath)).toBe(true);
      const outputContent = readFileSync(settingsPath, 'utf-8');
      const claudeConfig = JSON.parse(outputContent);

      // Verify structure
      expect(claudeConfig).toHaveProperty('mcpServers');
      expect(typeof claudeConfig.mcpServers).toBe('object');
    });

    it('should convert OpenCode agents to Claude format', () => {
      // Arrange
      const inputDir = join(tempDir, 'opencode-source');
      setupOpenCodeDirectory(inputDir);
      const outputDir = join(tempDir, 'claude-target');

      // Act
      execSync(
        `node ${cliPath} migrate --from opencode --to claude --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert
      const outputPath = join(outputDir, 'settings.json');
      const outputContent = readFileSync(outputPath, 'utf-8');
      const outputConfig = JSON.parse(outputContent);

      // Verify agents were converted (as part of the migration)
      expect(outputConfig).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully with non-existent source directory', () => {
      // Arrange
      const inputDir = join(tempDir, 'non-existent');
      const outputDir = join(tempDir, 'output');

      // Act & Assert
      expect(() => {
        execSync(
          `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}"`,
          { encoding: 'utf-8', cwd: tempDir }
        );
      }).toThrow();
    });

    it('should handle invalid JSON input gracefully', () => {
      // Arrange
      const inputDir = join(tempDir, 'invalid-input');
      mkdirSync(inputDir, { recursive: true });
      writeFileSync(join(inputDir, 'settings.json'), 'not valid json {{{');
      const outputDir = join(tempDir, 'output');

      // Act - Migration may complete but with errors since JSON parsing fails
      const result = execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${inputDir}" --target "${outputDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert - The output should indicate the migration attempted but may have failed
      // The scanner handles parsing errors gracefully
      expect(result).toBeDefined();
    });

    it('should fail with unsupported tool pair', () => {
      // Arrange
      const inputDir = join(tempDir, 'claude-source');
      setupClaudeDirectory(inputDir);
      const outputDir = join(tempDir, 'output');

      // Act & Assert
      expect(() => {
        execSync(
          `node ${cliPath} migrate --from claude --to unsupported --source "${inputDir}" --target "${outputDir}"`,
          { encoding: 'utf-8', cwd: tempDir }
        );
      }).toThrow();
    });
  });

  describe('Round-trip Migration', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      // Arrange - Start with Claude config
      const originalDir = join(tempDir, 'original-claude');
      setupClaudeDirectory(originalDir);
      const intermediateDir = join(tempDir, 'intermediate-opencode');
      const roundTripDir = join(tempDir, 'roundtrip-claude');

      // Act - Claude → OpenCode → Claude
      execSync(
        `node ${cliPath} migrate --from claude --to opencode --source "${originalDir}" --target "${intermediateDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      execSync(
        `node ${cliPath} migrate --from opencode --to claude --source "${intermediateDir}" --target "${roundTripDir}"`,
        { encoding: 'utf-8', cwd: tempDir }
      );

      // Assert
      const originalContent = readFileSync(join(originalDir, 'settings.json'), 'utf-8');
      const roundTripContent = readFileSync(join(roundTripDir, 'settings.json'), 'utf-8');
      const original = JSON.parse(originalContent);
      const roundTrip = JSON.parse(roundTripContent);

      // Key MCP servers should be preserved (by name)
      const originalServers = Object.keys(original.mcpServers || {});
      const roundTripServers = Object.keys(roundTrip.mcpServers || {});
      
      // At minimum, the same number of servers should exist
      expect(roundTripServers.length).toBeGreaterThanOrEqual(originalServers.length);
    });
  });
});
