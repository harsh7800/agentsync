# Codex Folder Structure

Codex stores everything under a `.codex` tree (defaults to `~/.codex`, can be redirected via `CODEX_HOME` environment variable). This tree holds configuration files, agent instruction chains, skills, prompts, and session metadata.

## Root `.codex` Directory

```
~/.codex/                    (or $CODEX_HOME)
├── config.toml              # User-scope configuration
├── requirements.toml        # Enterprise/policy requirements
├── AGENTS.md                # Global agent instructions
├── AGENTS.override.md       # Override instructions (takes precedence)
├── skills/                  # Skills directory
├── sessions/                # Runtime session metadata
├── prompts/                 # Saved prompts
└── plugins/                 # Plugins
```

### config.toml per Scope

Codex uses TOML format for configuration. Files are discovered in priority order with later scopes overriding earlier ones:

| Scope | Path | Description |
|-------|------|-------------|
| System | `/etc/codex/config.toml` | System-wide defaults |
| User | `~/.codex/config.toml` | User-level config (or `$CODEX_HOME/config.toml`) |
| Project | `.codex/config.toml` | Project-specific overrides |
| Policy | `~/.codex/requirements.toml` | Enterprise/policy requirements |

#### config.toml Structure

```toml
[provider]
provider = "openai"
model = "gpt-4"
api_key = "sk-..."

[sandbox]
enabled = true
network_access = false
allowed_paths = ["/home/user/projects"]

[hooks]
pre_run = "echo starting"

[mcp.server-name]
type = "local"
command = ["npx", "-y", "package"]
env = { API_KEY = "value" }

[mcp.remote-server]
type = "remote"
url = "https://mcp.example.com"
headers = { Authorization = "Bearer token" }

default_agent = "my-agent"
default_skill = "my-skill"
```

### requirements.toml

Enterprise policy configuration that constrains Codex behavior:

```toml
[policy]
max_tokens = 4000
allowed_providers = ["openai", "anthropic"]

[security]
require_sandbox = true
allow_network = false
```

## AGENTS.md Hierarchy

Agent instructions are discovered in order, with `AGENTS.override.md` taking precedence:

### Discovery Order

1. **Global**: `~/.codex/AGENTS.md` — Base instructions for all projects
2. **Project Root**: `.codex/AGENTS.md` — Project-specific instructions
3. **Nested Folders**: Subdirectory `AGENTS.md` files (up to 3 levels deep)

### Override Rules

- `AGENTS.override.md` files take precedence over `AGENTS.md` in the same directory
- Content from override files replaces the corresponding section in the base file
- Project-level instructions supplement (not replace) global instructions

### AGENTS.md Format

```markdown
---
description: Agent description
system_prompt: System prompt instructions
tools:
  - filesystem
  - git
---

# Agent Name

Detailed instructions go here...
```

## Skills & Plugins

### Location

Skills live under `$CODEX_HOME/skills/{name}/`:

```
~/.codex/skills/
├── skill-name/
│   ├── SKILL.md             # Skill definition (required)
│   ├── scripts/             # Optional executable scripts
│   ├── references/          # Optional reference files
│   ├── assets/              # Optional asset files
│   ├── agents/              # Optional agent definitions
│   └── openai.yaml          # Optional OpenAI-specific config
└── ...
```

### Required Files

Each skill must have a `SKILL.md` file with YAML frontmatter:

```markdown
---
description: Skill description
enabled: true
instructions: Optional instruction override
---

# Skill Name

Skill content and instructions...
```

### openai.yaml

Optional OpenAI-specific configuration:

```yaml
model: gpt-4
temperature: 0.3
max_tokens: 2000
```

### Enabling Skills

Skills can be enabled/disabled:
- Via the `enabled` field in `SKILL.md` frontmatter
- Via `config.toml` settings

## Runtime Directories

### Sessions (`~/.codex/sessions/`)

Stores session metadata for resumed threads:

```json
{
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-01T10:30:00Z",
  "agent_name": "code-reviewer",
  "summary": "Reviewed authentication module changes"
}
```

File naming: `{session-id}.json`

### Prompts (`~/.codex/prompts/`)

Saved prompts stored as markdown files:

```
~/.codex/prompts/
├── code-review.md
├── refactor.md
└── test-generation.md
```

File naming: `{prompt-name}.md`

## Configuration Override Flow

```
System (/etc/codex/config.toml)
    ↓
User (~/.codex/config.toml)
    ↓
Project (.codex/config.toml)
    ↓
Requirements (~/.codex/requirements.toml)
```

Each level can override settings from the previous level. Later scopes take precedence.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CODEX_HOME` | Override the default `~/.codex` path |

## AgentSync Integration

AgentSync detects and migrates Codex configurations:

```typescript
import { CodexToolParser, toolPathRegistry } from '@agent-sync/core';

// Check if Codex is installed
const isInstalled = await toolPathRegistry.isToolInstalled('codex');

// Resolve Codex path
const resolved = toolPathRegistry.resolveToolPath('codex', true);
console.log(resolved.rootPath); // ~/.codex (or $CODEX_HOME)

// Scan Codex configuration
const parser = new CodexToolParser();
const result = await parser.scan(resolved.rootPath);

// Access discovered items
console.log(result.model.agents);      // Discovered agents
console.log(result.model.skills);      // Discovered skills
console.log(result.model.mcpServers);  // MCP server configs
console.log(result.model.prompts);     // Saved prompts
console.log(result.model.sessions);    // Session metadata
```

## Supported Configurations

| Component | Detection | Migration |
|-----------|-----------|-----------|
| config.toml | ✅ | ✅ |
| requirements.toml | ✅ | ✅ |
| AGENTS.md | ✅ | ✅ |
| AGENTS.override.md | ✅ | ✅ |
| Skills (SKILL.md) | ✅ | ✅ |
| openai.yaml | ✅ | ✅ |
| MCP servers | ✅ | ✅ |
| Saved prompts | ✅ | ✅ |
| Session metadata | ✅ | Read-only |
