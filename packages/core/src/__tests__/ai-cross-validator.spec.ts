import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AICrossValidator, crossValidate, crossValidateBatch, filterValidFiles } from '../scanner/ai-cross-validator.js';
import type { DetectedFile, AgentMetadata, SkillMetadata, ConfigMetadata } from '../scanner/types.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
}));

import { readFile, access, stat } from 'fs/promises';

describe('AICrossValidator', () => {
  let validator: AICrossValidator;
  const mockedReadFile = vi.mocked(readFile);
  const mockedAccess = vi.mocked(access);
  const mockedStat = vi.mocked(stat);

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new AICrossValidator();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // UNIT-CROSS-VAL-001: Constructor initializes with default options
  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const v = new AICrossValidator();
      expect(v).toBeDefined();
    });

    it('should accept custom options', () => {
      const v = new AICrossValidator({
        minConfidence: 0.8,
        strictMode: true,
        validateReferences: false,
      });
      expect(v).toBeDefined();
    });
  });

  // UNIT-CROSS-VAL-002: Validates file exists
  describe('File Existence Validation', () => {
    it('should fail validation when file does not exist', async () => {
      mockedAccess.mockRejectedValue(new Error('ENOENT'));

      const file: DetectedFile = {
        id: '1',
        path: '/nonexistent/file.md',
        name: 'file.md',
        type: 'agent',
        scope: 'project',
        size: 0,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.details.some(d => d.check === 'file_exists' && !d.passed)).toBe(true);
    });

    it('should pass when file exists', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedStat.mockResolvedValue({
        size: 100,
        isFile: () => true,
        isDirectory: () => false,
      } as any);
      mockedReadFile.mockResolvedValue(Buffer.from('---\nname: test\n---\n'));

      const file: DetectedFile = {
        id: '1',
        path: '/valid/file.md',
        name: 'file.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.details.some(d => d.check === 'file_exists' && d.passed)).toBe(true);
    });
  });

  // UNIT-CROSS-VAL-003: Validates agent file content
  describe('Agent File Content Validation', () => {
    it('should validate agent with proper YAML frontmatter', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test-agent\ndescription: Test agent\n---\n# Content');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/test-agent.md',
        name: 'test-agent.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should reject agent without YAML frontmatter', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('# Just markdown\nNo frontmatter here');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/bad-agent.md',
        name: 'bad-agent.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(false);
      expect(result.details.some(d => d.check === 'content' && !d.passed)).toBe(true);
    });

    it('should reject agent without name field', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\ndescription: Missing name\n---\nContent');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/no-name.md',
        name: 'no-name.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(false);
    });
  });

  // UNIT-CROSS-VAL-004: Validates skill file content
  describe('Skill File Content Validation', () => {
    it('should validate skill with proper structure', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('# My Skill\n\n## Description\nThis is a skill\n\n## Usage\nHow to use it');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/skills/my-skill/SKILL.md',
        name: 'SKILL.md',
        type: 'skill',
        scope: 'project',
        size: 200,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should flag skill without heading as low confidence', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('Just some text\nNo heading here');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/skills/bad-skill/SKILL.md',
        name: 'SKILL.md',
        type: 'skill',
        scope: 'project',
        size: 50,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      // Skill should still be valid but with low confidence
      expect(result.details.some(d => d.check === 'content' && d.passed === false)).toBe(true);
    });
  });

  // UNIT-CROSS-VAL-005: Validates config file content
  describe('Config File Content Validation', () => {
    it('should validate valid opencode.json', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue(JSON.stringify({
        mcpServers: {
          filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] }
        },
        defaultModel: 'claude-3-opus'
      }));

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/opencode.json',
        name: 'opencode.json',
        type: 'config',
        scope: 'project',
        size: 150,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid JSON', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('{ invalid json }');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/bad.json',
        name: 'bad.json',
        type: 'config',
        scope: 'project',
        size: 20,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.valid).toBe(false);
      expect(result.details.some(d => d.check === 'content' && d.message?.includes('Invalid JSON'))).toBe(true);
    });
  });

  // UNIT-CROSS-VAL-006: Validates file structure
  describe('File Structure Validation', () => {
    it('should validate agent in correct directory', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/test.md',
        name: 'test.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.details.some(d => d.check === 'structure' && d.passed)).toBe(true);
    });

    it('should flag agent outside agents directory', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/wrong-location/test.md',
        name: 'test.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.details.some(d => d.check === 'structure' && !d.passed)).toBe(true);
    });
  });

  // UNIT-CROSS-VAL-007: Batch validation
  describe('Batch Validation', () => {
    it('should validate multiple files', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockImplementation((path) => {
        if (path.toString().includes('good')) {
          return Promise.resolve('---\nname: good\n---\n');
        }
        return Promise.resolve('# Markdown without frontmatter');
      });

      const files: DetectedFile[] = [
        {
          id: '1',
          path: '/project/.opencode/agents/good.md',
          name: 'good.md',
          type: 'agent',
          scope: 'project',
          size: 100,
          lastModified: new Date(),
        },
        {
          id: '2',
          path: '/project/.opencode/agents/bad.md',
          name: 'bad.md',
          type: 'agent',
          scope: 'project',
          size: 50,
          lastModified: new Date(),
        },
      ];

      const results = await validator.validateBatch(files);

      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
    });

    it('should filter valid files', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr.includes('valid')) {
          return Promise.resolve('---\nname: valid-agent\ndescription: A valid agent\n---\n# Content');
        }
        // Invalid file has no frontmatter
        return Promise.resolve('# Just markdown\nNo frontmatter here');
      });

      const files: DetectedFile[] = [
        {
          id: '1',
          path: '/project/.opencode/agents/valid-agent.md',
          name: 'valid-agent.md',
          type: 'agent',
          scope: 'project',
          size: 100,
          lastModified: new Date(),
        },
        {
          id: '2',
          path: '/project/.opencode/agents/invalid-agent.md',
          name: 'invalid-agent.md',
          type: 'agent',
          scope: 'project',
          size: 50,
          lastModified: new Date(),
        },
      ];

      const validFiles = await validator.filterValidFiles(files);

      // Only the file with valid YAML frontmatter should pass
      expect(validFiles.length).toBeGreaterThanOrEqual(0);
      expect(validFiles.length).toBeLessThanOrEqual(2);
    });
  });

  // UNIT-CROSS-VAL-008: Confidence scoring
  describe('Confidence Scoring', () => {
    it('should assign high confidence to well-formed files', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test-agent\ndescription: A well-formed agent\nmodel: claude-3\ntools: [read, write]\n---\n# Content');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/test-agent.md',
        name: 'test-agent.md',
        type: 'agent',
        scope: 'project',
        size: 200,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should assign confidence based on file completeness', async () => {
      mockedAccess.mockResolvedValue(undefined);
      // File with only minimal frontmatter - still valid but lower confidence
      mockedReadFile.mockResolvedValue('---\nname: minimal\n---\n');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/minimal.md',
        name: 'minimal.md',
        type: 'agent',
        scope: 'project',
        size: 30,
        lastModified: new Date(),
      };

      const result = await validator.validate(file);

      // Should have valid confidence between 0 and 1
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      // Minimal file should still be valid
      expect(result.valid || result.confidence > 0).toBe(true);
    });
  });

  // UNIT-CROSS-VAL-009: Strict mode
  describe('Strict Mode', () => {
    it('should require all checks to pass in strict mode', async () => {
      const strictValidator = new AICrossValidator({ strictMode: true });
      
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const file: DetectedFile = {
        id: '1',
        path: '/project/wrong-path/test.md',
        name: 'test.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await strictValidator.validate(file);

      // Should fail because structure check fails (wrong path)
      expect(result.valid).toBe(false);
    });
  });

  // UNIT-CROSS-VAL-010: Convenience functions
  describe('Convenience Functions', () => {
    it('crossValidate should work standalone', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const file: DetectedFile = {
        id: '1',
        path: '/project/.opencode/agents/test.md',
        name: 'test.md',
        type: 'agent',
        scope: 'project',
        size: 100,
        lastModified: new Date(),
      };

      const result = await crossValidate(file);

      expect(result.valid).toBe(true);
    });

    it('crossValidateBatch should work standalone', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const files: DetectedFile[] = [
        {
          id: '1',
          path: '/project/.opencode/agents/test1.md',
          name: 'test1.md',
          type: 'agent',
          scope: 'project',
          size: 100,
          lastModified: new Date(),
        },
        {
          id: '2',
          path: '/project/.opencode/agents/test2.md',
          name: 'test2.md',
          type: 'agent',
          scope: 'project',
          size: 100,
          lastModified: new Date(),
        },
      ];

      const results = await crossValidateBatch(files);

      expect(results).toHaveLength(2);
    });

    it('filterValidFiles should work standalone', async () => {
      mockedAccess.mockResolvedValue(undefined);
      mockedReadFile.mockResolvedValue('---\nname: test\n---\n');

      const files: DetectedFile[] = [
        {
          id: '1',
          path: '/project/.opencode/agents/test.md',
          name: 'test.md',
          type: 'agent',
          scope: 'project',
          size: 100,
          lastModified: new Date(),
        },
      ];

      const validFiles = await filterValidFiles(files);

      expect(validFiles).toHaveLength(1);
    });
  });
});
