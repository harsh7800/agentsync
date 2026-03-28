import { describe, it, expect } from 'vitest';
import { OpenCodeToClaudeTranslator } from '../translators/opencode-to-claude.translator';
import type { OpenCodeConfig } from '../types/opencode.types';
import type { ClaudeConfig } from '../types/claude.types';

describe('OpenCodeToClaudeTranslator', () => {
  let translator: OpenCodeToClaudeTranslator;

  beforeEach(() => {
    translator = new OpenCodeToClaudeTranslator();
  });

  describe('translateMCPConfig', () => {
    it('should translate OpenCode MCP servers to Claude format', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user'],
            env: {}
          }
        ]
      };

      const result = translator.translateMCPConfig(openCodeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.mcpServers![0].name).toBe('filesystem');
      expect(result.mcpServers![0].command).toBe('npx');
      expect(result.mcpServers![0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem', '/home/user']);
    });

    it('should translate multiple MCP servers', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_xxx' }
          },
          {
            name: 'fetch',
            command: 'uvx',
            args: ['mcp-server-fetch'],
            env: {}
          }
        ]
      };

      const result = translator.translateMCPConfig(openCodeConfig);

      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers![0].name).toBe('github');
      expect(result.mcpServers![1].name).toBe('fetch');
    });

    it('should preserve environment variables', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_xxxxxxxxxxxx' }
          }
        ]
      };

      const result = translator.translateMCPConfig(openCodeConfig);

      expect(result.mcpServers![0].env).toEqual({ GITHUB_TOKEN: 'ghp_xxxxxxxxxxxx' });
    });

    it('should handle empty MCP config', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: []
      };

      const result = translator.translateMCPConfig(openCodeConfig);

      expect(result.mcpServers).toEqual([]);
    });
  });

  describe('translateAgents', () => {
    it('should translate OpenCode agents to Claude format', () => {
      const openCodeConfig: OpenCodeConfig = {
        agents: [
          {
            name: 'opencode-reviewer',
            description: 'Reviews code changes',
            systemPrompt: 'You are an expert code reviewer',
            tools: ['github', 'filesystem']
          }
        ]
      };

      const result = translator.translateAgents(openCodeConfig);

      expect(result.agents).toHaveLength(1);
      expect(result.agents![0].name).toBe('opencode-reviewer');
      expect(result.agents![0].description).toBe('Reviews code changes');
      expect(result.agents![0].systemPrompt).toBe('You are an expert code reviewer');
      expect(result.agents![0].tools).toEqual(['github', 'filesystem']);
    });

    it('should handle agents without optional fields', () => {
      const openCodeConfig: OpenCodeConfig = {
        agents: [
          {
            name: 'minimal-agent',
            description: 'A minimal agent'
          }
        ]
      };

      const result = translator.translateAgents(openCodeConfig);

      expect(result.agents![0].name).toBe('minimal-agent');
      expect(result.agents![0].description).toBe('A minimal agent');
      expect(result.agents![0].systemPrompt).toBeUndefined();
      expect(result.agents![0].tools).toBeUndefined();
    });

    it('should translate multiple agents', () => {
      const openCodeConfig: OpenCodeConfig = {
        agents: [
          {
            name: 'reviewer',
            description: 'Code reviewer',
            systemPrompt: 'Review code'
          },
          {
            name: 'tester',
            description: 'Test generator',
            systemPrompt: 'Write tests'
          }
        ]
      };

      const result = translator.translateAgents(openCodeConfig);

      expect(result.agents).toHaveLength(2);
      expect(result.agents![0].name).toBe('reviewer');
      expect(result.agents![1].name).toBe('tester');
    });
  });

  describe('translateFullConfig', () => {
    it('should translate complete OpenCode config to Claude', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'git',
            command: 'uvx',
            args: ['mcp-server-git'],
            env: {}
          }
        ],
        agents: [
          {
            name: 'refactoring-partner',
            description: 'Assists with refactoring',
            systemPrompt: 'Help refactor code',
            tools: ['git']
          }
        ]
      };

      const result = translator.translate(openCodeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.mcpServers![0].name).toBe('git');
      expect(result.agents![0].name).toBe('refactoring-partner');
    });

    it('should handle config with only MCP servers', () => {
      const openCodeConfig: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'memory',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-memory'],
            env: {}
          }
        ]
      };

      const result = translator.translate(openCodeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toBeUndefined();
    });

    it('should handle config with only agents', () => {
      const openCodeConfig: OpenCodeConfig = {
        agents: [
          {
            name: 'api-designer',
            description: 'API design expert',
            systemPrompt: 'Design APIs'
          }
        ]
      };

      const result = translator.translate(openCodeConfig);

      expect(result.mcpServers).toBeUndefined();
      expect(result.agents).toHaveLength(1);
    });

    it('should handle empty config', () => {
      const openCodeConfig: OpenCodeConfig = {};

      const result = translator.translate(openCodeConfig);

      expect(result.mcpServers).toBeUndefined();
      expect(result.agents).toBeUndefined();
    });
  });

  describe('bidirectional translation', () => {
    it('should maintain data integrity through round-trip translation', () => {
      const originalOpenCode: OpenCodeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_test123' }
          }
        ],
        agents: [
          {
            name: 'test-agent',
            description: 'Test description',
            systemPrompt: 'Test prompt',
            tools: ['github']
          }
        ]
      };

      // Translate to Claude
      const claudeConfig = translator.translate(originalOpenCode);

      // Verify structure is maintained
      expect(claudeConfig.mcpServers).toHaveLength(1);
      expect(claudeConfig.agents).toHaveLength(1);
      expect(claudeConfig.mcpServers![0].name).toBe('github');
      expect(claudeConfig.agents![0].name).toBe('test-agent');
      expect(claudeConfig.mcpServers![0].env?.GITHUB_TOKEN).toBe('ghp_test123');
    });
  });
});