import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { CodexToolParser, CodexScanner } from '../parsers/codex/index.js';
import { CodexAgentParser } from '../parsers/codex/parsers/agent.parser.js';
import { CodexSkillParser } from '../parsers/codex/parsers/skill.parser.js';
import { CodexNormalizer } from '../parsers/codex/normalizer.js';
import { CodexAdapter } from '../parsers/codex/adapter.js';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const CODEX_DIR = path.join(FIXTURES_DIR, 'codex-dir');

describe('CodexToolParser', () => {
  let parser: CodexToolParser;

  beforeEach(() => {
    parser = new CodexToolParser();
  });

  describe('isValid', () => {
    it('should return true for a valid Codex directory', async () => {
      const result = await parser.isValid(CODEX_DIR);
      expect(result).toBe(true);
    });

    it('should return false for a non-existent directory', async () => {
      const result = await parser.isValid('/non/existent/path');
      expect(result).toBe(false);
    });
  });

  describe('scan', () => {
    it('should scan a Codex directory and return tool model', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model).toBeDefined();
      expect(result.model.tool).toBe('codex');
      expect(result.model.rootPath).toBe(CODEX_DIR);
    });

    it('should discover skills', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model.skills).toBeDefined();
      expect(result.model.skills!.length).toBeGreaterThanOrEqual(2);
      expect(result.model.discovered.skillCount).toBeGreaterThanOrEqual(2);
    });

    it('should discover agents from AGENTS.md and agents/ directory', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model.agents).toBeDefined();
      // Should find: default (AGENTS.md), project (AGENTS.md), code-reviewer (agents/code-reviewer/agent.md), test-writer (agents/test-writer.md)
      expect(result.model.agents!.length).toBeGreaterThanOrEqual(3);
      expect(result.model.discovered.agentCount).toBeGreaterThanOrEqual(3);
    });

    it('should discover MCP servers from config.toml', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model.mcpServers).toBeDefined();
      expect(result.model.mcpServers!.length).toBeGreaterThanOrEqual(1);
      expect(result.model.discovered.mcpServerCount).toBeGreaterThanOrEqual(1);
    });

    it('should discover saved prompts', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model.prompts).toBeDefined();
      expect(result.model.prompts!.length).toBeGreaterThanOrEqual(1);
      expect(result.model.discovered.promptCount).toBeGreaterThanOrEqual(1);
    });

    it('should discover sessions', async () => {
      const result = await parser.scan(CODEX_DIR);

      expect(result.model.sessions).toBeDefined();
      expect(result.model.sessions!.length).toBeGreaterThanOrEqual(1);
      expect(result.model.discovered.sessionCount).toBeGreaterThanOrEqual(1);
    });

    it('should throw for invalid directory', async () => {
      await expect(parser.scan('/non/existent')).rejects.toThrow('Codex directory not found');
    });
  });
});

describe('CodexScanner', () => {
  let scanner: CodexScanner;

  beforeEach(() => {
    scanner = new CodexScanner();
  });

  describe('isCodexDirectory', () => {
    it('should detect valid Codex directory', async () => {
      const result = await scanner.isCodexDirectory(CODEX_DIR);
      expect(result).toBe(true);
    });

    it('should reject non-directory paths', async () => {
      const filePath = path.join(CODEX_DIR, 'config.toml');
      const result = await scanner.isCodexDirectory(filePath);
      expect(result).toBe(false);
    });
  });

  describe('scanMCPServers', () => {
    it('should parse MCP servers from config.toml', async () => {
      const servers = await scanner.scanMCPServers(CODEX_DIR);

      expect(servers).toBeDefined();
      expect(servers.length).toBeGreaterThanOrEqual(2);

      const fsServer = servers.find(s => s.name === 'filesystem');
      expect(fsServer).toBeDefined();
      expect(fsServer!.type).toBe('local');
      expect(fsServer!.command).toBe('npx');
    });

    it('should parse remote MCP servers', async () => {
      const servers = await scanner.scanMCPServers(CODEX_DIR);

      const remoteServer = servers.find(s => s.name === 'remote-db');
      expect(remoteServer).toBeDefined();
      expect(remoteServer!.type).toBe('remote');
      expect(remoteServer!.url).toBe('https://mcp.example.com/db');
    });
  });

  describe('scanAgents', () => {
    it('should parse AGENTS.md', async () => {
      const result = await scanner.scanAgents(CODEX_DIR);

      expect(result.agents).toBeDefined();
      expect(result.agents.length).toBeGreaterThanOrEqual(1);

      const defaultAgent = result.agents.find(a => a.name === 'default');
      expect(defaultAgent).toBeDefined();
      expect(defaultAgent!.systemPrompt).toContain('Global Agent Instructions');
    });

    it('should return empty array for missing AGENTS.md', async () => {
      const result = await scanner.scanAgents('/tmp/empty');
      expect(result.agents).toEqual([]);
    });

    it('should scan agents/{name}/agent.md subdirectory structure', async () => {
      const result = await scanner.scanAgents(CODEX_DIR);

      const codeReviewer = result.agents.find(a => a.name === 'code-reviewer');
      expect(codeReviewer).toBeDefined();
      expect(codeReviewer!.description).toContain('code review');
      expect(codeReviewer!.systemPrompt).toContain('code review expert');
    });

    it('should scan agents/{name}.md flat file structure', async () => {
      const result = await scanner.scanAgents(CODEX_DIR);

      const testWriter = result.agents.find(a => a.name === 'test-writer');
      expect(testWriter).toBeDefined();
      expect(testWriter!.description).toContain('Test generation');
      expect(testWriter!.systemPrompt).toContain('test writing expert');
    });
  });

  describe('scanSkills', () => {
    it('should scan skills directory', async () => {
      const result = await scanner.scanSkills(CODEX_DIR);

      expect(result.skills).toBeDefined();
      expect(result.skills.length).toBeGreaterThanOrEqual(2);

      const codeReview = result.skills.find(s => s.name === 'code-review');
      expect(codeReview).toBeDefined();
      expect(codeReview!.description).toContain('code review');
      expect(codeReview!.enabled).toBe(true);
    });

    it('should parse skill scripts', async () => {
      const result = await scanner.scanSkills(CODEX_DIR);

      const codeReview = result.skills.find(s => s.name === 'code-review');
      expect(codeReview).toBeDefined();
      expect(codeReview!.scripts).toBeDefined();
      expect(codeReview!.scripts!.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse openai.yaml if present', async () => {
      const result = await scanner.scanSkills(CODEX_DIR);

      const codeReview = result.skills.find(s => s.name === 'code-review');
      expect(codeReview).toBeDefined();
      expect(codeReview!.openaiConfig).toBeDefined();
      expect(codeReview!.openaiConfig!.model).toBe('gpt-4');
    });
  });

  describe('scanPrompts', () => {
    it('should scan saved prompts', async () => {
      const result = await scanner.scanPrompts(CODEX_DIR);

      expect(result.prompts).toBeDefined();
      expect(result.prompts.length).toBeGreaterThanOrEqual(1);

      const reviewPrompt = result.prompts.find(p => p.name === 'code-review');
      expect(reviewPrompt).toBeDefined();
      expect(reviewPrompt!.content).toContain('Review the recent changes');
    });
  });

  describe('scanSessions', () => {
    it('should scan session metadata', async () => {
      const result = await scanner.scanSessions(CODEX_DIR);

      expect(result.sessions).toBeDefined();
      expect(result.sessions.length).toBeGreaterThanOrEqual(1);

      const session = result.sessions[0];
      expect(session.id).toBe('session-001');
      expect(session.agentName).toBe('code-reviewer');
    });
  });
});

describe('CodexAgentParser', () => {
  let parser: CodexAgentParser;

  beforeEach(() => {
    parser = new CodexAgentParser();
  });

  describe('parseContent', () => {
    it('should parse frontmatter from AGENTS.md', () => {
      const content = `---
description: Test agent
tools:
  - filesystem
  - git
---

# Agent Instructions

Do things.`;

      const result = parser.parseContent(content);
      expect(result.description).toBe('Test agent');
      expect(result.tools).toEqual(['filesystem', 'git']);
      expect(result.systemPrompt).toContain('Agent Instructions');
    });

    it('should handle content without frontmatter', () => {
      const content = '# Just instructions\n\nDo things.';

      const result = parser.parseContent(content);
      expect(result.description).toBe('');
      expect(result.systemPrompt).toContain('Just instructions');
    });
  });

  describe('hasAgentsFile', () => {
    it('should detect AGENTS.md in directory', async () => {
      const result = await parser.hasAgentsFile(CODEX_DIR);
      expect(result).toBe(true);
    });

    it('should return false for directory without AGENTS.md', async () => {
      const result = await parser.hasAgentsFile('/tmp');
      expect(result).toBe(false);
    });
  });
});

describe('CodexSkillParser', () => {
  let parser: CodexSkillParser;

  beforeEach(() => {
    parser = new CodexSkillParser();
  });

  describe('parseContent', () => {
    it('should parse frontmatter from SKILL.md', () => {
      const content = `---
description: Test skill
enabled: true
instructions: Do things
---

# Skill Content`;

      const result = parser.parseContent(content);
      expect(result.description).toBe('Test skill');
      expect(result.enabled).toBe(true);
      expect(result.instructions).toBe('Do things');
    });
  });

  describe('isSkillDirectory', () => {
    it('should detect skill directory with SKILL.md', async () => {
      const skillDir = path.join(CODEX_DIR, 'skills', 'code-review');
      const result = await parser.isSkillDirectory(skillDir);
      expect(result).toBe(true);
    });

    it('should return false for non-skill directory', async () => {
      const result = await parser.isSkillDirectory('/tmp');
      expect(result).toBe(false);
    });
  });
});

describe('CodexNormalizer', () => {
  let normalizer: CodexNormalizer;

  beforeEach(() => {
    normalizer = new CodexNormalizer();
  });

  describe('toCommonSchema', () => {
    it('should convert Codex model to Common Schema', () => {
      const model = {
        tool: 'codex' as const,
        rootPath: '/test',
        mcpServers: [{
          name: 'test-mcp',
          type: 'local' as const,
          command: 'npx',
          args: ['test-server']
        }],
        agents: [{
          name: 'test-agent',
          description: 'A test agent',
          systemPrompt: 'Do things'
        }],
        skills: [{
          name: 'test-skill',
          description: 'A test skill',
          enabled: true,
          content: 'Skill content',
          path: 'skills/test/SKILL.md'
        }],
        discovered: {
          agentCount: 1,
          skillCount: 1,
          mcpServerCount: 1,
          promptCount: 0,
          sessionCount: 0
        }
      };

      const schema = normalizer.toCommonSchema(model);

      expect(schema.mcps.length).toBe(1);
      expect(schema.mcps[0].name).toBe('test-mcp');
      expect(schema.agents.length).toBe(1);
      expect(schema.agents[0].name).toBe('test-agent');
      expect(schema.skills.length).toBe(1);
      expect(schema.skills[0].name).toBe('test-skill');
      expect(schema.metadata.sourceTools).toContain('codex');
    });

    it('should mask API keys in settings', () => {
      const model = {
        tool: 'codex' as const,
        rootPath: '/test',
        settings: {
          provider: {
            provider: 'openai',
            apiKey: 'sk-secret-key'
          }
        },
        discovered: {
          agentCount: 0,
          skillCount: 0,
          mcpServerCount: 0,
          promptCount: 0,
          sessionCount: 0
        }
      };

      const schema = normalizer.toCommonSchema(model);
      const codexSettings = (schema.metadata as Record<string, unknown>).codexSettings as Record<string, unknown>;
      const provider = codexSettings.provider as Record<string, unknown>;
      expect(provider.apiKey).toBe('[MASKED]');
    });
  });
});

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    adapter = new CodexAdapter();
  });

  describe('fromCommonSchema', () => {
    it('should convert Common Schema to Codex model', () => {
      const schema = {
        version: '1.0.0' as const,
        mcps: [{
          id: 'test-mcp',
          name: 'test-mcp',
          type: 'local' as const,
          command: 'npx',
          args: ['test-server'],
          env: {},
          metadata: {
            sourceTool: 'codex' as const,
            exportedAt: new Date(),
            extensions: {}
          }
        }],
        agents: [{
          id: 'test-agent',
          name: 'test-agent',
          description: 'A test agent',
          systemPrompt: 'Do things',
          skills: [],
          mcps: [],
          files: [],
          env: {},
          metadata: {
            sourceTool: 'codex' as const,
            exportedAt: new Date(),
            extensions: {}
          }
        }],
        skills: [{
          id: 'test-skill',
          name: 'test-skill',
          description: 'A test skill',
          enabled: true,
          content: 'Skill content',
          metadata: {
            sourceTool: 'codex' as const,
            exportedAt: new Date(),
            extensions: {}
          }
        }],
        globalEnv: {},
        metadata: {
          exportedAt: new Date(),
          sourceTools: ['opencode' as const]
        }
      };

      const model = adapter.fromCommonSchema(schema);

      expect(model.tool).toBe('codex');
      expect(model.mcpServers!.length).toBe(1);
      expect(model.mcpServers![0].name).toBe('test-mcp');
      expect(model.agents!.length).toBe(1);
      expect(model.agents![0].name).toBe('test-agent');
      expect(model.skills!.length).toBe(1);
      expect(model.skills![0].name).toBe('test-skill');
    });
  });
});
