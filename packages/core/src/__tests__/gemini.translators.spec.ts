import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiToClaudeTranslator } from '../translators/gemini-to-claude.translator.js';
import { GeminiToOpenCodeTranslator } from '../translators/gemini-to-opencode.translator.js';
import type { GeminiConfig } from '../types/gemini.types.js';

describe('S4-20: Gemini CLI Translators', () => {
  describe('GeminiToClaudeTranslator', () => {
    let translator: GeminiToClaudeTranslator;

    beforeEach(() => {
      translator = new GeminiToClaudeTranslator();
    });

    describe('translateMCPConfig', () => {
      it('should translate single MCP server', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: { API_KEY: 'test' }
          }]
        };

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(1);
        expect(result.mcpServers[0]).toEqual({
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { API_KEY: 'test' }
        });
      });

      it('should translate multiple MCP servers', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [
            {
              name: 'filesystem',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-filesystem']
            },
            {
              name: 'terminal',
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-terminal']
            }
          ]
        };

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(2);
        expect(result.mcpServers[0].name).toBe('filesystem');
        expect(result.mcpServers[1].name).toBe('terminal');
      });

      it('should handle empty args array', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'test',
            command: 'test-cmd'
          }]
        };

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers[0].args).toEqual([]);
      });

      it('should return empty array when no MCP servers', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {};

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers).toEqual([]);
      });
    });

    describe('translateAgents', () => {
      it('should translate single agent', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          agents: [{
            name: 'test-agent',
            description: 'A test agent',
            systemPrompt: 'You are helpful',
            model: 'gemini-1.5-pro',
            tools: ['filesystem', 'terminal']
          }]
        };

        // Act
        const result = translator.translateAgents(geminiConfig);

        // Assert
        expect(result.agents).toHaveLength(1);
        expect(result.agents[0]).toEqual({
          name: 'test-agent',
          description: 'A test agent',
          systemPrompt: 'You are helpful',
          tools: ['filesystem', 'terminal']
        });
      });

      it('should translate multiple agents', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          agents: [
            {
              name: 'agent-1',
              description: 'First agent',
              systemPrompt: 'Prompt 1'
            },
            {
              name: 'agent-2',
              description: 'Second agent',
              systemPrompt: 'Prompt 2'
            }
          ]
        };

        // Act
        const result = translator.translateAgents(geminiConfig);

        // Assert
        expect(result.agents).toHaveLength(2);
        expect(result.agents[0].name).toBe('agent-1');
        expect(result.agents[1].name).toBe('agent-2');
      });

      it('should handle optional fields being undefined', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          agents: [{
            name: 'minimal-agent',
            description: 'Minimal agent'
          }]
        };

        // Act
        const result = translator.translateAgents(geminiConfig);

        // Assert
        expect(result.agents[0]).toEqual({
          name: 'minimal-agent',
          description: 'Minimal agent',
          systemPrompt: undefined,
          tools: undefined
        });
      });
    });

    describe('translate', () => {
      it('should translate complete configuration', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem']
          }],
          agents: [{
            name: 'test-agent',
            description: 'Test agent'
          }],
          defaultModel: 'gemini-1.5-pro'
        };

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(1);
        expect(result.agents).toHaveLength(1);
        expect(result.mcpServers![0].name).toBe('filesystem');
        expect(result.agents![0].name).toBe('test-agent');
      });

      it('should translate only MCP servers', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'test',
            command: 'test'
          }]
        };

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result.mcpServers).toBeDefined();
        expect(result.agents).toBeUndefined();
      });

      it('should translate only agents', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          agents: [{
            name: 'test',
            description: 'Test'
          }]
        };

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result.mcpServers).toBeUndefined();
        expect(result.agents).toBeDefined();
      });

      it('should handle empty configuration', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {};

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result).toEqual({});
      });
    });
  });

  describe('GeminiToOpenCodeTranslator', () => {
    let translator: GeminiToOpenCodeTranslator;

    beforeEach(() => {
      translator = new GeminiToOpenCodeTranslator();
    });

    describe('translateMCPConfig', () => {
      it('should translate MCP servers to OpenCode format', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: { KEY: 'value' }
          }]
        };

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(1);
        expect(result.mcpServers[0]).toEqual({
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { KEY: 'value' }
        });
      });

      it('should handle multiple MCP servers', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [
            { name: 'server1', command: 'cmd1' },
            { name: 'server2', command: 'cmd2' }
          ]
        };

        // Act
        const result = translator.translateMCPConfig(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(2);
      });
    });

    describe('translateAgents', () => {
      it('should translate agents to OpenCode format', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          agents: [{
            name: 'test-agent',
            description: 'Test agent',
            systemPrompt: 'You are helpful',
            tools: ['tool1', 'tool2']
          }]
        };

        // Act
        const result = translator.translateAgents(geminiConfig);

        // Assert
        expect(result.agents).toHaveLength(1);
        expect(result.agents[0]).toEqual({
          name: 'test-agent',
          description: 'Test agent',
          systemPrompt: 'You are helpful',
          tools: ['tool1', 'tool2']
        });
      });
    });

    describe('translate', () => {
      it('should translate complete configuration', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          mcpServers: [{
            name: 'test-server',
            command: 'test-cmd'
          }],
          agents: [{
            name: 'test-agent',
            description: 'Test'
          }],
          defaultModel: 'gemini-1.5-pro'
        };

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result.mcpServers).toHaveLength(1);
        expect(result.agents).toHaveLength(1);
        // Note: defaultModel is not translated to OpenCode (not supported)
        expect(result.defaultModel).toBeUndefined();
      });

      it('should handle configuration with only default model', () => {
        // Arrange
        const geminiConfig: GeminiConfig = {
          defaultModel: 'gemini-1.5-pro'
        };

        // Act
        const result = translator.translate(geminiConfig);

        // Assert
        expect(result).toEqual({});
      });
    });
  });
});
