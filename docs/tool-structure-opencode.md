# OpenCode Tool Structure Reference

## Overview

This document describes the complete directory and file structure for OpenCode configurations, which is essential for accurate detection and migration.

## Configuration Types

OpenCode supports two configuration scopes:
1. **Project-level** (local) - Stored in project's `.opencode/` directory
2. **Global** (system) - Stored in user's `~/.config/opencode/` directory

---

## Project-Level Structure (./.opencode/)

Located at the root of each project using OpenCode.

```
project-root/
├── .opencode/
│   ├── package.json              # Plugin dependencies
│   ├── bun.lock                  # Lock file (if using Bun)
│   ├── .gitignore               # Git ignore rules
│   ├── node_modules/            # Plugin packages
│   │   └── @opencode-ai/
│   │       ├── plugin/          # Core plugin
│   │       └── sdk/             # SDK for integrations
│   ├── agents/                  # Project-specific agents
│   │   ├── engineering-agent.md
│   │   └── test-runner-agent.md
│   └── skills/                  # Project-specific skills
│       ├── project-status/
│       │   └── SKILL.md
│       ├── git-commit-agentsync/
│       │   └── SKILL.md
│       └── [skill-name]/
│           └── SKILL.md
└── [other project files]
```

### Agent File Format (Markdown with YAML Frontmatter)

**Location**: `.opencode/agents/{agent-name}.md`

**Structure**:
```markdown
---
name: engineering-agent
description: "Use for implementing features (TDD), fixing bugs..."
tools:
  read: true
  grep: true
  glob: true
  bash: true
  edit: true
  write: true
  skill: true
maxTurns: 50
  - execute-next
  - fix-bug
  - test-analyzer
---

[Agent instructions/prompts in Markdown format]
```

**Key Fields**:
- `name` (required): Unique identifier for the agent
- `description` (required): What the agent does
- `tools` (required): Permissions map (read, grep, glob, bash, edit, write, skill)
- `maxTurns` (optional): Maximum conversation turns (default: 50)
- `skills` (optional): List of skill names this agent can use

### Skill Directory Format

**Location**: `.opencode/skills/{skill-name}/SKILL.md`

**Structure**:
```
skills/
└── {skill-name}/
    └── SKILL.md          # Skill definition
    └── [optional files]  # Supporting files for the skill
```

**SKILL.md Format**:
```markdown
# Skill Name

## Description
What this skill does...

## Usage
How to use this skill...

## Tools Required
- read
- edit

## Examples
[Usage examples]
```

---

## Global Structure (~/.config/opencode/)

Located in the user's home directory for system-wide OpenCode configuration.

```
~/.config/opencode/
├── opencode.json        # MCP server configurations & global settings
├── package.json         # Global plugin dependencies
├── bun.lock            # Lock file
├── .gitignore          # Git ignore rules
├── node_modules/       # Global plugin packages
└── skills/             # Global skills (optional)
    └── [skill-name]/
        └── SKILL.md
```

### opencode.json Format

**Location**: `~/.config/opencode/opencode.json`

**Structure**:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "youtrack": {
      "type": "remote",
      "url": "https://youtrack.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    },
    "trello": {
      "type": "local",
      "command": ["npx", "-y", "trello-mcp"],
      "environment": {
        "TRELLO_API_KEY": "<api-key>",
        "TRELLO_TOKEN": "<token>"
      }
    }
  }
}
```

**Key Sections**:
- `$schema`: Schema URL for validation
- `mcp`: MCP (Model Context Protocol) server configurations
  - Each key is a server name
  - `type`: "remote" or "local"
  - `url`: Remote server URL (for remote type)
  - `command`: Command to start local server (for local type)
  - `headers`: HTTP headers for authentication (remote)
  - `environment`: Environment variables (local)

### package.json Format

**Location**: `~/.config/opencode/package.json` or `./.opencode/package.json`

**Structure**:
```json
{
  "dependencies": {
    "@opencode-ai/plugin": "1.3.10",
    "@opencode-ai/sdk": "^2.0.0"
  }
}
```

---

## Detection Patterns for Migration

### Glob Patterns Used by Scanner

The AI Directory Scanner uses the following glob patterns for detection:

| File Type | Project Pattern | Global Pattern |
|-----------|----------------|----------------|
| Agents | `**/.opencode/agents/*.md` | `**/.config/opencode/agents/*.md` |
| Skills | `**/.opencode/skills/**/SKILL.md` | `**/.config/opencode/skills/**/SKILL.md` |
| Config | `**/.opencode/opencode.json` | `**/.config/opencode/opencode.json` |

### What to Detect

1. **OpenCode Installation**
   - Global: Check if `~/.config/opencode/` exists
   - Project: Check if `./.opencode/` exists

2. **Agents**
   - Pattern: `{scope}/agents/*.md`
   - Parse YAML frontmatter for metadata
   - Required fields: `name`, `description`
   - Optional fields: `tools`, `maxTurns`, `skills`, `model`, `mcpServers`
   - **Important**: Files without YAML frontmatter are filtered out as false positives

3. **Skills**
   - Pattern: `{scope}/skills/**/SKILL.md`
   - Parse Markdown content
   - Extract: name (from directory), description, usage, tools
   - Must have Markdown heading (`# Skill Name`)

4. **MCP Servers** (Global only)
   - Parse `~/.config/opencode/opencode.json`
   - Extract: `mcpServers.{server-name}` with type, url/command, auth
   - Both local (command-based) and remote (URL-based) servers supported

### AI Cross-Validation

To eliminate false positives, the scanner performs cross-validation:

1. **File Existence Check**
   - Verify file exists and is readable
   - Check file is not empty

2. **Content Validation**
   - Agents: Must have valid YAML frontmatter with `---` delimiters
   - Skills: Must have Markdown heading structure
   - Config: Must be valid JSON

3. **Structure Validation**
   - Agents must be in `agents/` directory
   - Skills must be in `skills/{name}/` directory with `SKILL.md` filename
   - Config must be named `opencode.json`

4. **Confidence Scoring**
   - Well-formed files: >0.8 confidence
   - Minimal files: 0.5-0.8 confidence
   - Invalid files: <0.6 confidence (filtered out)

### Migration Considerations

#### Migration Path Selection

When performing a migration, users can select the output location:

1. **Current Directory**: Save migrated files to `./migrated/` or current project
2. **Home Directory**: Save to `~/.config/[adapter]/` (default config location)
3. **Custom Path**: User-specified directory via file browser

**Migration Output Structure:**
```
[user-selected-path]/
├── [adapter-name]/
│   ├── settings.json          # Main config file
│   ├── agents/
│   │   ├── [agent-name].md    # Migrated agents
│   │   └── ...
│   ├── skills/
│   │   ├── [skill-name]/
│   │   │   └── SKILL.md       # Migrated skills
│   │   └── ...
│   └── mcp-servers.json       # MCP server configs
```

**Post-Migration Display:**
After migration completes, the CLI shows:
- Exact file paths of all migrated files
- Summary count (agents, skills, configs)
- Migration duration
- Option to view migrated files or migrate to another adapter

See [UI Flow Documentation](./ui-flow.md) for complete user interface specifications.

#### Migration Process

When migrating TO OpenCode:
1. Convert agent configs to Markdown with YAML frontmatter
2. Create skill directories with SKILL.md files
3. Merge MCP configurations into opencode.json
4. Preserve tool permissions mapping
5. Run cross-validation to ensure valid structure
6. Save to user-selected output path
7. Display exact migrated file locations

When migrating FROM OpenCode:
1. Parse YAML frontmatter from agent files
2. Read SKILL.md files from skill directories
3. Extract MCP configurations from opencode.json
4. Convert to target adapter format
5. Save to user-selected output path
6. Display exact migrated file locations
3. Extract MCP configurations from opencode.json
4. Map tool permissions to target format
5. Filter out files that fail cross-validation

---

## Common Patterns

### Agent Tools Mapping

| OpenCode Tool | Claude | Cursor | Gemini |
|--------------|--------|--------|--------|
| read | ✅ | ✅ | ✅ |
| grep | ✅ | ❌ | ✅ |
| glob | ✅ | ❌ | ✅ |
| bash | ✅ | ✅ | ✅ |
| edit | ✅ | ✅ | ✅ |
| write | ✅ | ✅ | ✅ |
| skill | ✅ | ❌ | ❌ |

### File Naming Conventions

- **Agents**: `{kebab-case-name}.md` (e.g., `engineering-agent.md`)
- **Skills**: Directory in `{kebab-case-name}/` with `SKILL.md` inside
- **Configs**: `opencode.json` (root level in scope)

### Environment Variables

Global OpenCode may reference environment variables:
- `$HOME` or `~` for home directory
- `$OPENCODE_API_KEY` for API authentication
- Custom vars defined in MCP server environment blocks

---

## Scanner UI and Real-Time Feedback

The Scanner UI provides real-time visual feedback during scanning:

### Scan Progress Display

```
Scanning ~/.config/opencode...  ⠋
✓ Found agent: backend-agent (~/.config/opencode/agents/backend-agent.md)
✓ Found agent: frontend-agent (~/.config/opencode/agents/frontend-agent.md)
Scanning ./.opencode...         ⠙
✓ Found skill: coding (./.opencode/skills/coding/SKILL.md)
✓ Found skill: testing (./.opencode/skills/testing/SKILL.md)
```

### Final Summary Display

```
═══════════════════════════════════════════
           SCAN COMPLETE
═══════════════════════════════════════════

Tools Detected:
  ✔ OpenCode (project + global)

Agents Found: 3
  • backend-agent
  • frontend-agent
  • global-agent

Skills Found: 2
  • coding
  • testing

MCP Servers: 2
  • filesystem
  • terminal

Locations:
  ~/.config/opencode
  ./.opencode

Duration: 1.2s
═══════════════════════════════════════════
```

### Features

- **Real-time spinner**: Shows current directory being scanned
- **Incremental results**: "Found X agents, Y skills..." updates dynamically
- **Visual feedback**: Checkmarks (✓) for found entities, info icons (ℹ) for detected tools
- **Structured summary**: Organized output with sections for tools, agents, skills, MCP servers
- **Duration tracking**: Shows scan completion time
- **Silent mode**: Suppresses output for programmatic use

## Implementation Notes for Scanner

1. **Use glob patterns** for directory scanning:
   - Agents: `**/.opencode/agents/*.md` and `**/.config/opencode/agents/*.md`
   - Skills: `**/.opencode/skills/**/SKILL.md` and `**/.config/opencode/skills/**/SKILL.md`
   - Config: `**/opencode.json`

2. **Validate files** before reporting:
   - Check if Markdown file has valid YAML frontmatter
   - Verify required fields (name, description) exist
   - Confirm file is not empty
   - Run AI cross-validation to eliminate false positives

3. **AI Cross-Validation Layers**:
   - File existence validation
   - File size validation (not empty, not too large)
   - Content validation (YAML frontmatter for agents, Markdown structure for skills, valid JSON for configs)
   - Structure validation (correct directory paths)
   - Cross-reference validation (parent directories exist)
   - Confidence scoring (0-1, configurable threshold default 0.6)

4. **Performance Considerations**:
   - Scan completes in <5 seconds for typical projects (<1000 files)
   - Parallel validation using Promise.all
   - Lazy validation: glob first, then validate content
   - Support for maxDepth option to limit scan depth

5. **Error Handling**:
   - Non-existent directories: Return empty results with error logged
   - Permission errors: Skip file, continue scanning
   - Invalid files: Filter out during cross-validation
   - All errors collected in result.errors array

6. **Cross-provider Recognition**:
   - After migration, verify target tool can read the migrated config
   - Test that agents appear in target tool's UI/CLI
   - Confirm MCP servers are accessible

---

## References

- OpenCode Documentation: https://opencode.ai/docs
- MCP Protocol: https://modelcontextprotocol.io/
- YAML Frontmatter Spec: https://jekyllrb.com/docs/front-matter/
