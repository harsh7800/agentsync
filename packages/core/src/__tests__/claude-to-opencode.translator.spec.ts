import { describe, it, expect } from 'vitest';
import { ClaudeToOpenCodeTranslator } from '../translators/claude-to-opencode.translator';
import type { ClaudeConfig, ClaudeMCPServer } from '../types/claude.types';
import type { OpenCodeConfig } from '../types/opencode.types';

describe('ClaudeToOpenCodeTranslator', () => {
  let translator: ClaudeToOpenCodeTranslator;

  beforeEach(() => {
    translator = new ClaudeToOpenCodeTranslator();
  });

  describe('translateMCPConfig', () => {
    it('should translate Claude MCP servers to OpenCode format', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user'],
            env: {}
          }
        ]
      };

      const result = translator.translateMCPConfig(claudeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.mcpServers![0].name).toBe('filesystem');
      expect(result.mcpServers![0].command).toBe('npx');
      expect(result.mcpServers![0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem', '/home/user']);
    });

    it('should translate multiple MCP servers', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_xxx' }
          },
          {
            name: 'postgres',
            command: 'docker',
            args: ['run', 'postgres-mcp'],
            env: { DB_URL: 'postgresql://localhost' }
          }
        ]
      };

      const result = translator.translateMCPConfig(claudeConfig);

      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers![0].name).toBe('github');
      expect(result.mcpServers![1].name).toBe('postgres');
    });

    it('should preserve environment variables', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_xxxxxxxxxxxx' }
          }
        ]
      };

      const result = translator.translateMCPConfig(claudeConfig);

      expect(result.mcpServers![0].env).toEqual({ GITHUB_TOKEN: 'ghp_xxxxxxxxxxxx' });
    });

    it('should handle empty MCP config', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: []
      };

      const result = translator.translateMCPConfig(claudeConfig);

      expect(result.mcpServers).toEqual([]);
    });

    it('should handle MCP servers without env', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'simple-server',
            command: 'python',
            args: ['server.py']
          }
        ]
      };

      const result = translator.translateMCPConfig(claudeConfig);

      expect(result.mcpServers![0].env).toBeUndefined();
    });
  });

  describe('translateAgents', () => {
    it('should translate Claude agents to OpenCode format', () => {
      const claudeConfig: ClaudeConfig = {
        agents: [
          {
            name: 'code-reviewer',
            description: 'Reviews code',
            systemPrompt: 'You are a code reviewer',
            tools: ['github', 'filesystem']
          }
        ]
      };

      const result = translator.translateAgents(claudeConfig);

      expect(result.agents).toHaveLength(1);
      expect(result.agents![0].name).toBe('code-reviewer');
      expect(result.agents![0].description).toBe('Reviews code');
      expect(result.agents![0].systemPrompt).toBe('You are a code reviewer');
      expect(result.agents![0].tools).toEqual(['github', 'filesystem']);
    });

    it('should handle agents without tools', () => {
      const claudeConfig: ClaudeConfig = {
        agents: [
          {
            name: 'helper',
            description: 'General helper',
            systemPrompt: 'You are a helper'
          }
        ]
      };

      const result = translator.translateAgents(claudeConfig);

      expect(result.agents![0].tools).toBeUndefined();
    });

    it('should translate multiple agents', () => {
      const claudeConfig: ClaudeConfig = {
        agents: [
          {
            name: 'reviewer',
            description: 'Code reviewer',
            systemPrompt: 'Review code'
          },
          {
            name: 'tester',
            description: 'Test writer',
            systemPrompt: 'Write tests'
          }
        ]
      };

      const result = translator.translateAgents(claudeConfig);

      expect(result.agents).toHaveLength(2);
      expect(result.agents![0].name).toBe('reviewer');
      expect(result.agents![1].name).toBe('tester');
    });
  });

  describe('translateFullConfig', () => {
    it('should translate complete Claude config to OpenCode', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user'],
            env: {}
          }
        ],
        agents: [
          {
            name: 'code-reviewer',
            description: 'Reviews code',
            systemPrompt: 'You are a code reviewer',
            tools: ['filesystem']
          }
        ]
      };

      const result = translator.translate(claudeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.mcpServers![0].name).toBe('filesystem');
      expect(result.agents![0].name).toBe('code-reviewer');
    });

    it('should handle config with only MCP servers', () => {
      const claudeConfig: ClaudeConfig = {
        mcpServers: [
          {
            name: 'github',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: {}
          }
        ]
      };

      const result = translator.translate(claudeConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toBeUndefined();
    });

    it('should handle config with only agents', () => {
      const claudeConfig: ClaudeConfig = {
        agents: [
          {
            name: 'helper',
            description: 'Helper agent',
            systemPrompt: 'Help the user'
          }
        ]
      };

      const result = translator.translate(claudeConfig);

      expect(result.mcpServers).toBeUndefined();
      expect(result.agents).toHaveLength(1);
    });
  });
});