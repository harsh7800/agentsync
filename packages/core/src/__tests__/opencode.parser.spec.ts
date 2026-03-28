import { describe, it, expect, beforeEach } from 'vitest';
import { OpenCodeParser } from '../parsers/opencode.parser';
import type { OpenCodeConfig } from '../types/opencode.types';

describe('OpenCodeParser', () => {
  let parser: OpenCodeParser;

  beforeEach(() => {
    parser = new OpenCodeParser();
  });

  describe('parseMCPConfig', () => {
    it('should parse valid OpenCode MCP configuration', () => {
      const input = {
        mcp: {
          'filesystem': {
            type: 'local',
            command: ['npx', '-y', '@modelcontextprotocol/server-filesystem', '/path/to/files'],
            environment: {
              API_KEY: 'test-key-123'
            }
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result).toBeDefined();
      expect(result.mcpServers).toHaveLength(1);
      expect(result.mcpServers[0].name).toBe('filesystem');
      expect(result.mcpServers[0].command).toBe('npx');
      expect(result.mcpServers[0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files']);
      expect(result.mcpServers[0].env).toEqual({ API_KEY: 'test-key-123' });
    });

    it('should handle multiple MCP servers', () => {
      const input = {
        mcp: {
          'github': {
            type: 'local',
            command: ['npx', '-y', '@modelcontextprotocol/server-github'],
            environment: { GITHUB_TOKEN: 'ghp_xxx' }
          },
          'postgres': {
            type: 'local',
            command: ['docker', 'run', 'postgres-mcp'],
            environment: { DB_URL: 'postgresql://localhost' }
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers[0].name).toBe('github');
      expect(result.mcpServers[1].name).toBe('postgres');
    });

    it('should handle invalid MCP config gracefully', () => {
      const input = {
        mcp: {
          'invalid-server': {
            // Missing required 'command' field
            args: ['test']
          }
        }
      };

      // Should not throw, just skip the invalid server
      const result = parser.parseMCPConfig(input);
      expect(result.mcpServers).toHaveLength(0);
    });

    it('should handle empty MCP config', () => {
      const input = { mcp: {} };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers).toEqual([]);
    });

    it('should parse server with no environment variables', () => {
      const input = {
        mcp: {
          'simple-server': {
            type: 'local',
            command: ['python', 'server.py']
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers[0].env).toBeUndefined();
    });
  });

  describe('parseAgents', () => {
    it('should parse OpenCode agents configuration', () => {
      const input = {
        agents: {
          'code-reviewer': {
            description: 'Reviews code for best practices',
            system_prompt: 'You are a code reviewer. Review the code for best practices.',
            tools: ['github', 'filesystem']
          },
          'test-writer': {
            description: 'Writes unit tests',
            system_prompt: 'You are a test writer. Write comprehensive unit tests.',
            tools: ['filesystem']
          }
        }
      };

      const result = parser.parseAgents(input);

      expect(result).toBeDefined();
      expect(result.agents).toHaveLength(2);
      expect(result.agents[0].name).toBe('code-reviewer');
      expect(result.agents[0].description).toBe('Reviews code for best practices');
      expect(result.agents[0].systemPrompt).toBe('You are a code reviewer. Review the code for best practices.');
      expect(result.agents[0].tools).toEqual(['github', 'filesystem']);
      expect(result.agents[1].name).toBe('test-writer');
    });

    it('should handle empty agents config', () => {
      const input = { agents: {} };

      const result = parser.parseAgents(input);

      expect(result.agents).toEqual([]);
    });

    it('should parse agent with optional fields missing', () => {
      const input = {
        agents: {
          'minimal-agent': {
            description: 'A minimal agent'
            // Missing system_prompt and tools
          }
        }
      };

      const result = parser.parseAgents(input);

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('minimal-agent');
      expect(result.agents[0].description).toBe('A minimal agent');
      expect(result.agents[0].systemPrompt).toBeUndefined();
      expect(result.agents[0].tools).toBeUndefined();
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid MCP config', () => {
      const config: OpenCodeConfig = {
        mcpServers: [{
          name: 'test',
          command: 'npx',
          args: ['test']
        }]
      };

      expect(parser.validateConfig(config)).toBe(true);
    });

    it('should return true for valid agents config', () => {
      const config: OpenCodeConfig = {
        agents: [{
          name: 'test-agent',
          description: 'Test agent'
        }]
      };

      expect(parser.validateConfig(config)).toBe(true);
    });

    it('should return false for invalid config', () => {
      const config = {
        mcpServers: [{
          name: 'test',
          command: '',  // Empty command is invalid
          args: ['test']
        }]
      };

      expect(parser.validateConfig(config)).toBe(false);
    });

    it('should return false for empty config', () => {
      expect(parser.validateConfig({})).toBe(false);
    });
  });
});