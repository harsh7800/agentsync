import { describe, it, expect, beforeEach } from 'vitest';
import { CursorParser } from '../parsers/cursor.parser.js';
import type { CursorConfig, CursorMCPConfigInput, CursorAgentsConfigInput } from '../types/cursor.types.js';

describe('S4-21: Cursor Parser', () => {
  let parser: CursorParser;

  beforeEach(() => {
    parser = new CursorParser();
  });

  describe('parseMCPConfig', () => {
    it('should parse valid MCP server configuration', () => {
      // Arrange
      const input: CursorMCPConfigInput = {
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
      const input: CursorMCPConfigInput = {
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
      const input: CursorMCPConfigInput = {
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
      const input: CursorMCPConfigInput = {
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
      const input: CursorMCPConfigInput = {
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
      const input: CursorAgentsConfigInput = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'A test agent',
            system_prompt: 'You are a test agent',
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
        tools: ['filesystem', 'terminal']
      });
    });

    it('should use key as name when name field is missing', () => {
      // Arrange
      const input: CursorAgentsConfigInput = {
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
      const input: CursorAgentsConfigInput = {
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
      const input: CursorAgentsConfigInput = {
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
        tools: undefined
      });
    });
  });

  describe('parseCursorRules', () => {
    it('should parse .cursorrules file content', () => {
      // Arrange
      const content = `Always use TypeScript
Use explicit types
Prefer async/await`;

      // Act
      const result = parser.parseCursorRules(content);

      // Assert
      expect(result.rules).toHaveLength(3);
      expect(result.rules[0]).toBe('Always use TypeScript');
      expect(result.rules[1]).toBe('Use explicit types');
      expect(result.rules[2]).toBe('Prefer async/await');
    });

    it('should skip empty lines', () => {
      // Arrange
      const content = `Rule 1

Rule 2

Rule 3`;

      // Act
      const result = parser.parseCursorRules(content);

      // Assert
      expect(result.rules).toHaveLength(3);
    });

    it('should skip comment lines starting with #', () => {
      // Arrange
      const content = `# This is a comment
Rule 1
# Another comment
Rule 2`;

      // Act
      const result = parser.parseCursorRules(content);

      // Assert
      expect(result.rules).toHaveLength(2);
      expect(result.rules).not.toContain('# This is a comment');
    });

    it('should trim whitespace from rules', () => {
      // Arrange
      const content = `  Rule 1  
  Rule 2  `;

      // Act
      const result = parser.parseCursorRules(content);

      // Assert
      expect(result.rules[0]).toBe('Rule 1');
      expect(result.rules[1]).toBe('Rule 2');
    });

    it('should handle empty content', () => {
      // Arrange
      const content = '';

      // Act
      const result = parser.parseCursorRules(content);

      // Assert
      expect(result.rules).toEqual([]);
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
        cursorRules: {
          rules: ['Rule 1', 'Rule 2']
        },
        autoComplete: true,
        tabSize: 2
      };

      // Act
      const result = parser.parseConfig(input);

      // Assert
      expect(result.mcpServers).toHaveLength(1);
      expect(result.agents).toHaveLength(1);
      expect(result.cursorRules).toEqual({ rules: ['Rule 1', 'Rule 2'] });
      expect(result.autoComplete).toBe(true);
      expect(result.tabSize).toBe(2);
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
      expect(result.cursorRules).toBeUndefined();
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
      expect(result.autoComplete).toBeUndefined();
    });

    it('should throw error for invalid input (null)', () => {
      // Act & Assert
      expect(() => parser.parseConfig(null)).toThrow('Invalid Cursor configuration: expected object');
    });

    it('should throw error for invalid input (string)', () => {
      // Act & Assert
      expect(() => parser.parseConfig('invalid')).toThrow('Invalid Cursor configuration: expected object');
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
      const config: CursorConfig = {
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
      const config: CursorConfig = {
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
      const result = parser.validateConfig(null as unknown as CursorConfig);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when mcpServers is not an array', () => {
      // Arrange
      const config = {
        mcpServers: 'invalid'
      } as unknown as CursorConfig;

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
      } as unknown as CursorConfig;

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
      } as unknown as CursorConfig;

      // Act
      const result = parser.validateConfig(config);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('serializeConfig', () => {
    it('should serialize config with MCP servers', () => {
      // Arrange
      const config: CursorConfig = {
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
      const config: CursorConfig = {
        agents: [{
          name: 'test-agent',
          description: 'Test agent',
          systemPrompt: 'You are helpful',
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
        tools: ['filesystem']
      });
    });

    it('should serialize complete config', () => {
      // Arrange
      const config: CursorConfig = {
        mcpServers: [{
          name: 'test',
          command: 'test'
        }],
        agents: [{
          name: 'agent',
          description: 'Agent'
        }],
        autoComplete: true,
        tabSize: 2
      };

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      const parsed = JSON.parse(result);
      expect(parsed.mcpServers).toBeDefined();
      expect(parsed.agents).toBeDefined();
      expect(parsed.autoComplete).toBe(true);
      expect(parsed.tabSize).toBe(2);
    });

    it('should serialize empty config', () => {
      // Arrange
      const config: CursorConfig = {};

      // Act
      const result = parser.serializeConfig(config);

      // Assert
      expect(result).toBe('{}');
    });
  });

  describe('serializeCursorRules', () => {
    it('should serialize rules to .cursorrules format', () => {
      // Arrange
      const rules = {
        rules: ['Rule 1', 'Rule 2', 'Rule 3']
      };

      // Act
      const result = parser.serializeCursorRules(rules);

      // Assert
      expect(result).toBe('Rule 1\nRule 2\nRule 3');
    });

    it('should handle single rule', () => {
      // Arrange
      const rules = {
        rules: ['Single rule']
      };

      // Act
      const result = parser.serializeCursorRules(rules);

      // Assert
      expect(result).toBe('Single rule');
    });

    it('should handle empty rules', () => {
      // Arrange
      const rules = {
        rules: []
      };

      // Act
      const result = parser.serializeCursorRules(rules);

      // Assert
      expect(result).toBe('');
    });
  });
});
