# OpenCode Directory Scanner - Enhanced Parser

## Overview

The OpenCode Directory Scanner is an enhanced parser that reads OpenCode's multi-file, directory-based configuration structure. It extracts MCP servers, agents, and skills from their respective locations and combines them into a unified `OpenCodeDirectoryConfig` object for migration.

**Why this matters**: OpenCode stores configuration across multiple files and folders:
- `mcp.json` for MCP servers
- `agents/*/agent.md` for agent definitions
- `skills/*/skill.md` for skill definitions
- `config.json` and `opencode.json` for general settings

## Directory Structure

```
~/.config/opencode/
├── config.json      # General settings (global config)
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

---

## Files

| File | Purpose |
|------|---------|
| `opencode-directory-scanner.ts` | Main scanner class that orchestrates reading |
| `opencode-skill-parser.ts` | Parses skill.md files from skill directories |
| `opencode-agent-parser.ts` | Parses agent.md files from agent directories |
| `opencode-skill.types.ts` | TypeScript types for skill structures |
| `opencode-agent.types.ts` | TypeScript types for agent structures (extends existing types) |
| `index.ts` | Module exports |

---

## Types

### OpenCodeSkill

```typescript
export interface OpenCodeSkill {
  name: string;           // From directory name (e.g., "git-commit")
  description: string;    // From skill.md content
  content: string;        // Full markdown content
  path: string;           // Full path to skill.md
}
```

### OpenCodeSkillConfig

```typescript
export interface OpenCodeSkillConfig {
  instructions?: string;   // Required instructions for the skill
  description?: string;     // Optional description
  enabled?: boolean;        // Whether skill is enabled
}
```

### OpenCodeAgentFile

```typescript
export interface OpenCodeAgentFile {
  name: string;           // From directory name (e.g., "onboarding")
  description: string;     // From agent.md content
  systemPrompt?: string;   // Optional system prompt
  content: string;        // Full markdown content
  path: string;           // Full path to agent.md
}
```

### OpenCodeDirectoryConfig

```typescript
export interface OpenCodeDirectoryConfig {
  basePath: string;                           // Path to ~/.config/opencode
  mcpServers?: OpenCodeMCPServer[];           // From mcp.json
  agents?: OpenCodeAgent[];                   // From agents/*/agent.md
  skills?: OpenCodeSkill[];                   // From skills/*/skill.md
  settings?: OpenCodeSettings;                // From config.json + opencode.json
  discovered: {
    agentCount: number;
    skillCount: number;
    mcpServerCount: number;
  };
}
```

### OpenCodeSettings

```typescript
export interface OpenCodeSettings {
  model?: string;              // LLM model to use
  temperature?: number;        // Model temperature
  maxTokens?: number;         // Max tokens per response
  apiKey?: string;             // API key (will be masked)
  baseUrl?: string;            // Custom API endpoint
  // Add other settings as discovered
}
```

---

## Classes

### OpenCodeDirectoryScanner

Main orchestrator class that scans the OpenCode directory.

```typescript
export class OpenCodeDirectoryScanner {
  /**
   * Scan an OpenCode directory and extract all configurations
   */
  async scan(basePath: string): Promise<OpenCodeDirectoryConfig>;
  
  /**
   * Scan only MCP servers from mcp.json
   */
  async scanMCPServers(basePath: string): Promise<OpenCodeMCPServer[]>;
  
  /**
   * Scan agents from agents/*/agent.md files
   */
  async scanAgents(basePath: string): Promise<OpenCodeAgent[]>;
  
  /**
   * Scan skills from skills/*/skill.md files
   */
  async scanSkills(basePath: string): Promise<OpenCodeSkill[]>;
  
  /**
   * Scan general settings from config.json and opencode.json
   */
  async scanSettings(basePath: string): Promise<OpenCodeSettings | undefined>;
  
  /**
   * Check if a path is a valid OpenCode directory
   */
  isOpenCodeDirectory(path: string): Promise<boolean>;
}
```

### OpenCodeSkillParser

Parses individual skill.md files.

```typescript
export class OpenCodeSkillParser {
  /**
   * Parse a skill.md file
   * @param skillPath - Path to the skill.md file
   * @param skillName - Name of the skill (from directory name)
   */
  parse(skillPath: string, skillName: string): Promise<OpenCodeSkill>;
  
  /**
   * Parse skill.md content directly
   */
  parseContent(content: string, skillName: string): OpenCodeSkillConfig;
}
```

### OpenCodeAgentFileParser

Parses individual agent.md files.

```typescript
export class OpenCodeAgentFileParser {
  /**
   * Parse an agent.md file
   * @param agentPath - Path to the agent.md file
   * @param agentName - Name of the agent (from directory name)
   */
  parse(agentPath: string, agentName: string): Promise<OpenCodeAgentFile>;
  
  /**
   * Parse agent.md content directly
   */
  parseContent(content: string, agentName: string): OpenCodeAgentFile;
}
```

---

## File Parsing Formats

### skill.md Format

```markdown
---
description: A skill for writing perfect git commits
enabled: true
---

# Git Commit Skill

You are a git commit assistant. Help users write clear, concise commit messages following conventional commits format.

## Instructions

When asked to create a commit:
1. Stage the relevant changes
2. Analyze the diff
3. Suggest an appropriate commit message
```

### agent.md Format

```markdown
---
description: Helps new team members understand the codebase
system_prompt: You are a friendly onboarding assistant.
tools:
  - filesystem
  - git
---

# Onboarding Assistant

You help new team members get up to speed with the codebase.
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| Directory doesn't exist | Throw `Error: OpenCode directory not found: {path}` |
| mcp.json is invalid JSON | Log warning, skip MCP servers |
| skill.md parse failure | Log warning, skip that skill |
| agent.md parse failure | Log warning, skip that agent |
| Permission denied | Log warning, continue with other files |

---

## Test Scenarios

### Unit Tests

1. **OpenCodeSkillParser**
   - Parse valid skill.md with all fields
   - Parse skill.md with only description
   - Parse skill.md with minimal content
   - Handle missing frontmatter
   - Handle invalid frontmatter YAML

2. **OpenCodeAgentFileParser**
   - Parse valid agent.md with all fields
   - Parse agent.md with no tools
   - Parse agent.md with minimal content
   - Handle missing frontmatter

3. **OpenCodeDirectoryScanner**
   - Scan complete directory structure
   - Scan with no agents
   - Scan with no skills
   - Scan with only mcp.json
   - Handle empty directory
   - Validate directory structure

### Integration Tests

1. Scan real OpenCode directory structure
2. Scan with nested skill/agent directories
3. Verify all discovered files are parsed

---

## Acceptance Criteria

- [ ] Can scan `~/.config/opencode/` directory structure
- [ ] Extracts MCP servers from `mcp.json`
- [ ] Extracts agents from `agents/*/agent.md` files
- [ ] Extracts skills from `skills/*/skill.md` files
- [ ] Extracts settings from `config.json` and `opencode.json`
- [ ] Returns unified `OpenCodeDirectoryConfig` object
- [ ] Handles missing files gracefully (logs warning, continues)
- [ ] Handles invalid files gracefully (logs warning, skips)
- [ ] Provides discovery statistics

---

## Dependencies

- `FileOperations` from `../file-operations.js`
- Uses Node.js `fs/promises` for file reading
- Uses `path` for path manipulation

---

## Future Enhancements (Deferred)

- Support for agent configurations in YAML format
- Support for skill dependencies between skills
- Support for agent skill assignments
- Validation against OpenCode schema

---

## Related Files

- `packages/core/src/parsers/opencode.parser.ts` - Existing parser (single-file)
- `packages/core/src/translators/opencode-to-claude.translator.ts` - Needs update
- `packages/cli/src/commands/migrate.ts` - Needs update to handle directory scanning
- `packages/cli/src/commands/interactive.ts` - Needs update for directory detection
