import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileOperations } from '../file-operations';
import { maskAPIKeys } from '../masking/api-key-masker';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileOperations', () => {
  let fileOps: FileOperations;
  let testDir: string;
  let backupDir: string;

  beforeEach(async () => {
    fileOps = new FileOperations();
    // Create temporary test directories
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentsync-test-'));
    backupDir = path.join(testDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('readConfigFile', () => {
    it('should read and parse JSON config file', async () => {
      const configPath = path.join(testDir, 'config.json');
      const configData = { mcpServers: { test: { command: 'test' } } };
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

      const result = await fileOps.readConfigFile(configPath);

      expect(result).toEqual(configData);
    });

    it('should throw error for non-existent file', async () => {
      const configPath = path.join(testDir, 'non-existent.json');

      await expect(fileOps.readConfigFile(configPath)).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = path.join(testDir, 'invalid.json');
      await fs.writeFile(configPath, 'not valid json');

      await expect(fileOps.readConfigFile(configPath)).rejects.toThrow();
    });
  });

  describe('writeConfigFile', () => {
    it('should write config to file with proper formatting', async () => {
      const configPath = path.join(testDir, 'output.json');
      const configData = { mcpServers: { test: { command: 'test' } } };

      await fileOps.writeConfigFile(configPath, configData);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(content)).toEqual(configData);
    });

    it('should create directory if it does not exist', async () => {
      const nestedPath = path.join(testDir, 'nested', 'deep', 'config.json');
      const configData = { test: true };

      await fileOps.writeConfigFile(nestedPath, configData);

      const content = await fs.readFile(nestedPath, 'utf-8');
      expect(JSON.parse(content)).toEqual(configData);
    });
  });

  describe('createBackup', () => {
    it('should create backup of existing file', async () => {
      const configPath = path.join(testDir, 'config.json');
      const originalData = { version: 1, data: 'original' };
      await fs.writeFile(configPath, JSON.stringify(originalData));

      const backupPath = await fileOps.createBackup(configPath, backupDir);

      expect(backupPath).toContain(backupDir);
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(JSON.parse(backupContent)).toEqual(originalData);
    });

    it('should include timestamp in backup filename', async () => {
      const configPath = path.join(testDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify({ test: true }));

      const backupPath = await fileOps.createBackup(configPath, backupDir);

      expect(path.basename(backupPath)).toMatch(/config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d+Z\.json/);
    });

    it('should throw error if file does not exist', async () => {
      const configPath = path.join(testDir, 'non-existent.json');

      await expect(fileOps.createBackup(configPath, backupDir)).rejects.toThrow();
    });
  });

  describe('atomicWrite', () => {
    it('should write file atomically using temp file', async () => {
      const configPath = path.join(testDir, 'atomic.json');
      const configData = { mcpServers: { test: { command: 'test' } } };

      await fileOps.atomicWrite(configPath, configData);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(content)).toEqual(configData);
    });

    it('should replace existing file atomically', async () => {
      const configPath = path.join(testDir, 'replace.json');
      await fs.writeFile(configPath, JSON.stringify({ old: true }));

      const newData = { new: true };
      await fileOps.atomicWrite(configPath, newData);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(content)).toEqual(newData);
    });
  });

  describe('detectTool', () => {
    it('should return true if tool config exists', async () => {
      const configPath = path.join(testDir, 'claude.json');
      await fs.writeFile(configPath, JSON.stringify({ mcpServers: {} }));

      const result = await fileOps.detectTool(configPath);

      expect(result).toBe(true);
    });

    it('should return false if tool config does not exist', async () => {
      const configPath = path.join(testDir, 'non-existent.json');

      const result = await fileOps.detectTool(configPath);

      expect(result).toBe(false);
    });
  });

  describe('integration: full migration workflow', () => {
    it('should perform complete migration with backup', async () => {
      // Setup source config
      const sourcePath = path.join(testDir, 'source.json');
      const sourceConfig = {
        mcpServers: {
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_secrettoken123' }
          }
        }
      };
      await fs.writeFile(sourcePath, JSON.stringify(sourceConfig, null, 2));

      // Setup target path
      const targetPath = path.join(testDir, 'target.json');

      // Perform migration
      const config = await fileOps.readConfigFile(sourcePath);
      const maskedConfig = maskAPIKeys(config);
      
      // Create backup if target exists
      if (await fileOps.detectTool(targetPath)) {
        await fileOps.createBackup(targetPath, backupDir);
      }
      
      // Write atomically
      await fileOps.atomicWrite(targetPath, maskedConfig);

      // Verify
      const targetContent = await fs.readFile(targetPath, 'utf-8');
      const targetData = JSON.parse(targetContent);
      expect(targetData.mcpServers.github.command).toBe('npx');
      expect(targetData.mcpServers.github.env.GITHUB_TOKEN).toContain('ghp_');
      expect(targetData.mcpServers.github.env.GITHUB_TOKEN).toContain('***');
    });
  });
});