# Adding New Tool — AgentSync CLI

## Overview

Adding a new tool to AgentSync requires creating a tool-specific parser that handles that tool's configuration structure. This guide covers adding support for a new AI tool.

## Two Types of Tools

### Single-File Tools
Tools that store all configuration in one file (e.g., `settings.json`).

**Example**: Claude Code
```
~/.config/claude/settings.json
{
  "mcpServers": { ... },
  "agents": { ... }
}
```

### Directory-Based Tools
Tools that store configuration across multiple files and directories.

**Example**: OpenCode
```
~/.config/opencode/
├── config.json
├── mcp.json
├── agents/
│   ├── agent-name/agent.md
│   └── ...
└── skills/
    ├── skill-name/skill.md
    └── ...
```

---

## Steps to Add New Tool

### Step 1: Register Tool in Path Registry

Edit `packages/core/src/registry/tool-paths.registry.ts`:

```typescript
export const TOOL_PATH_REGISTRY: Record<ToolName, ToolDirectoryStructure> = {
  // ... existing tools ...
  newtool: {
    displayName: 'NewTool',
    globalRoot: path.join(os.homedir(), '.config', 'newtool'),
    projectRoot: '.newtool',
    configFiles: ['config.json', 'settings.json'],
    agentsDir: 'agents',           // if directory-based
    skillsDir: 'skills',         // if directory-based
    agentFileName: 'agent.md',     // if directory-based
    skillFileName: 'skill.md',     // if directory-based
    usesAgentDirectories: true,    // or false for single-file
    usesSkillDirectories: true
  }
};
```

### Step 2: Create Parser Directory

Create a new directory under `packages/core/src/parsers/`:

```
packages/core/src/parsers/newtool/
├── scanner.ts         # Scans tool's directory structure
├── tool.parser.ts    # Main parser interface
├── types.ts         # Tool-specific type definitions
├── SPEC.md          # Documentation
└── parsers/         # (if directory-based)
    ├── agent.parser.ts
    ├── skill.parser.ts
    ├── mcp.parser.ts
    └── config.parser.ts
```

### Step 3: Implement Types

Create `types.ts`:

```typescript
import type { ToolName } from '../../registry/tool-paths.registry.js';

export interface NewToolMCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface NewToolAgent {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
}

export interface NewToolToolModel {
  tool: ToolName;
  rootPath: string;
  mcpServers?: NewToolMCPServer[];
  agents?: NewToolAgent[];
  settings?: Record<string, unknown>;
  discovered: {
    agentCount: number;
    mcpServerCount: number;
  };
}
```

### Step 4: Implement Scanner

Create `scanner.ts`:

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import type { NewToolMCPServer, NewToolAgent, NewToolToolModel } from './types.js';
import type { ToolName } from '../../registry/tool-paths.registry.js';

export class NewToolScanner {
  async scan(basePath: string): Promise<{ model: NewToolToolModel; errors: NewToolScanErrors }> {
    // Check if directory exists
    if (!await this.isNewToolDirectory(basePath)) {
      throw new Error(`NewTool directory not found: ${basePath}`);
    }

    // Scan MCP servers, agents, settings
    // ...

    return {
      model: {
        tool: 'newtool' as ToolName,
        rootPath: basePath,
        mcpServers,
        agents,
        settings,
        discovered: { agentCount: 0, mcpServerCount: 0 }
      },
      errors: {}
    };
  }

  async isNewToolDirectory(checkPath: string): Promise<boolean> {
    // Check if directory exists with valid config
  }
}
```

### Step 5: Implement Tool Parser

Create `tool.parser.ts`:

```typescript
import { NewToolScanner } from './scanner.js';
import type { NewToolToolModel } from './types.js';

export class NewToolToolParser {
  private scanner: NewToolScanner;

  constructor() {
    this.scanner = new NewToolScanner();
  }

  async scan(basePath: string) {
    return this.scanner.scan(basePath);
  }

  async isValid(path: string): Promise<boolean> {
    return this.scanner.isNewToolDirectory(path);
  }
}
```

### Step 6: Create Index Export

Create `index.ts`:

```typescript
export { NewToolToolParser } from './tool.parser.js';
export { NewToolScanner } from './scanner.js';
export * from './types.js';
```

### Step 7: Add to Parser Exports

Edit `packages/core/src/parsers/index.ts`:

```typescript
// Add new tool exports
export { NewToolToolParser, NewToolScanner } from './newtool/index.js';
export type { NewToolToolModel, NewToolMCPServer, NewToolAgent } from './newtool/types.js';
```

### Step 8: Implement Translator (if needed)

If you need to migrate FROM this tool:

Create `packages/core/src/translators/newtool-to-claude.translator.ts`:

```typescript
import type { NewToolToolModel } from '../parsers/newtool/types.js';
import type { ClaudeToolModel } from '../parsers/claude/types.js';

export class NewToolToClaudeTranslator {
  translate(model: NewToolToolModel): ClaudeToolModel {
    // Transform NewTool model to Claude model
  }
}
```

### Step 9: Write Tests

Create `packages/core/src/__tests__/newtool-parser.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { NewToolToolParser } from '../parsers/newtool/tool.parser.js';

describe('NewToolToolParser', () => {
  it('should parse newtool directory', async () => {
    const parser = new NewToolToolParser();
    const result = await parser.scan('/path/to/newtool');
    
    expect(result.model.tool).toBe('newtool');
    // ... more assertions
  });
});
```

### Step 10: Add Documentation

Create `packages/core/src/parsers/newtool/SPEC.md`:

```markdown
# NewTool Parser Specification

## Directory Structure

Describe the tool's config structure here.

## Usage

```typescript
const parser = new NewToolToolParser();
const result = await parser.scan('/path/to/newtool');
```
```

---

## Single-File vs Directory-Based

### Single-File Parser Structure

```
newtool/
├── scanner.ts       # Reads single config file
├── tool.parser.ts   # Parser interface
├── types.ts        # Type definitions
└── SPEC.md
```

### Directory-Based Parser Structure

```
newtool/
├── scanner.ts       # Scans multiple directories
├── tool.parser.ts  # Parser interface
├── types.ts        # Type definitions
├── SPEC.md
└── parsers/
    ├── agent.parser.ts   # Parses agent files
    ├── skill.parser.ts  # Parses skill files
    ├── mcp.parser.ts    # Parses MCP config
    └── config.parser.ts # Parses general settings
```

---

## Testing Checklist

- [ ] Unit tests for parser
- [ ] Unit tests for translator
- [ ] Integration tests for migration flow
- [ ] E2E test for full migration
- [ ] Documentation in SPEC.md

---

## Important Rule

Never implement direct translations:

```
Tool A → Tool B
```

Always use the common format:

```
Tool A → Tool Model → Tool B
```

This prevents exponential translator growth as you add more tools.
