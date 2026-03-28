# Tool Path Registry

The Tool Path Registry defines the directory structure for each supported AI tool. This enables AgentSync to locate configuration files regardless of where they are stored on the user's system.

## Overview

Different AI tools store their configuration in different ways:

| Tool | Config Type | Structure |
|------|-------------|-----------|
| **Claude** | Single-file | One `settings.json` with all config |
| **OpenCode** | Directory-based | Multiple files in `agents/`, `skills/` subdirectories |
| **Gemini** | Directory-based | Similar to OpenCode |
| **Cursor** | Single-file | `settings.json` or `.cursorrules` |
| **Copilot** | Single-file | `config.json` |

## Tool Path Registry

The registry is located at `packages/core/src/registry/tool-paths.registry.ts`.

### Key Interfaces

```typescript
type ToolName = 'claude' | 'opencode' | 'gemini' | 'cursor' | 'copilot';

interface ToolDirectoryStructure {
  displayName: string;
  globalRoot: string;      // ~/.config/opencode
  projectRoot: string;     // .opencode
  configFiles: string[];   // Priority order for config files
  agentsDir?: string;      // 'agents' for directory-based tools
  skillsDir?: string;      // 'skills' for directory-based tools
  usesAgentDirectories: boolean;
  usesSkillDirectories: boolean;
}
```

## Supported Tools

### OpenCode (Directory-based)

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

### Claude (Single-file)

```
~/.config/claude/
└── settings.json   # Single config file with mcpServers and agents
```

## Usage

```typescript
import { toolPathRegistry, OpenCodeToolParser, ClaudeToolParser } from '@agentsync/core';

// Check if tool is installed
const isInstalled = await toolPathRegistry.isToolInstalled('opencode');

// Get tool path
const resolved = toolPathRegistry.resolveToolPath('opencode', true);
console.log(resolved.rootPath);  // ~/.config/opencode

// Use tool-specific parser
const parser = new OpenCodeToolParser();
const result = await parser.scan(resolved.rootPath);

// Check tool structure type
if (toolPathRegistry.usesDirectoryStructure('opencode')) {
  // Use directory scanner
} else {
  // Use single-file parser
}
```

## Registry API

### `getStructure(tool: ToolName)`

Returns the directory structure definition for a tool.

### `resolveToolPath(tool: ToolName, preferGlobal: boolean)`

Resolves the actual path for a tool, checking both global and project locations.

### `isToolInstalled(tool: ToolName, checkGlobal: boolean)`

Checks if a tool is detected (exists) at the given path.

### `findConfigFile(tool: ToolName, rootPath: string)`

Finds the actual config file path for a tool.

### `usesDirectoryStructure(tool: ToolName)`

Returns true if the tool uses directory-based structure for agents/skills.

## Adding a New Tool

To add support for a new tool:

1. Add the tool to `TOOL_PATH_REGISTRY` in `tool-paths.registry.ts`
2. Create a new parser directory under `packages/core/src/parsers/{tool}/`
3. Implement `scanner.ts`, `tool.parser.ts`, and `types.ts`
4. Add parser exports to `packages/core/src/parsers/index.ts`
5. Update translators if needed

## Architecture

The registry is part of the core package and is used by:

- **CLI** — To locate config files and display paths
- **Parsers** — To know where to scan for files
- **Translators** — To understand source/target structures
- **Interactive mode** — To show tool-specific prompts

## Integration with Parsers

```
ToolPathRegistry
    │
    ├── resolveToolPath('opencode')
    │       ↓
    └── OpenCodeToolParser.scan(path)
            │
            ├── OpenCodeScanner.scanAgents()
            ├── OpenCodeScanner.scanSkills()
            └── OpenCodeScanner.scanMCPServers()
```
