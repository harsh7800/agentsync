/**
 * Unit Tests for Common Schema Components
 * 
 * Tests the core Common Schema functionality including:
 * - Type validation
 * - OpenCode Normalizer & Adapter
 * - Claude Normalizer & Adapter
 * - Migration Orchestrator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createEmptySchema, 
  isCommonSchema, 
  isCommonAgent,
  COMMON_SCHEMA_VERSION 
} from '../types.js';
import { CommonSchemaMigrationOrchestrator } from '../normalizer.js';
import { OpenCodeNormalizer, createOpenCodeNormalizer } from '../../parsers/opencode/normalizer.js';
import { OpenCodeAdapter, createOpenCodeAdapter } from '../../parsers/opencode/adapter.js';
import { ClaudeNormalizer, createClaudeNormalizer } from '../../parsers/claude/normalizer.js';
import { ClaudeAdapter, createClaudeAdapter } from '../../parsers/claude/adapter.js';
import type { OpenCodeToolModel, OpenCodeMCPServer, OpenCodeAgent, OpenCodeSkill } from '../../parsers/opencode/types.js';
import type { ClaudeToolModel, ClaudeMCPServer, ClaudeAgent } from '../../parsers/claude/types.js';
import type { CommonSchema, CommonAgent, CommonMCP, CommonSkill } from '../types.js';

describe('Common Schema - Core Types', () => {
  describe('createEmptySchema', () => {
    it('should create a valid empty schema', () => {
      const schema = createEmptySchema();
      
      expect(schema.version).toBe(COMMON_SCHEMA_VERSION);
      expect(schema.agents).toEqual([]);
      expect(schema.skills).toEqual([]);
      expect(schema.mcps).toEqual([]);
      expect(schema.globalEnv).toEqual({});
      expect(schema.metadata.sourceTools).toEqual([]);
      expect(schema.metadata.exportedAt).toBeInstanceOf(Date);
    });
  });

  describe('isCommonSchema', () => {
    it('should return true for valid schema', () => {
      const schema = createEmptySchema();
      expect(isCommonSchema(schema)).toBe(true);
    });

    it('should return false for invalid schema', () => {
      expect(isCommonSchema(null)).toBe(false);
      expect(isCommonSchema(undefined)).toBe(false);
      expect(isCommonSchema({})).toBe(false);
      expect(isCommonSchema({ version: '1.0.0' })).toBe(false);
    });
  });

  describe('isCommonAgent', () => {
    it('should return true for valid agent', () => {
      const agent: CommonAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent',
        skills: [],
        mcps: [],
        files: [],
        env: {},
        metadata: {
          sourceTool: 'claude',
          exportedAt: new Date(),
          extensions: {}
        }
      };
      expect(isCommonAgent(agent)).toBe(true);
    });

    it('should return false for invalid agent', () => {
      expect(isCommonAgent(null)).toBe(false);
      expect(isCommonAgent({})).toBe(false);
      expect(isCommonAgent({ id: 'test' })).toBe(false);
    });
  });
});

describe('Common Schema - OpenCode Normalizer', () => {
  let normalizer: OpenCodeNormalizer;

  beforeEach(() => {
    normalizer = new OpenCodeNormalizer();
  });

  it('should have correct tool name', () => {
    expect(normalizer.getToolName()).toBe('opencode');
  });

  it('should convert MCP servers to Common format', () => {
    const model: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '/test',
      mcpServers: [
        {
          name: 'filesystem',
          type: 'local',
          command: 'npx -y @modelcontextprotocol/server-filesystem',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { NODE_ENV: 'production' }
        }
      ],
      discovered: { agentCount: 0, skillCount: 0, mcpServerCount: 1 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect(schema.mcps).toHaveLength(1);
    expect(schema.mcps[0].id).toBe('opencode-filesystem');
    expect(schema.mcps[0].name).toBe('filesystem');
    expect(schema.mcps[0].type).toBe('local');
    expect(schema.mcps[0].command).toBe('npx');
    expect(schema.mcps[0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem']);
    expect(schema.mcps[0].env).toEqual({ NODE_ENV: 'production' });
  });

  it('should convert agents to Common format', () => {
    const model: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '/test',
      agents: [
        {
          name: 'Code Helper',
          description: 'Helps with code',
          systemPrompt: 'You are a coding assistant',
          tools: ['read_file', 'write_file']
        }
      ],
      discovered: { agentCount: 1, skillCount: 0, mcpServerCount: 0 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect(schema.agents).toHaveLength(1);
    expect(schema.agents[0].id).toBe('opencode-code-helper');
    expect(schema.agents[0].name).toBe('Code Helper');
    expect(schema.agents[0].description).toBe('Helps with code');
    expect(schema.agents[0].systemPrompt).toBe('You are a coding assistant');
  });

  it('should convert skills to Common format', () => {
    const model: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '/test',
      skills: [
        {
          name: 'Git Commit',
          description: 'Creates git commits',
          instructions: 'Write good commit messages',
          enabled: true,
          content: '# Git Commit',
          path: 'skills/git-commit/skill.md'
        }
      ],
      discovered: { agentCount: 0, skillCount: 1, mcpServerCount: 0 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect(schema.skills).toHaveLength(1);
    expect(schema.skills[0].id).toBe('opencode-git-commit');
    expect(schema.skills[0].name).toBe('Git Commit');
    expect(schema.skills[0].enabled).toBe(true);
  });

  it('should preserve tool settings in metadata', () => {
    const model: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '/test',
      settings: {
        model: 'gpt-4',
        temperature: 0.7
      },
      discovered: { agentCount: 0, skillCount: 0, mcpServerCount: 0 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect((schema.metadata as Record<string, unknown>).opencodeSettings).toBeDefined();
    expect((schema.metadata as Record<string, unknown>).opencodeSettings).toMatchObject({
      model: 'gpt-4',
      temperature: 0.7
    });
  });
});

describe('Common Schema - OpenCode Adapter', () => {
  let adapter: OpenCodeAdapter;

  beforeEach(() => {
    adapter = new OpenCodeAdapter();
  });

  it('should have correct tool name', () => {
    expect(adapter.getToolName()).toBe('opencode');
  });

  it('should convert Common MCP to OpenCode format', () => {
    const schema = createEmptySchema();
    schema.mcps.push({
      id: 'test-filesystem',
      name: 'filesystem',
      type: 'local',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      env: { KEY: 'value' },
      metadata: {
        sourceTool: 'opencode',
        exportedAt: new Date(),
        extensions: {}
      }
    });

    const model = adapter.fromCommonSchema(schema);

    expect(model.mcpServers).toHaveLength(1);
    expect(model.mcpServers![0].name).toBe('filesystem');
    expect(model.mcpServers![0].type).toBe('local');
    expect(model.mcpServers![0].command).toBe('npx -y @modelcontextprotocol/server-filesystem');
  });

  it('should convert Common Agent to OpenCode format', () => {
    const schema = createEmptySchema();
    schema.agents.push({
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      skills: [],
      mcps: [],
      files: [],
      env: {},
      metadata: {
        sourceTool: 'opencode',
        exportedAt: new Date(),
        extensions: {
          opencode: {
            originalTools: ['tool1', 'tool2']
          }
        }
      }
    });

    const model = adapter.fromCommonSchema(schema);

    expect(model.agents).toHaveLength(1);
    expect(model.agents![0].name).toBe('Test Agent');
    expect(model.agents![0].tools).toEqual(['tool1', 'tool2']);
  });
});

describe('Common Schema - Claude Normalizer', () => {
  let normalizer: ClaudeNormalizer;

  beforeEach(() => {
    normalizer = new ClaudeNormalizer();
  });

  it('should have correct tool name', () => {
    expect(normalizer.getToolName()).toBe('claude');
  });

  it('should convert Claude MCP to Common format', () => {
    const model: ClaudeToolModel = {
      tool: 'claude',
      rootPath: '/test',
      mcpServers: [
        {
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { NODE_ENV: 'production' }
        }
      ],
      discovered: { agentCount: 0, mcpServerCount: 1 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect(schema.mcps).toHaveLength(1);
    expect(schema.mcps[0].id).toBe('claude-filesystem');
    expect(schema.mcps[0].name).toBe('filesystem');
    expect(schema.mcps[0].type).toBe('local');
  });

  it('should convert Claude Agent to Common format', () => {
    const model: ClaudeToolModel = {
      tool: 'claude',
      rootPath: '/test',
      agents: [
        {
          name: 'Code Reviewer',
          description: 'Reviews code',
          systemPrompt: 'Review code for issues',
          tools: ['read_file', 'write_file']
        }
      ],
      discovered: { agentCount: 1, mcpServerCount: 0 }
    };

    const schema = normalizer.toCommonSchema(model);

    expect(schema.agents).toHaveLength(1);
    expect(schema.agents[0].id).toBe('claude-code-reviewer');
    expect(schema.agents[0].name).toBe('Code Reviewer');
    expect(schema.agents[0].metadata.extensions.claude).toBeDefined();
  });
});

describe('Common Schema - Claude Adapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter();
  });

  it('should have correct tool name', () => {
    expect(adapter.getToolName()).toBe('claude');
  });

  it('should filter out remote MCPs (Claude limitation)', () => {
    const schema = createEmptySchema();
    schema.mcps.push(
      {
        id: 'local-server',
        name: 'local',
        type: 'local',
        command: 'npx',
        args: [],
        env: {},
        metadata: {
          sourceTool: 'claude',
          exportedAt: new Date(),
          extensions: {}
        }
      },
      {
        id: 'remote-server',
        name: 'remote',
        type: 'remote',
        command: 'https://api.example.com',
        args: [],
        env: {},
        metadata: {
          sourceTool: 'opencode',
          exportedAt: new Date(),
          extensions: {}
        }
      }
    );

    const model = adapter.fromCommonSchema(schema);

    // Only local MCPs should be included
    expect(model.mcpServers).toHaveLength(1);
    expect(model.mcpServers![0].name).toBe('local');
  });
});

describe('Common Schema - Migration Orchestrator', () => {
  let orchestrator: CommonSchemaMigrationOrchestrator;

  beforeEach(() => {
    orchestrator = new CommonSchemaMigrationOrchestrator();
    orchestrator.registerNormalizer(new OpenCodeNormalizer());
    orchestrator.registerNormalizer(new ClaudeNormalizer());
    orchestrator.registerAdapter(new OpenCodeAdapter());
    orchestrator.registerAdapter(new ClaudeAdapter());
  });

  it('should track registered tools', () => {
    const tools = orchestrator.getRegisteredTools();
    expect(tools.normalizers).toContain('opencode');
    expect(tools.normalizers).toContain('claude');
    expect(tools.adapters).toContain('opencode');
    expect(tools.adapters).toContain('claude');
  });

  it('should migrate OpenCode → Claude', () => {
    const openCodeModel: OpenCodeToolModel = {
      tool: 'opencode',
      rootPath: '/test',
      agents: [
        { name: 'Test Agent', description: 'A test agent' }
      ],
      discovered: { agentCount: 1, skillCount: 0, mcpServerCount: 0 }
    };

    const claudeModel = orchestrator.migrate<OpenCodeToolModel, ClaudeToolModel>(
      'opencode',
      'claude',
      openCodeModel
    );

    expect(claudeModel.tool).toBe('claude');
    expect(claudeModel.agents).toHaveLength(1);
    expect(claudeModel.agents![0].name).toBe('Test Agent');
  });

  it('should migrate Claude → OpenCode', () => {
    const claudeModel: ClaudeToolModel = {
      tool: 'claude',
      rootPath: '/test',
      agents: [
        { name: 'Code Helper', description: 'Helps with code' }
      ],
      discovered: { agentCount: 1, mcpServerCount: 0 }
    };

    const openCodeModel = orchestrator.migrate<ClaudeToolModel, OpenCodeToolModel>(
      'claude',
      'opencode',
      claudeModel
    );

    expect(openCodeModel.tool).toBe('opencode');
    expect(openCodeModel.agents).toHaveLength(1);
    expect(openCodeModel.agents![0].name).toBe('Code Helper');
  });

  it('should throw error for unregistered normalizer', () => {
    const model = { tool: 'copilot' } as unknown as OpenCodeToolModel;
    
    expect(() => {
      orchestrator.normalize('copilot' as import('../../registry/tool-paths.registry.js').ToolName, model);
    }).toThrow('No normalizer registered');
  });

  it('should throw error for unregistered adapter', () => {
    const schema = createEmptySchema();
    
    expect(() => {
      orchestrator.adapt('copilot' as import('../../registry/tool-paths.registry.js').ToolName, schema);
    }).toThrow('No adapter registered');
  });
});
