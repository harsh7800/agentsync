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
skills:
  - execute-next
  - fix-bug
  - test-gen
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

### What to Detect

1. **OpenCode Installation**
   - Global: Check if `~/.config/opencode/` exists
   - Project: Check if `./.opencode/` exists

2. **Agents**
   - Pattern: `{scope}/agents/*.md`
   - Parse YAML frontmatter for metadata
   - Extract: name, description, tools, maxTurns, skills

3. **Skills**
   - Pattern: `{scope}/skills/**/SKILL.md`
   - Parse Markdown content
   - Extract: name (from directory), description, usage, tools

4. **MCP Servers** (Global only)
   - Parse `~/.config/opencode/opencode.json`
   - Extract: mcp.{server-name}.type, url/command, auth

### Migration Considerations

When migrating TO OpenCode:
1. Convert agent configs to Markdown with YAML frontmatter
2. Create skill directories with SKILL.md files
3. Merge MCP configurations into opencode.json
4. Preserve tool permissions mapping

When migrating FROM OpenCode:
1. Parse YAML frontmatter from agent files
2. Read SKILL.md files from skill directories
3. Extract MCP configurations from opencode.json
4. Map tool permissions to target format

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

## Implementation Notes for Scanner

1. **Use glob patterns** for directory scanning:
   - Agents: `**/.opencode/agents/*.md` and `**/.config/opencode/agents/*.md`
   - Skills: `**/.opencode/skills/**/SKILL.md` and `**/.config/opencode/skills/**/SKILL.md`
   - Config: `**/opencode.json`

2. **Validate files** before reporting:
   - Check if Markdown file has valid YAML frontmatter
   - Verify required fields (name, description) exist
   - Confirm file is not empty

3. **AI Validation**:
   - Use AI to confirm detected files are legitimate OpenCode configs
   - Flag potential false positives (e.g., random .md files)
   - Validate YAML structure matches expected schema

4. **Cross-provider Recognition**:
   - After migration, verify target tool can read the migrated config
   - Test that agents appear in target tool's UI/CLI
   - Confirm MCP servers are accessible

---

## References

- OpenCode Documentation: https://opencode.ai/docs
- MCP Protocol: https://modelcontextprotocol.io/
- YAML Frontmatter Spec: https://jekyllrb.com/docs/front-matter/
