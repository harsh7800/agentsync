import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiParser } from '../parsers/gemini.parser.js';
import type { GeminiConfig, GeminiMCPConfigInput, GeminiAgentsConfigInput } from '../types/gemini.types.js';

describe('S4-19: Gemini Parser', () => {
  let parser: GeminiParser;

  beforeEach(() => {
    parser = new GeminiParser();
  });

  describe('parseMCPConfig', () => {
    it('should parse valid MCP server configuration', () => {
      // Arrange
      const input: GeminiMCPConfigInput = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: { API_KEY: 'test-key' }
          }
        }
      };

      // Act
      const result = parser.parseMCPConfig(input);

      // Assert
      expect(result.mcpServers).toHaveLength(1);
      expect(result.mcpServers![0]).toEqual({
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { API_KEY: 'test-key' }
      });
    });

    it('should parse multiple MCP servers', () => {
      // Arrange
      const input: GeminiMCPConfigInput = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem']
          },
          terminal: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-terminal']
          }
        }
      };

      // Act
      const result = parser.parseMCPConfig(input);

      // Assert
      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers![0].name).toBe('filesystem');
      expect(result.mcpServers![1].name).toBe('terminal');
    });

    it('should throw error for MCP server missing command', () => {
      // Arrange
      const input: GeminiMCPConfigInput = {
        mcpServers: {
          invalid: {
            command: '',
            args: []
          }
        }
      };

      // Act & Assert
      expect(() => parser.parseMCPConfig(input)).toThrow('MCP server "invalid" is missing required field: command');
    });

    it('should handle empty args array', () => {
      // Arrange
      const input: GeminiMCPConfigInput = {
        mcpServers: {
          test: {
            command: 'test-command'
          }
        }
      };

      // Act
      const result = parser.parseMCPConfig(input);

      // Assert
      expect(result.mcpServers![0].args).toEqual([]);
    });

    it('should return empty mcpServers when input is empty', () => {
      // Arrange
      const input: GeminiMCPConfigInput = {
        mcpServers: {}
      };

      // Act
      const result = parser.parseMCPConfig(input);

      // Assert
      expect(result.mcpServers).toEqual([]);
    });
  });

  describe('parseAgents', () => {
    it('should parse valid agent configuration', () => {
      // Arrange
      const input: GeminiAgentsConfigInput = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'A test agent',
            system_prompt: 'You are a test agent',
            model: 'gemini-1.5-pro',
            tools: ['filesystem', 'terminal']
          }
        }
      };

      // Act
      const result = parser.parseAgents(input);

      // Assert
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0]).toEqual({
        name: 'Test Agent',
        description: 'A test agent',
        systemPrompt: 'You are a test agent',
        model: 'gemini-1.5-pro',
        tools: ['filesystem', 'terminal']
      });
    });

    it('should use key as name when name field is missing', () => {
      // Arrange
      const input: GeminiAgentsConfigInput = {
        agents: {
          'default-agent': {
            description: 'Default agent'
          }
        }
      };

      // Act
      const result = parser.parseAgents(input);

      // Assert
      expect(result.agents[0].name).toBe('default-agent');
    });

    it('should parse multiple agents', () => {
      // Arrange
      const input: GeminiAgentsConfigInput = {
        agents: {
          'agent-1': { description: 'First agent' },
          'agent-2': { description: 'Second agent' }
        }
      };

      // Act
      const result = parser.parseAgents(input);

      // Assert
      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].name).toBe('agent-1');
      expect(result.agents[1].name).toBe('agent-2');
    });

    it('should handle optional fields being undefined', () => {
      // Arrange
      const input: GeminiAgentsConfigInput = {
        agents: {
          'minimal-agent': {
            description: 'Minimal agent'
          }
        }
      };

      // Act
      const result = parser.parseAgents(input);

      // Assert
      expect(result.agents[0]).toEqual({
        name: 'minimal-agent',
        description: 'Minimal agent',
        systemPrompt: undefined,
        model: undefined,
        tools: undefined
      });
    });
  });

  describe('parseConfig', () => {
    it('should parse complete configuration', () => {
      // Arrange
      const input = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem']
          }
        },
        agents: {
          'my-agent': {
            description: 'My agent',
            system_prompt: 'You are helpful'
          }
        },
        defaultModel: 'gemini-1.5-pro'
      };

      // Act
      const result = parser.parseConfig(input);

      // Assert
      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.defaultModel).toBe('gemini-1.5-pro');
    });

    it('should parse config with only MCP servers', () => {
      // Arrange
      const input = {
        mcpServers: {
          test: { command: 'test' }
        }
      };

      // Act
      const result = parser.parseConfig(input);

      // Assert
      expect(result.mcpServers).toBeDefined();
      expect(result.agents).toBeUndefined();
      expect(result.defaultModel).toBeUndefined();
    });

    it('should parse config with only agents', () => {
      // Arrange
      const input = {
        agents: {
          test: { description: 'Test' }
        }
      };

      // Act
      const result = parser.parseConfig(input);

      // Assert
      expect(result.mcpServers).toBeUndefined();
      expect(result.agents).toBeDefined();
    });

    it('should throw error for invalid input (null)', () => {
      // Act & Assert
      expect(() => parser.parseConfig(null)).toThrow('Invalid Gemini configuration: expected object');
    });

    it('should throw error for invalid input (string)', () => {
      // Act & Assert
      expect(() => parser.parseConfig('invalid')).toThrow('Invalid Gemini configuration: expected object');
    });

    it('should throw error for invalid input (number)', () => {
      // Act & Assert
      expect(() => parser.parseConfig(123)).toThrow('Invalid Gemini configuration: expected object');
    });

    it('should parse empty object', () => {
      // Arrange
      const input = {};

      // Act
      const result = parser.parseConfig(input);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config with MCP servers', () => {
      // Arrange
      const config: GeminiConfig = {
        mcpServers: [{
          name: 'test',
          command: 'test'
        }]
      };

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for valid config with agents', () => {
      // Arrange
      const config: GeminiConfig = {
        agents: [{
          name: 'test',
          description: 'Test agent'
        }]
      };

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for null config', () => {
      // Act
      const result = parser.validateConfig(null as unknown as GeminiConfig);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined config', () => {
      // Act
      const result = parser.validateConfig(undefined as unknown as GeminiConfig);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when mcpServers is not an array', () => {
      // Arrange
      const config = {
        mcpServers: 'invalid'
      } as unknown as GeminiConfig;

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when agent has no name', () => {
      // Arrange
      const config = {
        agents: [{
          description: 'Test'
        }]
      } as unknown as GeminiConfig;

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when agent has no description', () => {
      // Arrange
      const config = {
        agents: [{
          name: 'Test'
        }]
      } as unknown as GeminiConfig;

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when agents is not an array', () => {
      // Arrange
      const config = {
        agents: 'invalid'
      } as unknown as GeminiConfig;

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('serializeConfig', () => {
    it('should serialize config with MCP servers', () => {
      // Arrange
      const config: GeminiConfig = {
        mcpServers: [{
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          env: { KEY: 'value' }
        }]
      };

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed.mcpServers).toBeDefined();
      expect(parsed.mcpServers.filesystem).toEqual({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { KEY: 'value' }
      });
    });

    it('should serialize config with agents', () => {
      // Arrange
      const config: GeminiConfig = {
        agents: [{
          name: 'test-agent',
          description: 'Test agent',
          systemPrompt: 'You are helpful',
          model: 'gemini-1.5-pro',
          tools: ['filesystem']
        }]
      };

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed.agents).toBeDefined();
      expect(parsed.agents['test-agent']).toEqual({
        description: 'Test agent',
        system_prompt: 'You are helpful',
        model: 'gemini-1.5-pro',
        tools: ['filesystem']
      });
    });

    it('should serialize complete config', () => {
      // Arrange
      const config: GeminiConfig = {
        mcpServers: [{
          name: 'test',
          command: 'test'
        }],
        agents: [{
          name: 'agent',
          description: 'Agent'
        }],
        defaultModel: 'gemini-1.5-pro'
      };

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed.mcpServers).toBeDefined();
      expect(parsed.agents).toBeDefined();
      expect(parsed.defaultModel).toBe('gemini-1.5-pro');
    });

    it('should serialize empty config', () => {
      // Arrange
      const config: GeminiConfig = {};

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      expect(result).toBe('{}');
    });

    it('should serialize config with defaultModel only', () => {
      // Arrange
      const config: GeminiConfig = {
        defaultModel: 'gemini-1.5-pro'
      };

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ defaultModel: 'gemini-1.5-pro' });
    });
  });
});
