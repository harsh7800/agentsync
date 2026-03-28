# Claude Tool Parser Specification

## Overview

The Claude Tool Parser handles Claude Code's single-file configuration structure. Unlike OpenCode, Claude stores all configuration in a single settings.json file.

## Directory Structure

```
~/.config/claude/
└── settings.json   # Single config file with mcpServers and agents
```

## Files

| File | Purpose |
|------|---------|
| `scanner.ts` | Scans directory and parses settings.json |
| `tool.parser.ts` | Provides interface for scanning |
| `types.ts` | TypeScript interfaces for Claude model |

## Key Interfaces

### ClaudeToolModel

```typescript
interface ClaudeToolModel {
  tool: 'claude';
  rootPath: string;
  mcpServers?: ClaudeMCPServer[];
  agents?: ClaudeAgent[];
  settings?: Record<string, unknown>;
  discovered: {
    agentCount: number;
    mcpServerCount: number;
  };
}
```

### settings.json Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@server/package"],
      "env": {}
    }
  },
  "agents": {
    "agent-name": {
      "name": "Agent Name",
      "description": "Agent description",
      "system_prompt": "You are an agent...",
      "tools": ["filesystem", "git"]
    }
  }
}
```

## Scanner Usage

```typescript
import { ClaudeToolParser } from './tool.parser';

const parser = new ClaudeToolParser();
const result = await parser.scan('/path/to/claude');

// Access the model
result.model.agents      // Array of agents
result.model.mcpServers  // Array of MCP servers
result.model.settings     // Additional settings

// Check for errors
result.errors.config      // Config file errors
result.errors.mcp        // MCP parsing errors
result.errors.agents      // Agent parsing errors
```

## Differences from Directory-Based Tools

| Aspect | Single-File Tools (Claude) | Directory-Based Tools (OpenCode) |
|--------|---------------------------|----------------------------------|
| Config Location | One settings.json | Multiple files |
| Agents | Inline in config | Separate files |
| Skills | N/A | Separate files |
| MCP | Inline | Separate mcp.json |
| Parsing | JSON only | JSON + Markdown |
