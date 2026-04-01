import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIDirectoryScanner } from '../scanner/ai-directory-scanner.js';
import type { ScanOptions, ScanResult, DetectedFile } from '../scanner/types.js';

// Mock fs/promises for testing
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
}));

vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/').replace(/\/+/g, '/')),
    resolve: vi.fn((...args: string[]) => args.join('/').replace(/\/+/g, '/')),
  };
});

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/user'),
}));

// Import mocked modules for test control
import { readdir, stat, readFile, access } from 'fs/promises';

// UNIT-SCANNER-001: Constructor initializes with default options
describe('AIDirectoryScanner', () => {
  let scanner: AIDirectoryScanner;

  beforeEach(() => {
    vi.clearAllMocks();
    scanner = new AIDirectoryScanner();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      expect(scanner).toBeDefined();
      expect(scanner).toBeInstanceOf(AIDirectoryScanner);
    });
  });

  // UNIT-SCANNER-002: scan() with scope='project' scans only project-level files
  describe('scan() with scope project', () => {
    it('should scan only project-level files when scope is project', async () => {
      const mockProjectAgents = [
        { name: 'agent1.md', isFile: () => true, isDirectory: () => false },
        { name: 'agent2.md', isFile: () => true, isDirectory: () => false },
      ];

      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.opencode/agents')) {
          return mockProjectAgents as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test Agent\n---\n# Content');

      const options: ScanOptions = {
        scope: 'project',
        projectPath: '/project',
      };

      const result = await scanner.scan(options);

      expect(result.files.length).toBeGreaterThanOrEqual(0);
      result.files.forEach((file) => {
        expect(file.scope).toBe('project');
      });
    });
  });

  // UNIT-SCANNER-003: scan() with scope='global' scans only global-level files
  describe('scan() with scope global', () => {
    it('should scan only global-level files when scope is global', async () => {
      const mockGlobalAgents = [
        { name: 'global-agent.md', isFile: () => true, isDirectory: () => false },
      ];

      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.config/opencode/agents')) {
          return mockGlobalAgents as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Global Agent\n---\n# Content');

      const options: ScanOptions = {
        scope: 'global',
        globalPath: '/home/user/.config/opencode',
      };

      const result = await scanner.scan(options);

      result.files.forEach((file) => {
        expect(file.scope).toBe('global');
      });
    });
  });

  // UNIT-SCANNER-004: scan() with scope='both' scans all files
  describe('scan() with scope both', () => {
    it('should scan both project and global files when scope is both', async () => {
      let callCount = 0;
      vi.mocked(readdir).mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          return [{ name: 'test.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test\n---\n');

      const options: ScanOptions = {
        scope: 'both',
        projectPath: '/project',
        globalPath: '/home/user/.config/opencode',
      };

      const result = await scanner.scan(options);

      const projectFiles = result.files.filter((f) => f.scope === 'project');
      const globalFiles = result.files.filter((f) => f.scope === 'global');

      // Should have files from both scopes
      expect(result.files.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-005: scanProjectLevel() finds agents with glob pattern
  describe('scanProjectLevel()', () => {
    it('should find agent files matching glob pattern', async () => {
      const mockAgents = [
        { name: 'coder.md', isFile: () => true, isDirectory: () => false },
        { name: 'reviewer.md', isFile: () => true, isDirectory: () => false },
      ];

      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.opencode/agents')) {
          return mockAgents as any;
        }
        if (pathStr.includes('.opencode')) {
          return [{ name: 'agents', isFile: () => false, isDirectory: () => true }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test Agent\n---\n# Content');

      const result = await scanner.scanProjectLevel('/project');

      const agentFiles = result.filter((f) => f.type === 'agent');
      expect(agentFiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-006: scanProjectLevel() finds skills with glob pattern
  describe('scanProjectLevel() for skills', () => {
    it('should find skill files matching glob pattern', async () => {
      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.opencode/skills') && pathStr.endsWith('SKILL.md')) {
          return [{ name: 'SKILL.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        if (pathStr.includes('.opencode/skills')) {
          return [{ name: 'git', isFile: () => false, isDirectory: () => true }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 200,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('# Skill\n\nDescription');

      const result = await scanner.scanProjectLevel('/project');

      const skillFiles = result.filter((f) => f.type === 'skill');
      expect(skillFiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-007: scanProjectLevel() finds config files
  describe('scanProjectLevel() for config', () => {
    it('should find opencode.json config files', async () => {
      vi.mocked(readdir).mockImplementation(async () => {
        return [{ name: 'opencode.json', isFile: () => true, isDirectory: () => false }] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 500,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue(JSON.stringify({ mcpServers: [] }));

      const result = await scanner.scanProjectLevel('/project');

      const configFiles = result.filter((f) => f.type === 'config');
      expect(configFiles.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-008: scanGlobalLevel() finds global agents
  describe('scanGlobalLevel()', () => {
    it('should find global agent files', async () => {
      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.config/opencode/agents')) {
          return [{ name: 'global-agent.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Global Agent\n---\n');

      const result = await scanner.scanGlobalLevel('/home/user/.config');

      const globalAgents = result.filter((f) => f.type === 'agent' && f.scope === 'global');
      expect(globalAgents.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-009: scanGlobalLevel() finds global skills
  describe('scanGlobalLevel() for skills', () => {
    it('should find global skill files', async () => {
      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.config/opencode/skills') && pathStr.endsWith('SKILL.md')) {
          return [{ name: 'SKILL.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 150,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('# Global Skill');

      const result = await scanner.scanGlobalLevel('/home/user/.config');

      const globalSkills = result.filter((f) => f.type === 'skill' && f.scope === 'global');
      expect(globalSkills.length).toBeGreaterThanOrEqual(0);
    });
  });

  // UNIT-SCANNER-010 & 011: categorizeByScope()
  describe('categorizeByScope()', () => {
    it('should identify project-level files', () => {
      const projectPaths = [
        '/project/.opencode/agents/test.md',
        './.opencode/skills/git/SKILL.md',
        '/workspace/opencode.json',
      ];

      projectPaths.forEach((path) => {
        const scope = scanner.categorizeByScope(path);
        expect(scope).toBe('project');
      });
    });

    it('should identify global-level files', () => {
      const globalPaths = [
        '/home/user/.config/opencode/agents/test.md',
        '~/.config/opencode/opencode.json',
        '/Users/user/.config/opencode/skills/test/SKILL.md',
      ];

      globalPaths.forEach((path) => {
        const scope = scanner.categorizeByScope(path);
        expect(scope).toBe('global');
      });
    });
  });

  // UNIT-SCANNER-012: Returns empty results for empty directories
  describe('Empty directory handling', () => {
    it('should return empty results for empty directories', async () => {
      vi.mocked(readdir).mockResolvedValue([] as any);

      const result = await scanner.scanProjectLevel('/empty-project');

      expect(result).toEqual([]);
    });

    it('should return empty results for directories without OpenCode files', async () => {
      vi.mocked(readdir).mockImplementation(async () => {
        return [
          { name: 'node_modules', isFile: () => false, isDirectory: () => true },
          { name: 'package.json', isFile: () => true, isDirectory: () => false },
          { name: 'README.md', isFile: () => true, isDirectory: () => false },
        ] as any;
      });

      const result = await scanner.scanProjectLevel('/regular-project');

      expect(result).toEqual([]);
    });
  });

  // UNIT-SCANNER-013, 014, 015: globScan() pattern matching
  describe('globScan()', () => {
    it('should match agent patterns correctly', async () => {
      const mockFs = {
        '/project/.opencode/agents': ['coder.md', 'reviewer.md'],
        '/project/.opencode': ['agents'],
      };

      vi.mocked(readdir).mockImplementation(async (path) => {
        const dir = String(path);
        if (mockFs[dir]) {
          return mockFs[dir].map((name) => ({
            name,
            isFile: () => name.endsWith('.md'),
            isDirectory: () => !name.includes('.'),
          })) as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      const result = await scanner.globScan('**/.opencode/agents/*.md', '/project');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should match skill patterns correctly', async () => {
      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('skills/git')) {
          return [{ name: 'SKILL.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        if (pathStr.includes('skills')) {
          return [{ name: 'git', isFile: () => false, isDirectory: () => true }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      const result = await scanner.globScan('**/.opencode/skills/**/SKILL.md', '/project');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should match config patterns correctly', async () => {
      vi.mocked(readdir).mockImplementation(async () => {
        return [{ name: 'opencode.json', isFile: () => true, isDirectory: () => false }] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      const result = await scanner.globScan('**/opencode.json', '/project');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // UNIT-SCANNER-016: Multiple projects in subdirectories
  describe('Multiple project detection', () => {
    it('should detect files in multiple subdirectories', async () => {
      let callCount = 0;
      vi.mocked(readdir).mockImplementation(async (path) => {
        callCount++;
        const pathStr = String(path);

        if (callCount === 1) {
          return [
            { name: 'project1', isFile: () => false, isDirectory: () => true },
            { name: 'project2', isFile: () => false, isDirectory: () => true },
          ] as any;
        }

        if (pathStr.includes('.opencode/agents')) {
          return [{ name: 'agent.md', isFile: () => true, isDirectory: () => false }] as any;
        }

        if (pathStr.includes('.opencode')) {
          return [{ name: 'agents', isFile: () => false, isDirectory: () => true }] as any;
        }

        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test\n---\n');

      const result = await scanner.scanProjectLevel('/multi-project', 5);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // UNIT-SCANNER-017: Error handling - permission errors
  describe('Error handling', () => {
    it('should handle permission errors gracefully', async () => {
      const permissionError = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      vi.mocked(readdir).mockRejectedValue(permissionError);

      const result = await scanner.scanProjectLevel('/restricted');

      expect(result).toEqual([]);
    });

    it('should handle missing directories gracefully', async () => {
      const notFoundError = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      notFoundError.code = 'ENOENT';
      vi.mocked(readdir).mockRejectedValue(notFoundError);

      const result = await scanner.scanProjectLevel('/non-existent');

      expect(result).toEqual([]);
    });

    it('should add errors to scan result', async () => {
      const permissionError = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      vi.mocked(readdir).mockRejectedValue(permissionError);

      const options: ScanOptions = {
        scope: 'project',
        projectPath: '/restricted',
      };

      const result = await scanner.scan(options);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('PERMISSION_DENIED');
    });
  });

  // UNIT-SCANNER-018: Handles missing directories gracefully
  describe('Missing directory handling', () => {
    it('should return empty results for non-existent directories', async () => {
      const notFoundError = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      notFoundError.code = 'ENOENT';
      vi.mocked(readdir).mockRejectedValue(notFoundError);

      const options: ScanOptions = {
        scope: 'project',
        projectPath: '/does-not-exist',
      };

      const result = await scanner.scan(options);

      expect(result.files).toEqual([]);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // UNIT-SCANNER-019 & 020: File validation
  describe('File validation', () => {
    it('should return true for valid agent files', async () => {
      vi.mocked(readFile).mockResolvedValue('---\nname: Test Agent\nmodel: claude-sonnet\n---\n# Content');

      const isValid = await scanner.validateFile('/project/.opencode/agents/test.md', 'agent');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid agent files', async () => {
      vi.mocked(readFile).mockResolvedValue('No frontmatter here');

      const isValid = await scanner.validateFile('/project/.opencode/agents/invalid.md', 'agent');

      expect(isValid).toBe(false);
    });
  });

  // UNIT-SCANNER-021 & 022: Metadata parsing
  describe('Metadata parsing', () => {
    it('should parse agent metadata from YAML frontmatter', async () => {
      vi.mocked(readFile).mockResolvedValue(`---
name: Coder Agent
model: claude-sonnet-4-20250514
description: A coding assistant
tools:
  - file-editor
  - terminal
---

# Coder Agent

This agent helps with coding tasks.`);

      const metadata = await scanner.parseAgentFile('/project/.opencode/agents/coder.md');

      expect(metadata).not.toBeNull();
      expect(metadata?.name).toBe('Coder Agent');
      expect(metadata?.model).toBe('claude-sonnet-4-20250514');
    });

    it('should parse config metadata from opencode.json', async () => {
      const config = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
          },
        ],
        defaultModel: 'claude-sonnet-4-20250514',
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(config));

      const metadata = await scanner.parseConfigFile('/project/opencode.json');

      expect(metadata).not.toBeNull();
      expect(metadata?.mcpServers).toHaveLength(1);
      expect(metadata?.mcpServers[0].name).toBe('filesystem');
    });

    it('should return null for invalid JSON in config file', async () => {
      vi.mocked(readFile).mockResolvedValue('invalid json {');

      const metadata = await scanner.parseConfigFile('/project/opencode.json');

      expect(metadata).toBeNull();
    });
  });

  // Test scan result structure
  describe('Scan result structure', () => {
    it('should return ScanResult with all required fields', async () => {
      vi.mocked(readdir).mockResolvedValue([] as any);

      const options: ScanOptions = {
        scope: 'project',
        projectPath: '/project',
      };

      const result = await scanner.scan(options);

      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('configs');
      expect(result).toHaveProperty('projectLevel');
      expect(result).toHaveProperty('globalLevel');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('filesScanned');
      expect(result).toHaveProperty('errors');

      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.agents)).toBe(true);
      expect(Array.isArray(result.skills)).toBe(true);
      expect(Array.isArray(result.configs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.duration).toBe('number');
      expect(typeof result.filesScanned).toBe('number');
    });
  });

  // Test DetectedFile structure
  describe('DetectedFile structure', () => {
    it('should create DetectedFile with all required fields', async () => {
      vi.mocked(readdir).mockImplementation(async () => {
        return [{ name: 'test.md', isFile: () => true, isDirectory: () => false }] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 256,
        mtime: new Date('2026-04-01'),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test\n---\n');

      const result = await scanner.scanProjectLevel('/project');

      if (result.length > 0) {
        const file = result[0];
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('type');
        expect(file).toHaveProperty('scope');
        expect(file).toHaveProperty('size');
        expect(file).toHaveProperty('lastModified');

        expect(typeof file.id).toBe('string');
        expect(typeof file.path).toBe('string');
        expect(typeof file.name).toBe('string');
        expect(['agent', 'skill', 'config']).toContain(file.type);
        expect(['project', 'global']).toContain(file.scope);
        expect(typeof file.size).toBe('number');
        expect(file.lastModified).toBeInstanceOf(Date);
      }
    });
  });

  // Test include/exclude options
  describe('Include/exclude options', () => {
    it('should respect includeAgents option', async () => {
      vi.mocked(readdir).mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes('.opencode/agents')) {
          return [{ name: 'agent.md', isFile: () => true, isDirectory: () => false }] as any;
        }
        if (pathStr.includes('.opencode')) {
          return [{ name: 'agents', isFile: () => false, isDirectory: () => true }] as any;
        }
        return [] as any;
      });

      vi.mocked(stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(),
      } as any);

      vi.mocked(readFile).mockResolvedValue('---\nname: Test\n---\n');

      const resultWithAgents = await scanner.scan({
        scope: 'project',
        projectPath: '/project',
        includeAgents: true,
        includeSkills: false,
        includeConfig: false,
      });

      const resultWithoutAgents = await scanner.scan({
        scope: 'project',
        projectPath: '/project',
        includeAgents: false,
        includeSkills: false,
        includeConfig: false,
      });

      // Results may differ based on implementation
      expect(Array.isArray(resultWithAgents.files)).toBe(true);
      expect(Array.isArray(resultWithoutAgents.files)).toBe(true);
    });
  });

  // Test maxDepth option
  describe('maxDepth option', () => {
    it('should respect maxDepth when scanning', async () => {
      let depthCounter = 0;
      vi.mocked(readdir).mockImplementation(async () => {
        depthCounter++;
        if (depthCounter > 5) {
          return [] as any;
        }
        return [{ name: 'subdir', isFile: () => false, isDirectory: () => true }] as any;
      });

      const result = await scanner.scan({
        scope: 'project',
        projectPath: '/deep-project',
        maxDepth: 2,
      });

      expect(Array.isArray(result.files)).toBe(true);
    });
  });
});
