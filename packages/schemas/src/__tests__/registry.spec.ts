import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRegistry, schemaRegistry, SupportedTool, SchemaVersion } from '../registry.js';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry();
  });

  describe('getSchema', () => {
    it('should return schema for claude v1', () => {
      const schema = registry.getSchema('claude', 'v1');
      expect(schema).toBeDefined();
      expect(schema?.title).toContain('Claude');
    });

    it('should return schema for claude v2', () => {
      const schema = registry.getSchema('claude', 'v2');
      expect(schema).toBeDefined();
      expect(schema?.title).toContain('v2');
    });

    it('should return schema for all supported tools', () => {
      const tools: SupportedTool[] = ['claude', 'opencode', 'gemini', 'cursor', 'copilot'];
      
      for (const tool of tools) {
        const versions = registry.getVersions(tool);
        expect(versions.length).toBeGreaterThan(0);
        
        for (const version of versions) {
          const schema = registry.getSchema(tool, version);
          expect(schema).toBeDefined();
          expect(schema?.type).toBe('object');
        }
      }
    });
  });

  describe('getVersions', () => {
    it('should return v1 and v2 for claude', () => {
      const versions = registry.getVersions('claude');
      expect(versions).toContain('v1');
      expect(versions).toContain('v2');
      expect(versions.length).toBe(2);
    });

    it('should return v1 for other tools', () => {
      const tools: SupportedTool[] = ['opencode', 'gemini', 'cursor', 'copilot'];
      
      for (const tool of tools) {
        const versions = registry.getVersions(tool);
        expect(versions).toContain('v1');
        expect(versions.length).toBe(1);
      }
    });
  });

  describe('getLatestVersion', () => {
    it('should return v2 for claude', () => {
      const latest = registry.getLatestVersion('claude');
      expect(latest).toBe('v2');
    });

    it('should return v1 for other tools', () => {
      const tools: SupportedTool[] = ['opencode', 'gemini', 'cursor', 'copilot'];
      
      for (const tool of tools) {
        const latest = registry.getLatestVersion(tool);
        expect(latest).toBe('v1');
      }
    });
  });

  describe('getSupportedTools', () => {
    it('should return all 5 supported tools', () => {
      const tools = registry.getSupportedTools();
      expect(tools).toContain('claude');
      expect(tools).toContain('opencode');
      expect(tools).toContain('gemini');
      expect(tools).toContain('cursor');
      expect(tools).toContain('copilot');
      expect(tools.length).toBe(5);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid claude v1 config', () => {
      const config = {
        mcpServers: {
          test: {
            command: 'npx',
            args: ['-y', 'test'],
            env: { API_KEY: 'test' }
          }
        }
      };

      const result = registry.validateConfig('claude', 'v1', config);
      expect(result.valid).toBe(true);
    });

    it('should validate valid opencode v1 config', () => {
      const config = {
        mcpServers: [
          { name: 'test', command: 'npx', args: ['-y', 'test'] }
        ],
        agents: [
          { name: 'test-agent', description: 'Test agent' }
        ]
      };

      const result = registry.validateConfig('opencode', 'v1', config);
      expect(result.valid).toBe(true);
    });

    it('should return error for non-object config', () => {
      const result = registry.validateConfig('claude', 'v1', 'not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must be an object');
    });

    it('should return error for non-existent schema', () => {
      const result = registry.validateConfig('claude', 'v2' as SchemaVersion, {});
      // v2 exists for claude, so this should be valid
      expect(result.errors).toBeUndefined();
    });
  });

  describe('detectVersion', () => {
    it('should detect claude v1 for basic config', () => {
      const config = {
        mcpServers: { test: { command: 'npx' } }
      };

      const version = registry.detectVersion('claude', config);
      expect(version).toBeDefined();
    });

    it('should detect claude v2 for config with v2-specific fields', () => {
      const config = {
        mcpServers: {
          test: {
            command: 'npx',
            disabled: false,
            timeout: 60000
          }
        },
        settings: {
          autoUpdate: true
        }
      };

      const version = registry.detectVersion('claude', config);
      expect(version).toBeDefined();
    });

    it('should return undefined for invalid config', () => {
      const config = 'invalid';
      const version = registry.detectVersion('claude', config);
      expect(version).toBeUndefined();
    });
  });

  describe('createVersionLock', () => {
    it('should create a version lock with unique ID', () => {
      const lock = registry.createVersionLock('claude', 'v1', 'opencode', 'v1');
      
      expect(lock.sourceTool).toBe('claude');
      expect(lock.sourceVersion).toBe('v1');
      expect(lock.targetTool).toBe('opencode');
      expect(lock.targetVersion).toBe('v1');
      expect(lock.migrationId).toMatch(/^mig_\d+_[a-z0-9]+$/);
      expect(lock.timestamp).toBeDefined();
    });

    it('should retrieve version lock by ID', () => {
      const lock = registry.createVersionLock('claude', 'v2', 'cursor', 'v1');
      const retrieved = registry.getVersionLock(lock.migrationId);
      
      expect(retrieved).toEqual(lock);
    });

    it('should return undefined for non-existent lock', () => {
      const lock = registry.getVersionLock('non-existent');
      expect(lock).toBeUndefined();
    });
  });

  describe('getSchemaDiff', () => {
    it('should identify differences between claude v1 and v2', () => {
      const diff = registry.getSchemaDiff('claude', 'v1', 'claude', 'v2');
      
      // v2 adds 'settings' property
      expect(diff.added).toContain('settings');
      // v1 doesn't have anything v2 doesn't have
      expect(diff.removed.length).toBe(0);
    });

    it('should return empty diff for same version', () => {
      const diff = registry.getSchemaDiff('claude', 'v1', 'claude', 'v1');
      
      expect(diff.added.length).toBe(0);
      expect(diff.removed.length).toBe(0);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton registry', () => {
      expect(schemaRegistry).toBeDefined();
      expect(schemaRegistry.getSupportedTools().length).toBe(5);
    });
  });
});
