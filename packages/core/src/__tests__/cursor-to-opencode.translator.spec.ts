/**
 * Tests for Cursor to OpenCode Translator
 */

import { describe, it, expect } from 'vitest';
import { CursorToOpenCodeTranslator } from '../translators/cursor-to-opencode.translator.js';
import type { CursorConfig } from '../types/cursor.types.js';

describe('CursorToOpenCodeTranslator', () => {
  const translator = new CursorToOpenCodeTranslator();

  describe('MCP Configuration Translation', () => {
    it('should translate MCP servers from Cursor to OpenCode format', () => {
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
        type: 'local',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { NODE_ENV: 'production' }
      });
      expect(result.mcpServers[1]).toEqual({
        name: 'git',
        type: 'local',
        command: 'uvx',
        args: ['mcp-server-git']
      });
    });

    it('should set type to local for all MCP servers', () => {
      const cursorConfig: CursorConfig = {
        mcpServers: [
          { name: 'server1', command: 'cmd1' }
        ]
      };

      const result = translator.translateMCPConfig(cursorConfig);

      expect(result.mcpServers[0].type).toBe('local');
    });

    it('should handle empty MCP servers', () => {
      const cursorConfig: CursorConfig = {};
      const result = translator.translateMCPConfig(cursorConfig);
      expect(result.mcpServers).toHaveLength(0);
    });
  });

  describe('Agent Translation', () => {
    it('should translate agents from Cursor to OpenCode format', () => {
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
    it('should translate complete Cursor config to OpenCode', () => {
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
      expect(result.mcpServers?.[0].type).toBe('local');
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

  describe('CursorRules to Agent Conversion', () => {
    it('should convert cursor rules to OpenCode agent', () => {
      const rules = ['Always use TypeScript', 'Write tests for all code'];
      const result = translator.convertCursorRulesToAgent('my-rules', rules);

      expect(result.name).toBe('my-rules');
      expect(result.description).toBe('Cursor IDE rules converted to OpenCode agent');
      expect(result.systemPrompt).toBe('Always use TypeScript\n\nWrite tests for all code');
    });

    it('should use default name when not provided', () => {
      const rules = ['Rule 1'];
      const result = translator.convertCursorRulesToAgent('', rules);

      expect(result.name).toBe('cursor-rules');
    });

    it('should handle single rule', () => {
      const rules = ['Only one rule'];
      const result = translator.convertCursorRulesToAgent('single', rules);

      expect(result.systemPrompt).toBe('Only one rule');
    });
  });
});
