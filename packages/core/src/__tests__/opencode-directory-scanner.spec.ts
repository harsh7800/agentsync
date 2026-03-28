import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { OpenCodeDirectoryScanner } from '../parsers/opencode-directory-scanner/opencode-directory-scanner.js';
import { OpenCodeSkillParser } from '../parsers/opencode-directory-scanner/opencode-skill-parser.js';
import { OpenCodeAgentFileParser } from '../parsers/opencode-directory-scanner/opencode-agent-parser.js';

// Path to test fixtures
const fixturesDir = path.join(__dirname, 'fixtures', 'opencode-dir');

describe('OpenCodeDirectoryScanner', () => {
  let scanner: OpenCodeDirectoryScanner;

  beforeAll(() => {
    scanner = new OpenCodeDirectoryScanner();
  });

  describe('isOpenCodeDirectory', () => {
    it('should return true for valid OpenCode directory', async () => {
      const isValid = await scanner.isOpenCodeDirectory(fixturesDir);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent directory', async () => {
      const isValid = await scanner.isOpenCodeDirectory('/non/existent/path');
      expect(isValid).toBe(false);
    });

    it('should return false for a file instead of directory', async () => {
      const isValid = await scanner.isOpenCodeDirectory(__filename);
      expect(isValid).toBe(false);
    });
  });

  describe('scanMCPServers', () => {
    it('should scan MCP servers from opencode.json', async () => {
      const servers = await scanner.scanMCPServers(fixturesDir);
      
      expect(servers).toHaveLength(2);
      expect(servers[0].name).toBe('fetch');
      expect(servers[0].command).toBe('uvx');
      expect(servers[0].args).toEqual(['mcp-server-fetch']);
      expect(servers[1].name).toBe('git');
      expect(servers[1].command).toBe('uvx');
      expect(servers[1].args).toEqual(['mcp-server-git', '--repository', '.']);
    });

    it('should return empty array when opencode.json does not exist', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opencode-test-'));
      const servers = await scanner.scanMCPServers(tempDir);
      
      expect(servers).toEqual([]);
      
      // Cleanup
      await fs.rm(tempDir, { recursive: true });
    });
  });

  describe('scanAgents', () => {
    it('should scan agents from agents subdirectory', async () => {
      const agents = await scanner.scanAgents(fixturesDir);
      
      expect(agents).toHaveLength(2);
      
      // Check that agents have the expected structure
      const onboarding = agents.find(a => a.name === 'onboarding');
      expect(onboarding).toBeDefined();
      expect(onboarding?.description).toBe('Helps new team members understand the codebase');
      expect(onboarding?.systemPrompt).toBe('You are a friendly onboarding assistant.');
      expect(onboarding?.tools).toEqual(['filesystem', 'git']);
    });

    it('should return empty array when agents directory does not exist', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opencode-test-'));
      const agents = await scanner.scanAgents(tempDir);
      
      expect(agents).toEqual([]);
      
      // Cleanup
      await fs.rm(tempDir, { recursive: true });
    });
  });

  describe('scanSkills', () => {
    it('should scan skills from skills subdirectory', async () => {
      const skills = await scanner.scanSkills(fixturesDir);
      
      expect(skills).toHaveLength(2);
      
      // Check that skills have the expected structure
      const gitCommit = skills.find(s => s.name === 'git-commit');
      expect(gitCommit).toBeDefined();
      expect(gitCommit?.description).toBe('A skill for writing perfect git commits');
      expect(gitCommit?.enabled).toBe(true);
      expect(gitCommit?.path).toContain('git-commit');
      expect(gitCommit?.path).toContain('skill.md');
    });

    it('should return empty array when skills directory does not exist', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opencode-test-'));
      const skills = await scanner.scanSkills(tempDir);
      
      expect(skills).toEqual([]);
      
      // Cleanup
      await fs.rm(tempDir, { recursive: true });
    });
  });

  describe('scanSettings', () => {
    it('should scan settings from config.json', async () => {
      const settings = await scanner.scanSettings(fixturesDir);
      
      expect(settings).toBeDefined();
      expect(settings?.model).toBe('claude-3-sonnet');
      expect(settings?.temperature).toBe(0.7);
      expect(settings?.maxTokens).toBe(4096);
    });
  });

  describe('scan (full scan)', () => {
    it('should scan entire OpenCode directory structure', async () => {
      const result = await scanner.scan(fixturesDir);
      
      // Check config structure
      expect(result.config.basePath).toBe(fixturesDir);
      expect(result.config.mcpServers).toHaveLength(2);
      expect(result.config.agents).toHaveLength(2);
      expect(result.config.skills).toHaveLength(2);
      expect(result.config.discovered.agentCount).toBe(2);
      expect(result.config.discovered.skillCount).toBe(2);
      expect(result.config.discovered.mcpServerCount).toBe(2);
      
      // Check errors are empty (no errors expected)
      expect(result.errors.agents).toHaveLength(0);
      expect(result.errors.skills).toHaveLength(0);
    });

    it('should throw error for non-existent directory', async () => {
      await expect(scanner.scan('/non/existent/path'))
        .rejects
        .toThrow('OpenCode directory not found');
    });
  });

  describe('getDefaultPath', () => {
    it('should return valid default path', () => {
      const defaultPath = OpenCodeDirectoryScanner.getDefaultPath();
      
      expect(defaultPath).toContain('.config');
      expect(defaultPath).toContain('opencode');
    });
  });
});

describe('OpenCodeSkillParser', () => {
  let parser: OpenCodeSkillParser;

  beforeAll(() => {
    parser = new OpenCodeSkillParser();
  });

  describe('parse', () => {
    it('should parse skill.md file', async () => {
      const skillPath = path.join(fixturesDir, 'skills', 'git-commit', 'skill.md');
      const skill = await parser.parse(skillPath, 'git-commit');
      
      expect(skill.name).toBe('git-commit');
      expect(skill.description).toBe('A skill for writing perfect git commits');
      expect(skill.enabled).toBe(true);
      expect(skill.content).toContain('# Git Commit Skill');
    });
  });

  describe('parseContent', () => {
    it('should parse skill.md content with frontmatter', () => {
      const content = `---
description: Test skill
enabled: true
---

# Test Skill

Content here`;
      
      const config = parser.parseContent(content, 'test');
      
      expect(config.description).toBe('Test skill');
      expect(config.enabled).toBe(true);
    });

    it('should parse skill.md content without frontmatter', () => {
      const content = '# Test Skill\n\nContent without frontmatter';
      
      const config = parser.parseContent(content, 'test');
      
      expect(config.description).toBeUndefined();
      expect(config.enabled).toBeUndefined();
    });

    it('should handle enabled as false', () => {
      const content = `---
description: Disabled skill
enabled: false
---

# Disabled Skill`;
      
      const config = parser.parseContent(content, 'disabled');
      
      expect(config.enabled).toBe(false);
    });
  });
});

describe('OpenCodeAgentFileParser', () => {
  let parser: OpenCodeAgentFileParser;

  beforeAll(() => {
    parser = new OpenCodeAgentFileParser();
  });

  describe('parse', () => {
    it('should parse agent.md file', async () => {
      const agentPath = path.join(fixturesDir, 'agents', 'onboarding', 'agent.md');
      const agent = await parser.parse(agentPath, 'onboarding');
      
      expect(agent.name).toBe('onboarding');
      expect(agent.description).toBe('Helps new team members understand the codebase');
      expect(agent.systemPrompt).toBe('You are a friendly onboarding assistant.');
      expect(agent.tools).toEqual(['filesystem', 'git']);
    });
  });

  describe('parseContent', () => {
    it('should parse agent.md content with frontmatter', () => {
      const content = `---
description: Test agent
system_prompt: You are a test agent.
tools:
  - filesystem
---

# Test Agent

Content here`;
      
      const config = parser.parseContent(content, 'test');
      
      expect(config.description).toBe('Test agent');
      expect(config.systemPrompt).toBe('You are a test agent.');
      expect(config.tools).toEqual(['filesystem']);
    });

    it('should parse agent.md content without tools', () => {
      const content = `---
description: Agent without tools
---

# Agent Without Tools`;
      
      const config = parser.parseContent(content, 'no-tools');
      
      expect(config.description).toBe('Agent without tools');
      expect(config.tools).toBeUndefined();
    });
  });

  describe('toOpenCodeAgent', () => {
    it('should convert agent file to OpenCodeAgent', () => {
      const agentFile = {
        name: 'test-agent',
        description: 'Test description',
        systemPrompt: 'Test prompt',
        tools: ['tool1', 'tool2'],
        content: '# Test',
        path: '/test/path'
      };
      
      const agent = parser.toOpenCodeAgent(agentFile);
      
      expect(agent.name).toBe('test-agent');
      expect(agent.description).toBe('Test description');
      expect(agent.systemPrompt).toBe('Test prompt');
      expect(agent.tools).toEqual(['tool1', 'tool2']);
    });
  });
});
