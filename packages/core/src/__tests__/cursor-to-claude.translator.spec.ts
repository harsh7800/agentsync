/**
 * Tests for Cursor to Claude Translator
 */

import { describe, it, expect } from 'vitest';
import { CursorToClaudeTranslator } from '../translators/cursor-to-claude.translator.js';
import type { CursorConfig } from '../types/cursor.types.js';

describe('CursorToClaudeTranslator', () => {
  const translator = new CursorToClaudeTranslator();

  describe('MCP Configuration Translation', () => {
    it('should translate MCP servers from Cursor to Claude format', () => {
      const cursorConfig: CursorConfig = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: { NODE_ENV: 'production' }
          },
          {
            name: 'git',
            command: 'uvx',
            args: ['mcp-server-git']
          }
        ]
      };

      const result = translator.translateMCPConfig(cursorConfig);

      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers[0]).toEqual({
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { NODE_ENV: 'production' }
      });
      expect(result.mcpServers[1]).toEqual({
        name: 'git',
        command: 'uvx',
        args: ['mcp-server-git']
      });
    });

    it('should handle empty MCP servers', () => {
      const cursorConfig: CursorConfig = {};
      const result = translator.translateMCPConfig(cursorConfig);
      expect(result.mcpServers).toHaveLength(0);
    });

    it('should handle MCP servers without optional fields', () => {
      const cursorConfig: CursorConfig = {
        mcpServers: [
          {
            name: 'simple-server',
            command: 'echo'
          }
        ]
      };

      const result = translator.translateMCPConfig(cursorConfig);

      expect(result.mcpServers[0]).toEqual({
        name: 'simple-server',
        command: 'echo',
        args: [],
        env: undefined
      });
    });
  });

  describe('Agent Translation', () => {
    it('should translate agents from Cursor to Claude format', () => {
      const cursorConfig: CursorConfig = {
        agents: [
          {
            name: 'Code Helper',
            description: 'Helps with code tasks',
            systemPrompt: 'You are a coding assistant',
            tools: ['read_file', 'write_file']
          },
          {
            name: 'Documentation Writer',
            description: 'Writes documentation',
            systemPrompt: 'You write clear documentation'
          }
        ]
      };

      const result = translator.translateAgents(cursorConfig);

      expect(result.agents).toHaveLength(2);
      expect(result.agents[0]).toEqual({
        name: 'Code Helper',
        description: 'Helps with code tasks',
        systemPrompt: 'You are a coding assistant',
        tools: ['read_file', 'write_file']
      });
      expect(result.agents[1]).toEqual({
        name: 'Documentation Writer',
        description: 'Writes documentation',
        systemPrompt: 'You write clear documentation',
        tools: undefined
      });
    });

    it('should handle empty agents', () => {
      const cursorConfig: CursorConfig = {};
      const result = translator.translateAgents(cursorConfig);
      expect(result.agents).toHaveLength(0);
    });
  });

  describe('Complete Configuration Translation', () => {
    it('should translate complete Cursor config to Claude', () => {
      const cursorConfig: CursorConfig = {
        mcpServers: [
          {
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem']
          }
        ],
        agents: [
          {
            name: 'Helper',
            description: 'A helpful agent',
            systemPrompt: 'Be helpful'
          }
        ],
        cursorRules: {
          rules: ['Always write tests', 'Use TypeScript']
        },
        autoComplete: true,
        tabSize: 2
      };

      const result = translator.translate(cursorConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.mcpServers?.[0].name).toBe('filesystem');
      expect(result.agents?.[0].name).toBe('Helper');
    });

    it('should handle config with only MCP servers', () => {
      const cursorConfig: CursorConfig = {
        mcpServers: [
          { name: 'server1', command: 'cmd1' }
        ]
      };

      const result = translator.translate(cursorConfig);

      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toBeUndefined();
    });

    it('should handle config with only agents', () => {
      const cursorConfig: CursorConfig = {
        agents: [
          { name: 'agent1', description: 'desc' }
        ]
      };

      const result = translator.translate(cursorConfig);

      expect(result.mcpServers).toBeUndefined();
      expect(result.agents).toHaveLength(1);
    });
  });

  describe('CursorRules Conversion', () => {
    it('should convert cursor rules to system prompt', () => {
      const rules = ['Rule 1', 'Rule 2', 'Rule 3'];
      const result = translator.convertCursorRulesToSystemPrompt(rules);

      expect(result).toBe('Rule 1\n\nRule 2\n\nRule 3');
    });

    it('should return undefined for empty rules', () => {
      const result = translator.convertCursorRulesToSystemPrompt([]);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined rules', () => {
      const result = translator.convertCursorRulesToSystemPrompt(undefined as unknown as string[]);
      expect(result).toBeUndefined();
    });
  });
});
