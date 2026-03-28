# Test Fixtures

This directory contains sample configuration files for testing the AgentSync CLI migration functionality.

## Files

### Claude Code Configurations

- **claude-config.json** - Full Claude Code configuration with MCP servers, agents, and context
- **claude-mcp-only.json** - Minimal configuration with only MCP servers

### OpenCode Configurations

- **opencode-full.json** - Full OpenCode configuration with MCP servers and agents
- **opencode-agents.json** - Configuration with only agents (no MCP servers)

## Usage

These fixtures are used in:
- Unit tests for parsers
- Integration tests for migration
- E2E tests for complete migration flows
- Documentation examples

## Structure

### Claude Code Format
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name", "...args"],
      "env": { "API_KEY": "..." }
    }
  },
  "agents": {
    "agent-name": {
      "name": "Display Name",
      "description": "Agent description",
      "system_prompt": "Instructions for the agent...",
      "tools": ["tool1", "tool2"]
    }
  },
  "context": {
    "include": ["files..."],
    "exclude": ["patterns..."]
  }
}
```

### OpenCode Format
```json
{
  "mcpServers": {
    "server-name": {
      "command": "uvx",
      "args": ["package-name", "...args"],
      "env": {}
    }
  },
  "agents": {
    "agent-name": {
      "description": "Agent description",
      "system_prompt": "Instructions for the agent...",
      "tools": ["tool1", "tool2"]
    }
  }
}
```

## Notes

- All API keys in these fixtures are fake/dummy values
- Real configurations should never be committed to version control
- Use these fixtures as templates for your own configurations