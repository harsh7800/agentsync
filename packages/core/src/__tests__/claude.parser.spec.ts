import { describe, it, expect } from 'vitest';
import { ClaudeParser } from '../parsers/claude.parser';
import type { ClaudeConfig } from '../types/claude.types';

describe('ClaudeParser', () => {
  let parser: ClaudeParser;

  beforeEach(() => {
    parser = new ClaudeParser();
  });

  describe('parseMCPConfig', () => {
    it('should parse valid Claude MCP configuration', () => {
      const input = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files'],
            env: {
              API_KEY: 'test-key-123'
            }
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result).toBeDefined();
      expect(result.mcpServers).toHaveLength(1);
      expect(result.mcpServers[0].name).toBe('test-server');
      expect(result.mcpServers[0].command).toBe('npx');
      expect(result.mcpServers[0].args).toEqual(['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files']);
      expect(result.mcpServers[0].env).toEqual({ API_KEY: 'test-key-123' });
    });

    it('should handle multiple MCP servers', () => {
      const input = {
        mcpServers: {
          'filesystem': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user']
          },
          'github': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'ghp_xxx' }
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers).toHaveLength(2);
      expect(result.mcpServers[0].name).toBe('filesystem');
      expect(result.mcpServers[1].name).toBe('github');
    });

    it('should throw error for invalid MCP config', () => {
      const input = {
        mcpServers: {
          'invalid-server': {
            // Missing required 'command' field
            args: ['test']
          }
        }
      };

      expect(() => parser.parseMCPConfig(input)).toThrow();
    });

    it('should handle empty MCP config', () => {
      const input = { mcpServers: {} };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers).toEqual([]);
    });

    it('should parse server with no environment variables', () => {
      const input = {
        mcpServers: {
          'simple-server': {
            command: 'python',
            args: ['server.py']
          }
        }
      };

      const result = parser.parseMCPConfig(input);

      expect(result.mcpServers[0].env).toBeUndefined();
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config', () => {
      const config: ClaudeConfig = {
        mcpServers: [{
          name: 'test',
          command: 'npx',
          args: ['test']
        }]
      };

      expect(parser.validateConfig(config)).toBe(true);
    });

    it('should return false for invalid config', () => {
      const config = {
        mcpServers: [{
          name: 'test',
          // Missing command
          args: ['test']
        }]
      };

      expect(parser.validateConfig(config)).toBe(false);
    });
  });
});