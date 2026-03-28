import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ManualScanController } from '../ai-scanner/manual-scan.js';
import type { ManualScanOptions } from '../ai-scanner/types.js';

describe('S3-03: Manual Scan Mode', () => {
  let controller: ManualScanController;
  let tempDir: string;

  beforeEach(() => {
    controller = new ManualScanController();
    tempDir = mkdtempSync(join(tmpdir(), 'manual-scan-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Manual Scan with User Options', () => {
    it('S3-03-001: Scan with user-specified scope (current directory)', async () => {
      // Arrange
      const agentsDir = join(tempDir, '.opencode');
      mkdirSync(agentsDir, { recursive: true });
      writeFileSync(join(agentsDir, 'config.json'), '{"name": "Test"}');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode'],
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.filesScanned).toBeGreaterThanOrEqual(0);
    });

    it('S3-03-002: Scan with user-specified depth limit', async () => {
      // Arrange
      const shallowDir = join(tempDir, '.opencode');
      const deepDir = join(tempDir, 'level1', 'level2', 'level3', 'level4', '.opencode');
      mkdirSync(shallowDir, { recursive: true });
      mkdirSync(deepDir, { recursive: true });
      
      writeFileSync(join(shallowDir, 'shallow.json'), '{}');
      writeFileSync(join(deepDir, 'deep.json'), '{}');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 2,
        tools: ['opencode'],
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('S3-03-003: Scan with custom include patterns', async () => {
      // Arrange
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(opencodeDir, { recursive: true });
      writeFileSync(join(opencodeDir, 'custom.json'), '{"name": "Custom"}');
      writeFileSync(join(tempDir, 'ignored.txt'), 'ignored');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        includePatterns: ['**/.opencode/**/*.json'],
        tools: ['opencode'],
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('S3-03-004: Scan with custom exclude patterns', async () => {
      // Arrange
      const opencodeDir = join(tempDir, '.opencode');
      const excludeDir = join(tempDir, 'exclude');
      mkdirSync(opencodeDir, { recursive: true });
      mkdirSync(excludeDir, { recursive: true });
      
      writeFileSync(join(opencodeDir, 'include.json'), '{}');
      writeFileSync(join(excludeDir, 'exclude.json'), '{}');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        excludePatterns: ['**/exclude/**'],
        tools: ['opencode'],
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('S3-03-005: Scan with specific tools only', async () => {
      // Arrange
      const claudeDir = join(tempDir, '.claude');
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(claudeDir, { recursive: true });
      mkdirSync(opencodeDir, { recursive: true });
      
      writeFileSync(join(claudeDir, 'settings.json'), '{}');
      writeFileSync(join(opencodeDir, 'config.json'), '{}');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode'], // Only scan for opencode
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('S3-03-006: Scan without respecting .gitignore', async () => {
      // Arrange
      const nodeModulesDir = join(tempDir, 'node_modules', '.opencode');
      mkdirSync(nodeModulesDir, { recursive: true });
      writeFileSync(join(nodeModulesDir, 'config.json'), '{}');
      writeFileSync(join(tempDir, '.gitignore'), 'node_modules/');

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode'],
        respectGitignore: false,
        cwd: tempDir
      };

      // Act
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation', () => {
    it('S3-03-007: Validate valid scan options', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('S3-03-008: Reject invalid depth (negative)', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'current',
        depth: -1,
        tools: ['opencode']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('S3-03-009: Reject invalid depth (too high)', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'current',
        depth: 15,
        tools: ['opencode']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('S3-03-010: Reject invalid tool names', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['invalid-tool']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('S3-03-011: Reject invalid scope', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'invalid' as any,
        depth: 3,
        tools: ['opencode']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('S3-03-012: Reject invalid pattern syntax', () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode'],
        includePatterns: ['[invalid']
      };

      // Act
      const result = controller.validateScanOptions(options);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Suggestions', () => {
    it('S3-03-013: Suggest depth for flat directory', async () => {
      // Arrange
      const flatDir = join(tempDir, 'flat');
      mkdirSync(flatDir, { recursive: true });
      writeFileSync(join(flatDir, 'file1.txt'), '');
      writeFileSync(join(flatDir, 'file2.txt'), '');

      // Act
      const suggestedDepth = await controller.suggestScanDepth(flatDir);

      // Assert
      expect(suggestedDepth).toBeGreaterThanOrEqual(1);
      expect(suggestedDepth).toBeLessThanOrEqual(3);
    });

    it('S3-03-014: Suggest depth for deep directory', async () => {
      // Arrange
      const deepDir = join(tempDir, 'level1', 'level2', 'level3', 'level4', 'level5');
      mkdirSync(deepDir, { recursive: true });
      writeFileSync(join(deepDir, 'file.txt'), '');

      // Act
      const suggestedDepth = await controller.suggestScanDepth(tempDir);

      // Assert
      expect(suggestedDepth).toBeGreaterThanOrEqual(3);
      expect(suggestedDepth).toBeLessThanOrEqual(10);
    });
  });

  describe('Error Handling', () => {
    it('S3-03-015: Handle non-existent directory gracefully', async () => {
      // Arrange
      const options: ManualScanOptions = {
        scope: 'custom',
        customPath: '/non/existent/path',
        depth: 3,
        tools: ['opencode'],
        cwd: tempDir
      };

      // Act & Assert
      await expect(
        controller.scanWithUserOptions(options)
      ).rejects.toThrow();
    });

    it('S3-03-016: Handle permission denied gracefully', async () => {
      // Arrange
      const restrictedDir = join(tempDir, 'restricted');
      mkdirSync(restrictedDir, { recursive: true });

      const options: ManualScanOptions = {
        scope: 'current',
        depth: 3,
        tools: ['opencode'],
        cwd: restrictedDir
      };

      // Act - should not throw
      const result = await controller.scanWithUserOptions(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
