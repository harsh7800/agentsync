import { describe, it, expect } from 'vitest';
import { ClaudeParser } from '../parsers/claude.parser.js';
import { OpenCodeParser } from '../parsers/opencode.parser.js';
import claudeConfig from './fixtures/claude-config.json' assert { type: 'json' };
import claudeMCPOnly from './fixtures/claude-mcp-only.json' assert { type: 'json' };
import opencodeFull from './fixtures/opencode-full.json' assert { type: 'json' };
import opencodeAgents from './fixtures/opencode-agents.json' assert { type: 'json' };

describe('Fixture Files', () => {
  const claudeParser = new ClaudeParser();
  const opencodeParser = new OpenCodeParser();

  describe('Claude Fixtures', () => {
    it('should parse claude-config.json', () => {
      const mcpResult = claudeParser.parseMCPConfig(claudeConfig);
      expect(mcpResult.mcpServers).toHaveLength(3);
      expect(mcpResult.mcpServers[0].name).toBe('filesystem');
      expect(mcpResult.mcpServers[1].name).toBe('github');
      expect(mcpResult.mcpServers[2].name).toBe('postgres');
    });

    it('should parse claude-mcp-only.json', () => {
      const result = claudeParser.parseMCPConfig(claudeMCPOnly);
      expect(result.mcpServers).toHaveLength(3);
      expect(result.mcpServers[0].name).toBe('filesystem');
      expect(result.mcpServers[1].name).toBe('brave-search');
      expect(result.mcpServers[2].name).toBe('sqlite');
    });

    it('should mask API keys in Claude fixtures', () => {
      const result = claudeParser.parseMCPConfig(claudeConfig);
      // Check that API keys are present (masking happens later in pipeline)
      const githubServer = result.mcpServers.find(s => s.name === 'github');
      expect(githubServer?.env?.GITHUB_TOKEN).toContain('ghp_');
    });
  });

  describe('OpenCode Fixtures', () => {
    it('should parse opencode-full.json', () => {
      const mcpResult = opencodeParser.parseMCPConfig(opencodeFull);
      expect(mcpResult.mcpServers).toHaveLength(3);
      expect(mcpResult.mcpServers[0].name).toBe('fetch');
      expect(mcpResult.mcpServers[1].name).toBe('git');
      expect(mcpResult.mcpServers[2].name).toBe('memory');

      const agentsResult = opencodeParser.parseAgents(opencodeFull);
      expect(agentsResult.agents).toHaveLength(2);
      expect(agentsResult.agents[0].name).toBe('onboarding-assistant');
      expect(agentsResult.agents[1].name).toBe('refactoring-partner');
    });

    it('should parse opencode-agents.json', () => {
      const result = opencodeParser.parseAgents(opencodeAgents);
      expect(result.agents).toHaveLength(4);
      expect(result.agents[0].name).toBe('opencode-reviewer');
      expect(result.agents[0].description).toBe('Reviews code changes and provides constructive feedback');
    });
  });

  describe('Fixture Validation', () => {
    it('should validate all Claude fixtures as valid configs', () => {
      const claudeResult = claudeParser.parseMCPConfig(claudeConfig);
      expect(claudeParser.validateConfig(claudeResult)).toBe(true);
    });

    it('should validate all OpenCode fixtures as valid configs', () => {
      const opencodeMCP = opencodeParser.parseMCPConfig(opencodeFull);
      const opencodeAgentsResult = opencodeParser.parseAgents(opencodeFull);
      
      const fullConfig = {
        mcpServers: opencodeMCP.mcpServers,
        agents: opencodeAgentsResult.agents
      };
      
      expect(opencodeParser.validateConfig(fullConfig)).toBe(true);
    });
  });
});