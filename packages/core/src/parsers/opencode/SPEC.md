# OpenCode Tool Parser Specification

## Overview

The OpenCode Tool Parser handles OpenCode's multi-file, directory-based configuration structure. OpenCode stores configuration across multiple files and directories, unlike tools that use a single config file.

## Directory Structure

```
~/.config/opencode/
├── config.json      # General settings
├── mcp.json         # MCP server configurations
├── opencode.json    # OpenCode-specific settings
├── skills/          # Skills directory
│   ├── git-commit/
│   │   └── skill.md
│   └── code-review/
│       └── skill.md
└── agents/          # Agents directory
    ├── onboarding/
    │   └── agent.md
    └── refactoring/
        └── agent.md
```

## Files

| File | Purpose |
|------|---------|
| `scanner.ts` | Main scanner that orchestrates directory scanning |
| `tool.parser.ts` | Coordinates scanning and provides interface |
| `types.ts` | TypeScript interfaces for OpenCode model |
| `parsers/agent.parser.ts` | Parses agent.md files |
| `parsers/skill.parser.ts` | Parses skill.md files |
| `parsers/mcp.parser.ts` | Parses mcp.json |
| `parsers/config.parser.ts` | Parses settings files |

## Key Interfaces

### OpenCodeToolModel

```typescript
interface OpenCodeToolModel {
  tool: 'opencode';
  rootPath: string;
  mcpServers?: OpenCodeMCPServer[];
  agents?: OpenCodeAgent[];
  skills?: OpenCodeSkill[];
  settings?: OpenCodeSettings;
  discovered: {
    agentCount: number;
    skillCount: number;
    mcpServerCount: number;
  };
}
```

### Agent.md Format

```markdown
---
description: Agent description
system_prompt: You are an agent...
tools:
  - filesystem
  - git
---

# Agent Name

Agent content...
```

### Skill.md Format

```markdown
---
description: Skill description
enabled: true
---

# Skill Name

Skill content...
```

## Scanner Usage

```typescript
import { OpenCodeToolParser } from './tool.parser';

const parser = new OpenCodeToolParser();
const result = await parser.scan('/path/to/opencode');

// Access the model
result.model.agents    // Array of agents
result.model.skills    // Array of skills
result.model.mcpServers // Array of MCP servers
result.model.settings   // General settings

// Check for errors
result.errors.agents   // Agent parsing errors
result.errors.skills    // Skill parsing errors
```

## Integration with Registry

The scanner is used with the Tool Path Registry to locate the OpenCode directory:

```typescript
import { toolPathRegistry } from '../../registry';
import { OpenCodeToolParser } from './tool.parser';

const isInstalled = await toolPathRegistry.isToolInstalled('opencode');
const resolvedPath = toolPathRegistry.resolveToolPath('opencode');
const parser = new OpenCodeToolParser();
const result = await parser.scan(resolvedPath.rootPath);
```

## Differences from Single-File Tools

| Aspect | Single-File Tools (Claude) | Multi-File Tools (OpenCode) |
|--------|---------------------------|----------------------------|
| Config Location | One settings.json | Multiple files |
| Agents | Inline in config | Separate files |
| Skills | N/A | Separate files |
| MCP | Inline | Separate mcp.json |
| Parsing | JSON only | JSON + Markdown |

## Future Enhancements

- Support for agent configurations in YAML format
- Support for skill dependencies
- Support for agent skill assignments
- Validation against OpenCode schema
