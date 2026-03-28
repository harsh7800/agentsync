# AgentSync Tool Registry

<!-- AUTO-GENERATED: Source of truth for AgentSync parser adapters -->
<!-- Last updated: March 2026 -->
<!-- Purpose: Machine-readable reference for all supported AI tool config paths, schemas, and migration rules -->

---

## Registry Metadata

```json
{
  "registry_version": "1.1.0",
  "schema_version": "2026-03",
  "tools_supported": [
    "claude-code",
    "gemini-cli",
    "copilot-cli",
    "opencode",
    "aider",
    "open-interpreter",
    "vscode",
    "cursor",
    "windsurf",
    "anti-gravity",
    "copilot-extension",
    "continue"
  ],
  "tool_categories": ["cli", "ide", "editor-extension"],
  "mcp_protocol_version": "1.0"
}
```

---

## Tool: Claude Code

### Identity

- **id**: `claude-code`
- **type**: `cli`
- **runtime**: Node.js / Electron
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `managed` — org-enforced, cannot be overridden
2. `local` — machine-local project overrides, gitignored
3. `project` — committed to git, shared with team
4. `user` — global user preferences

### Global / User Paths

| File                               | Type         | Contains                                                   |
| ---------------------------------- | ------------ | ---------------------------------------------------------- |
| `~/.claude.json`                   | MCP + Auth   | MCP servers (user+local scope), OAuth session, preferences |
| `~/.claude/settings.json`          | Settings     | Permissions, hooks, plugins — NOT MCP                      |
| `~/.claude/CLAUDE.md`              | Instructions | Global instructions applied to all sessions                |
| `~/.claude/commands/*.md`          | Commands     | Global slash commands → `/user:command-name`               |
| `~/.claude/skills/{name}/SKILL.md` | Skills       | Global agent skills (one subdir per skill)                 |
| `~/.claude/.credentials.json`      | Credentials  | API keys — Linux/Windows only; macOS uses Keychain         |
| `~/.claude/projects/{hash}/`       | State        | Per-project session history and state cache                |

### Project / Local Paths

| File                                    | Type         | Contains                                               |
| --------------------------------------- | ------------ | ------------------------------------------------------ |
| `{root}/.mcp.json`                      | MCP          | Project-scoped MCP servers (commit to git)             |
| `{root}/.claude/settings.json`          | Settings     | Project settings — permissions, allowed tools (commit) |
| `{root}/.claude/settings.local.json`    | Settings     | Machine-local overrides (auto-gitignored)              |
| `{root}/CLAUDE.md`                      | Instructions | Project instructions — supports `@` imports            |
| `{root}/**/{subdir}/CLAUDE.md`          | Instructions | Subdirectory-level instructions (monorepo support)     |
| `{root}/.claude/commands/*.md`          | Commands     | Project slash commands → `/project:command-name`       |
| `{root}/.claude/skills/{name}/SKILL.md` | Skills       | Project-scoped agent skills                            |

### Managed / Enterprise Paths

| File                                                | OS          | Contains                                         |
| --------------------------------------------------- | ----------- | ------------------------------------------------ |
| `/etc/claude-code/managed-settings.json`            | Linux/macOS | Org policy base                                  |
| `/etc/claude-code/managed-settings.d/*.json`        | Linux/macOS | Drop-in policy fragments (sorted alphabetically) |
| `/etc/claude-code/managed-mcp.json`                 | Linux/macOS | Org-enforced MCP servers                         |
| `C:\Program Files\ClaudeCode\managed-settings.json` | Windows     | Org policy base                                  |

### MCP Schema

```json
{
  "mcpServers": {
    "{server-name}": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "sk-..."
      }
    },
    "{remote-name}": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer token" }
    },
    "{sse-name}": {
      "type": "sse",
      "url": "https://api.example.com/sse"
    }
  }
}
```

### Skills Schema

```
{root}/.claude/skills/{skill-name}/
├── SKILL.md          # Required — skill definition and trigger description
└── *.md              # Optional supporting files
```

`SKILL.md` frontmatter:

```yaml
---
description: Brief description used by Claude to decide when to invoke this skill
allowed-tools: [Bash, Read, Write]
---
```

### Slash Command Schema

```markdown
---
description: Review the current branch diff for issues before merging
allowed-tools: Bash
---

## Changes to Review

!`git diff main...HEAD`
Review the above changes for code quality, security, and test coverage.
```

### Parser Notes

- **Critical**: MCP lives in `~/.claude.json` (home root), NOT `~/.claude/settings.json`
- `settings.json` does NOT accept MCP keys — silently ignored
- `CLAUDE.md` supports `@path/to/file` import syntax
- `settings.local.json` is auto-added to `.claude/.gitignore` when created
- Managed settings use systemd drop-in convention: sorted alphabetically, later files win

---

## Tool: Gemini CLI

### Identity

- **id**: `gemini-cli`
- **type**: `cli`
- **runtime**: Node.js
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `project` — `.gemini/settings.json` in project root
2. `env` — `.env` files (searched up from CWD to home)
3. `user` — `~/.gemini/settings.json`

### Global / User Paths

| File                                         | Type             | Contains                                                       |
| -------------------------------------------- | ---------------- | -------------------------------------------------------------- |
| `~/.gemini/settings.json`                    | MCP + All config | MCP servers, model, auth type, UI, telemetry — all in one file |
| `~/.gemini/.env`                             | Credentials      | API keys and secrets                                           |
| `~/.gemini/extensions/`                      | Extensions       | npm-based extensions (closest equivalent to agents)            |
| `~/.gemini/tmp/{project_hash}/shell_history` | State            | Per-project shell history (hash from project root path)        |

### Project / Local Paths

| File                           | Type         | Contains                                         |
| ------------------------------ | ------------ | ------------------------------------------------ |
| `{root}/.gemini/settings.json` | MCP + Config | Project-scoped overrides merged on top of global |
| `{root}/.env`                  | Credentials  | Project API keys                                 |
| `{root}/GEMINI.md`             | Instructions | Primary context file                             |
| `{root}/CONTEXT.md`            | Instructions | Alternative context filename (both supported)    |

### MCP Schema

```json
{
  "mcpServers": {
    "{server-name}": {
      "command": "node",
      "args": ["server.js"],
      "env": { "API_KEY": "..." },
      "cwd": "/path/to/dir",
      "timeout": 30000,
      "trust": false,
      "description": "My server",
      "includeTools": ["tool1"],
      "excludeTools": ["tool2"]
    },
    "{remote-name}": {
      "httpUrl": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer $TOKEN" },
      "timeout": 5000,
      "oauth": {
        "clientId": "...",
        "clientSecret": "..."
      }
    },
    "{sse-deprecated}": {
      "url": "https://api.example.com/sse"
    }
  }
}
```

### Full settings.json Schema

```json
{
  "selectedAuthType": "gemini-api-key",
  "general": {
    "vimMode": false,
    "preferredEditor": "code",
    "checkpointing": { "enabled": true }
  },
  "ui": { "theme": "GitHub", "hideBanner": false },
  "mcpServers": {},
  "model": { "name": "gemini-2.5-pro", "maxSessionTurns": 10 },
  "context": {
    "fileName": ["GEMINI.md", "CONTEXT.md"],
    "includeDirectories": ["~/shared"],
    "fileFiltering": { "respectGitIgnore": true }
  },
  "tools": { "sandbox": "docker", "exclude": ["write_file"] },
  "telemetry": { "enabled": false }
}
```

### Parser Notes

- No separate MCP file — MCP is embedded in `settings.json`
- Transport detection: `httpUrl` (preferred streamable HTTP) > `url` (SSE, deprecated) > `command` (stdio)
- No native agents/skills system — use `GEMINI.md` and extensions
- `context.fileName` is an array — agent should check all listed filenames

---

## Tool: GitHub Copilot CLI

### Identity

- **id**: `copilot-cli`
- **type**: `cli`
- **runtime**: Node.js
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `workspace` — project-level `.copilot/mcp-config.json`
2. `user` — `~/.copilot/`

### Global / User Paths

| File                         | Type            | Contains                                 |
| ---------------------------- | --------------- | ---------------------------------------- |
| `~/.copilot/config.json`     | Settings + Auth | Trusted folders, permissions, auth       |
| `~/.copilot/mcp-config.json` | MCP             | User-level MCP servers                   |
| `~/.copilot/agents/*.md`     | Agents          | Markdown agent definitions               |
| `~/.copilot/session-state/`  | State           | Ephemeral — do NOT copy between machines |

### Project / Workspace Paths

| File                                            | Type         | Contains                                 |
| ----------------------------------------------- | ------------ | ---------------------------------------- |
| `{root}/.copilot/mcp-config.json`               | MCP          | Project MCP (overrides user on conflict) |
| `{root}/.github/copilot-instructions.md`        | Instructions | Primary repo-level instructions          |
| `{root}/.github/instructions/*.instructions.md` | Instructions | Granular instruction files per concern   |

### MCP Schema

```json
{
  "mcpServers": {
    "{server-name}": {
      "type": "local",
      "command": "uvx",
      "args": ["mcp-server-name"],
      "tools": ["*"],
      "env": {}
    },
    "{remote-name}": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer token" }
    }
  }
}
```

### config.json Schema

```json
{
  "trusted_folders": ["/home/user/projects"],
  "permissions": {
    "allow": ["My-MCP-Server"],
    "deny": ["My-MCP-Server(dangerous_tool)"]
  }
}
```

### Parser Notes

- MCP discovery: walks up from CWD to git root looking for `.copilot/mcp-config.json`
- `type: "local"` = stdio transport; maps to `stdio` in normalized schema
- User `COPILOT_HOME` env var overrides `~/.copilot/` location
- Shared instructions file with VS Code: `.github/copilot-instructions.md`

---

## Tool: VS Code (GitHub Copilot extension)

### Identity

- **id**: `vscode`
- **type**: `ide`
- **runtime**: Electron
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `workspace` — `.vscode/mcp.json` in project root
2. `user` — platform-specific global path

### Global / User Paths

| File                                                    | OS      | Type     | Contains                                     |
| ------------------------------------------------------- | ------- | -------- | -------------------------------------------- |
| `~/Library/Application Support/Code/User/mcp.json`      | macOS   | MCP      | Global MCP — key is `"servers"`              |
| `~/.config/Code/User/mcp.json`                          | Linux   | MCP      | Global MCP — key is `"servers"`              |
| `%APPDATA%\Code\User\mcp.json`                          | Windows | MCP      | Global MCP — key is `"servers"`              |
| `~/Library/Application Support/Code/User/settings.json` | macOS   | Settings | User settings (also accepts `"mcp"` section) |

### Project / Workspace Paths

| File                                            | Type         | Contains                                |
| ----------------------------------------------- | ------------ | --------------------------------------- |
| `{root}/.vscode/mcp.json`                       | MCP          | Workspace MCP — key is `"servers"`      |
| `{root}/.vscode/settings.json`                  | Settings     | Workspace settings                      |
| `{root}/.vscode/extensions.json`                | Config       | Recommended extensions                  |
| `{root}/.github/copilot-instructions.md`        | Instructions | Primary Copilot instructions            |
| `{root}/.github/instructions/*.instructions.md` | Instructions | Granular instruction files              |
| `{root}/.devcontainer/devcontainer.json`        | Config       | DevContainers (also accepts MCP config) |

### MCP Schema

```json
{
  "servers": {
    "{server-name}": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@microsoft/mcp-server-playwright"]
    },
    "{remote-name}": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp"
    }
  },
  "inputs": [
    {
      "id": "API_KEY",
      "type": "promptString",
      "description": "Your API key"
    }
  ]
}
```

### Parser Notes

- **⚠ CRITICAL**: Top-level key is `"servers"` — NOT `"mcpServers"`. This is the #1 migration bug.
- `inputs` array is unique to VS Code — prompt user for values at runtime. No equivalent in other tools.
- Platform-specific global paths must all be checked — parser must detect OS
- DevContainers support: MCP also accepted in `devcontainer.json`

---

## Tool: Cursor

### Identity

- **id**: `cursor`
- **type**: `ide`
- **runtime**: Electron (VS Code fork)
- **config_format**: JSON (MCP) + MDC (rules)

### Scope Hierarchy (highest → lowest)

1. `project` — `.cursor/` in project root
2. `global` — `~/.cursor/`

### Global / User Paths

| File                                 | Type     | Contains                                                |
| ------------------------------------ | -------- | ------------------------------------------------------- |
| `~/.cursor/mcp.json`                 | MCP      | Global MCP servers — key is `"mcpServers"`              |
| `~/.cursor/cli-config.json`          | Settings | CLI permissions                                         |
| Cursor Settings → Rules → User Rules | Rules    | Free-form global rules text (stored in app, not a file) |

### Project Paths

| File                                  | Type         | Contains                                              |
| ------------------------------------- | ------------ | ----------------------------------------------------- |
| `{root}/.cursor/mcp.json`             | MCP          | Project MCP — shown as "Project Managed" in UI        |
| `{root}/.cursor/rules/*.mdc`          | Rules        | MDC format rules (primary — preferred format)         |
| `{root}/.cursor/rules/{name}/RULE.md` | Rules        | Alternative per-docs rule format                      |
| `{root}/.cursorrules`                 | Rules        | **Deprecated** legacy single-file rules — still works |
| `{root}/AGENTS.md`                    | Instructions | Cross-tool instruction file (supported since 2025)    |

### MCP Schema

```json
{
  "mcpServers": {
    "{server-name}": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": { "API_KEY": "..." }
    },
    "{python-server}": {
      "command": "uv",
      "args": ["--directory", "/path/to/project", "run", "main.py"]
    },
    "{remote-name}": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

### MDC Rule Schema

```markdown
---
description: TypeScript coding standards
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Rule content here (markdown)

- Use strict mode
- Prefer interfaces over types
```

### Parser Notes

- **⚠ Security**: CVE-2025-54136 — Cursor trusts server key name, not command. Audit external `.cursor/mcp.json` files.
- Max 40 active MCP tools before context degradation
- `.cursorrules` is deprecated but still read — parser should handle both
- MDC frontmatter: `alwaysApply: true` = always injected; `globs` = file-pattern trigger
- User Rules from app settings cannot be accessed via filesystem — document as manual migration step
- Resources (v1.6+) and Elicitation (v1.5+) supported

---

---

## Tool: Windsurf

### Identity

- **id**: `windsurf`
- **type**: `ide`
- **runtime**: Electron
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `workspace` — `.windsurf/`
2. `user` — `~/.windsurf/`

### Global / User Paths

| File                          | Type         | Contains             |
| ----------------------------- | ------------ | -------------------- |
| `~/.windsurf/mcp.json`        | MCP          | Global MCP servers   |
| `~/.windsurf/settings.json`   | Settings     | Editor + AI settings |
| `~/.windsurf/instructions.md` | Instructions | Global instructions  |

### Project / Workspace Paths

| File                               | Type         | Contains                |
| ---------------------------------- | ------------ | ----------------------- |
| `{root}/.windsurf/mcp.json`        | MCP          | Workspace MCP           |
| `{root}/.windsurf/settings.json`   | Settings     | Workspace settings      |
| `{root}/.windsurf/instructions.md` | Instructions | Project instructions    |
| `{root}/AGENTS.md`                 | Instructions | Cross-tool instructions |

### MCP Schema

```json
{
  "mcpServers": {
    "{server-name}": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    },
    "{remote-name}": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

---

## Tool: Anti-Gravity

### Identity

- **id**: `anti-gravity`
- **type**: `ide`
- **runtime**: Electron
- **config_format**: JSON

### Scope Hierarchy (highest → lowest)

1. `workspace` — `.antigravity/`
2. `user` — `~/.antigravity/`

### Global / User Paths

| File                             | Type         | Contains             |
| -------------------------------- | ------------ | -------------------- |
| `~/.antigravity/mcp.json`        | MCP          | Global MCP servers   |
| `~/.antigravity/settings.json`   | Settings     | Editor + AI settings |
| `~/.antigravity/instructions.md` | Instructions | Global instructions  |

### Project / Workspace Paths

| File                                  | Type         | Contains                |
| ------------------------------------- | ------------ | ----------------------- |
| `{root}/.antigravity/mcp.json`        | MCP          | Workspace MCP           |
| `{root}/.antigravity/settings.json`   | Settings     | Workspace settings      |
| `{root}/.antigravity/instructions.md` | Instructions | Project instructions    |
| `{root}/AGENTS.md`                    | Instructions | Cross-tool instructions |

### MCP Schema

Same as Cursor / Windsurf (`mcpServers`)

### Parser Notes

- Same MCP schema as Cursor
- Instruction fallback chain:
  `.antigravity/instructions.md → AGENTS.md → CLAUDE.md`

---

## Tool: GitHub Copilot Extension

### Identity

- **id**: `copilot-extension`
- **type**: `editor-extension`
- **runtime**: VS Code Extension
- **config_format**: JSON

### Paths

| File                                            | Type         | Contains            |
| ----------------------------------------------- | ------------ | ------------------- |
| `{root}/.github/copilot-instructions.md`        | Instructions | Repo instructions   |
| `{root}/.github/instructions/*.instructions.md` | Instructions | Scoped instructions |
| `{root}/.vscode/settings.json`                  | Settings     | Copilot settings    |

### Parser Notes

- Uses instruction files only
- No MCP servers
- No agents/skills system

---

---

## Tool: GitHub Copilot Extension

### Identity

- **id**: `copilot-extension`
- **type**: `editor-extension`
- **runtime**: VS Code Extension
- **config_format**: JSON

### Paths

| File                                            | Type         | Contains            |
| ----------------------------------------------- | ------------ | ------------------- |
| `{root}/.github/copilot-instructions.md`        | Instructions | Repo instructions   |
| `{root}/.github/instructions/*.instructions.md` | Instructions | Scoped instructions |
| `{root}/.vscode/settings.json`                  | Settings     | Copilot settings    |

### Parser Notes

- Uses instruction files only
- No MCP servers
- No agents/skills system

## Tool: Aider

### Identity

- **id**: `aider`
- **type**: `cli`
- **runtime**: Python
- **config_format**: YAML / ENV

### Global Paths

| File                          | Type   | Contains         |
| ----------------------------- | ------ | ---------------- |
| `~/.aider.conf.yml`           | Config | Model + settings |
| `~/.aider.model.settings.yml` | Config | Model configs    |

### Project Paths

| File              | Type         | Contains             |
| ----------------- | ------------ | -------------------- |
| `.aider.conf.yml` | Config       | Project settings     |
| `AGENTS.md`       | Instructions | Project instructions |

### Parser Notes

- No MCP support
- Only instructions + model config

## Tool: OpenCode

### Identity

- **id**: `opencode`
- **type**: `cli`
- **runtime**: Bun
- **config_format**: JSON / JSONC

### Scope Hierarchy (highest → lowest)

1. `project` — `opencode.json` in project root + `.opencode/` dir
2. `custom` — `$OPENCODE_CONFIG_DIR` (env var override)
3. `global` — `~/.config/opencode/`
4. `remote` — org defaults from `.well-known/opencode` (loaded first, lowest precedence)

### Global / User Paths

| File                                     | Type             | Contains                                                   |
| ---------------------------------------- | ---------------- | ---------------------------------------------------------- |
| `~/.config/opencode/opencode.json`       | MCP + All config | Main config (also accepts `.jsonc`)                        |
| `~/.config/opencode/AGENTS.md`           | Instructions     | Global personal instructions (not committed to git)        |
| `~/.config/opencode/agents/*.json\|*.md` | Agents           | Global agent definitions                                   |
| `~/.config/opencode/commands/*.md`       | Commands         | Global slash commands (`$ARGUMENTS` supported)             |
| `~/.config/opencode/skills/`             | Skills           | Global skills (also reads `~/.claude/skills/` as fallback) |
| `~/.config/opencode/modes/*.md`          | Modes            | Global custom modes (plan, build, debug, refactor…)        |
| `~/.config/opencode/plugins/`            | Plugins          | Global `.ts` plugin files                                  |
| `~/.config/opencode/themes/`             | Themes           | Custom TUI themes                                          |
| `~/.local/share/opencode/auth.json`      | Credentials      | API keys per provider (after `/connect`)                   |
| `~/.local/share/opencode/mcp-auth.json`  | Credentials      | OAuth tokens for remote MCP servers                        |

### Project Paths

| File                         | Type         | Contains                                                   |
| ---------------------------- | ------------ | ---------------------------------------------------------- |
| `{root}/opencode.json`       | MCP + Config | Project-level config and MCP overrides                     |
| `{root}/AGENTS.md`           | Instructions | Project instructions (falls back to `CLAUDE.md` if absent) |
| `{root}/.opencode/agents/`   | Agents       | Project agents                                             |
| `{root}/.opencode/commands/` | Commands     | Project slash commands                                     |
| `{root}/.opencode/skills/`   | Skills       | Project skills                                             |
| `{root}/.opencode/modes/`    | Modes        | Project custom modes                                       |
| `{root}/.opencode/plugins/`  | Plugins      | Project `.ts` plugins                                      |

### MCP Schema

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "{server-name}": {
      "type": "local",
      "command": "node",
      "args": ["server.js"],
      "env": { "API_KEY": "..." },
      "enabled": true
    },
    "{remote-name}": {
      "type": "remote",
      "url": "https://api.example.com/mcp",
      "enabled": false
    }
  }
}
```

### Full opencode.json Schema

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-6",
  "providers": {
    "anthropic": { "apiKey": "sk-ant-..." },
    "openai": { "apiKey": "sk-..." },
    "disabled_providers": ["groq"]
  },
  "mcp": {},
  "agents": {
    "coder": { "model": "anthropic/claude-sonnet-4-6", "maxTokens": 5000 }
  },
  "instructions": ["CONTRIBUTING.md", "docs/*.md"],
  "plugin": ["opencode-helicone-session"],
  "autoupdate": true
}
```

### Claude Code Compatibility Fallbacks

OpenCode reads these Claude Code files when OpenCode equivalents are absent:

| Missing OpenCode file          | Falls back to               |
| ------------------------------ | --------------------------- |
| `AGENTS.md` (project)          | `CLAUDE.md` in project root |
| `~/.config/opencode/AGENTS.md` | `~/.claude/CLAUDE.md`       |
| `~/.config/opencode/skills/`   | `~/.claude/skills/`         |

To disable fallback: set `OPENCODE_NO_CLAUDE_COMPAT=1`

### Parser Notes

- **⚠ CRITICAL**: MCP key is `"mcp"` — NOT `"mcpServers"`
- **⚠ CRITICAL**: Transport types are `"local"` (= stdio) and `"remote"` (= http) — not standard `"stdio"/"http"`
- Subdirectory names are plural: `agents/`, `commands/`, `skills/` (singular also works for compatibility)
- `JSONC` format supported — comments allowed in config files
- Org remote config loaded from `.well-known/opencode` on provider auth

---

## Migration Translation Map

### MCP Key Name Translation

| From \ To       | claude-code            | gemini-cli             | copilot-cli            | vscode                 | cursor                 | opencode            |
| --------------- | ---------------------- | ---------------------- | ---------------------- | ---------------------- | ---------------------- | ------------------- |
| **claude-code** | —                      | mcpServers→mcpServers  | mcpServers→mcpServers  | mcpServers→**servers** | mcpServers→mcpServers  | mcpServers→**mcp**  |
| **gemini-cli**  | mcpServers→mcpServers  | —                      | mcpServers→mcpServers  | mcpServers→**servers** | mcpServers→mcpServers  | mcpServers→**mcp**  |
| **copilot-cli** | mcpServers→mcpServers  | mcpServers→mcpServers  | —                      | mcpServers→**servers** | mcpServers→mcpServers  | mcpServers→**mcp**  |
| **vscode**      | **servers**→mcpServers | **servers**→mcpServers | **servers**→mcpServers | —                      | **servers**→mcpServers | **servers**→**mcp** |
| **cursor**      | mcpServers→mcpServers  | mcpServers→mcpServers  | mcpServers→mcpServers  | mcpServers→**servers** | —                      | mcpServers→**mcp**  |
| **opencode**    | **mcp**→mcpServers     | **mcp**→mcpServers     | **mcp**→mcpServers     | **mcp**→**servers**    | **mcp**→mcpServers     | —                   |

### Transport Type Translation

| Normalized | claude-code | gemini-cli               | copilot-cli | vscode  | cursor              | opencode        |
| ---------- | ----------- | ------------------------ | ----------- | ------- | ------------------- | --------------- |
| `stdio`    | `stdio`     | _(command present)_      | `local`     | `stdio` | _(command present)_ | `local`         |
| `http`     | `http`      | `httpUrl` field          | `http`      | `http`  | `http`              | `remote`        |
| `sse`      | `sse`       | `url` field (deprecated) | `sse`       | `sse`   | _(unsupported)_     | _(unsupported)_ |

### Instructions File Translation

| From      | To claude-code | To gemini-cli | To copilot-cli/vscode           | To cursor                        | To opencode |
| --------- | -------------- | ------------- | ------------------------------- | -------------------------------- | ----------- |
| CLAUDE.md | CLAUDE.md      | GEMINI.md     | .github/copilot-instructions.md | AGENTS.md + .cursor/rules/\*.mdc | AGENTS.md   |
| GEMINI.md | CLAUDE.md      | GEMINI.md     | .github/copilot-instructions.md | AGENTS.md                        | AGENTS.md   |
| AGENTS.md | CLAUDE.md      | GEMINI.md     | .github/copilot-instructions.md | AGENTS.md                        | AGENTS.md   |

### Skills / Agents Translation

| Concept          | claude-code                               | gemini-cli     | copilot-cli              | cursor                | opencode                       |
| ---------------- | ----------------------------------------- | -------------- | ------------------------ | --------------------- | ------------------------------ |
| Global skills    | `~/.claude/skills/{name}/SKILL.md`        | — (extensions) | —                        | User Rules (app)      | `~/.config/opencode/skills/`   |
| Project skills   | `.claude/skills/{name}/SKILL.md`          | —              | —                        | `.cursor/rules/*.mdc` | `.opencode/skills/`            |
| Global agents    | —                                         | —              | `~/.copilot/agents/*.md` | User Rules            | `~/.config/opencode/agents/`   |
| Project agents   | —                                         | —              | —                        | `.cursor/rules/*.mdc` | `.opencode/agents/`            |
| Global commands  | `~/.claude/commands/*.md` → `/user:name`  | —              | —                        | —                     | `~/.config/opencode/commands/` |
| Project commands | `.claude/commands/*.md` → `/project:name` | —              | —                        | —                     | `.opencode/commands/`          |

---

## Normalized Internal Schema

All adapters must translate to/from this normalized representation:

```typescript
interface NormalizedMcpServer {
  name: string; // server key name
  transport: "stdio" | "http" | "sse"; // normalized transport type
  command?: string; // stdio: executable
  args?: string[]; // stdio: arguments
  env?: Record<string, string>; // env vars (keys masked if containing secrets)
  url?: string; // http/sse: endpoint URL
  headers?: Record<string, string>; // http: auth headers
  cwd?: string; // working directory (gemini-cli specific)
  timeout?: number; // ms (gemini-cli specific)
  enabled?: boolean; // opencode specific
}

interface NormalizedAgent {
  name: string;
  content: string; // raw file content
  format: "markdown" | "json" | "mdc"; // source format
  scope: "global" | "project";
  sourceTool: string; // which tool this came from
}

interface NormalizedInstructions {
  content: string;
  scope: "global" | "project";
  sourcePath: string;
}

interface NormalizedMaskedKey {
  keyName: string; // env var name or config key
  maskedValue: string; // e.g. "sk-ant-***...***1234"
  prefix: string; // detectable prefix for re-entry hint
}
```

---

## API Key Masking Rules

```typescript
const KEY_PATTERNS = [
  {
    pattern: /^sk-ant-[a-zA-Z0-9-_]{10,}/,
    prefix: "sk-ant-",
    tool: "anthropic",
  },
  { pattern: /^sk-[a-zA-Z0-9]{10,}/, prefix: "sk-", tool: "openai" },
  { pattern: /^AIza[a-zA-Z0-9-_]{35}/, prefix: "AIza", tool: "google" },
  { pattern: /^ghu_[a-zA-Z0-9]{36}/, prefix: "ghu_", tool: "github-user" },
  { pattern: /^ghs_[a-zA-Z0-9]{36}/, prefix: "ghs_", tool: "github-server" },
  { pattern: /^Bearer\s.+/, prefix: "Bearer ", tool: "generic-bearer" },
];

// Masking rule: keep first 8 chars + *** + last 4 chars
// e.g. sk-ant-ap → sk-ant-a***...***p1x2
```

---

## Parser Registry Manifest

```json
{
  "claude-code": {
    "adapter": "packages/core/src/adapters/claude-code.ts",
    "schema_version": "2.1",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.claude.json",
    "project_mcp_file": ".mcp.json",
    "global_instructions": "~/.claude/CLAUDE.md",
    "project_instructions": "CLAUDE.md",
    "global_skills_dir": "~/.claude/skills/",
    "project_skills_dir": ".claude/skills/",
    "global_commands_dir": "~/.claude/commands/",
    "project_commands_dir": ".claude/commands/",
    "transport_map": { "stdio": "stdio", "http": "http", "sse": "sse" }
  },
  "gemini-cli": {
    "adapter": "packages/core/src/adapters/gemini-cli.ts",
    "schema_version": "0.23",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.gemini/settings.json",
    "project_mcp_file": ".gemini/settings.json",
    "global_instructions": null,
    "project_instructions": "GEMINI.md",
    "project_instructions_alt": "CONTEXT.md",
    "transport_map": {
      "stdio": "command_present",
      "http": "httpUrl",
      "sse": "url"
    }
  },
  "copilot-cli": {
    "adapter": "packages/core/src/adapters/copilot-cli.ts",
    "schema_version": "1.0",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.copilot/mcp-config.json",
    "project_mcp_file": ".copilot/mcp-config.json",
    "global_instructions": null,
    "project_instructions": ".github/copilot-instructions.md",
    "global_agents_dir": "~/.copilot/agents/",
    "transport_map": { "stdio": "local", "http": "http", "sse": "sse" }
  },
  "vscode": {
    "adapter": "packages/core/src/adapters/vscode.ts",
    "schema_version": "1.99",
    "mcp_key": "servers",
    "global_mcp_file_macos": "~/Library/Application Support/Code/User/mcp.json",
    "global_mcp_file_linux": "~/.config/Code/User/mcp.json",
    "global_mcp_file_windows": "%APPDATA%\\Code\\User\\mcp.json",
    "project_mcp_file": ".vscode/mcp.json",
    "project_instructions": ".github/copilot-instructions.md",
    "transport_map": { "stdio": "stdio", "http": "http", "sse": "sse" }
  },
  "cursor": {
    "adapter": "packages/core/src/adapters/cursor.ts",
    "schema_version": "1.0",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.cursor/mcp.json",
    "project_mcp_file": ".cursor/mcp.json",
    "project_instructions": "AGENTS.md",
    "project_rules_dir": ".cursor/rules/",
    "legacy_rules_file": ".cursorrules",
    "transport_map": { "stdio": "command_present", "http": "http" }
  },
  "opencode": {
    "adapter": "packages/core/src/adapters/opencode.ts",
    "schema_version": "1.0",
    "mcp_key": "mcp",
    "global_mcp_file": "~/.config/opencode/opencode.json",
    "project_mcp_file": "opencode.json",
    "global_instructions": "~/.config/opencode/AGENTS.md",
    "project_instructions": "AGENTS.md",
    "project_instructions_fallback": "CLAUDE.md",
    "global_skills_dir": "~/.config/opencode/skills/",
    "project_skills_dir": ".opencode/skills/",
    "global_agents_dir": "~/.config/opencode/agents/",
    "project_agents_dir": ".opencode/agents/",
    "global_commands_dir": "~/.config/opencode/commands/",
    "project_commands_dir": ".opencode/commands/",
    "transport_map": { "stdio": "local", "http": "remote" },
    "claude_compat_fallbacks": {
      "instructions": "~/.claude/CLAUDE.md",
      "skills": "~/.claude/skills/"
    }
  },
  "windsurf": {
    "adapter": "packages/core/src/adapters/windsurf.ts",
    "schema_version": "1.0",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.windsurf/mcp.json",
    "project_mcp_file": ".windsurf/mcp.json",
    "project_instructions": ".windsurf/instructions.md"
  },
  "anti-gravity": {
    "adapter": "packages/core/src/adapters/anti-gravity.ts",
    "schema_version": "1.0",
    "mcp_key": "mcpServers",
    "global_mcp_file": "~/.antigravity/mcp.json",
    "project_mcp_file": ".antigravity/mcp.json",
    "project_instructions": ".antigravity/instructions.md"
  },
  "continue": {
    "adapter": "packages/core/src/adapters/continue.ts",
    "schema_version": "1.0",
    "project_config_file": ".continue/config.json"
  },
  "copilot-extension": {
    "adapter": "packages/core/src/adapters/copilot-extension.ts",
    "schema_version": "1.0",
    "project_instructions": ".github/copilot-instructions.md"
  },
  "aider": {
    "adapter": "packages/core/src/adapters/aider.ts",
    "schema_version": "1.0",
    "project_config_file": ".aider.conf.yml"
  },
  "open-interpreter": {
    "adapter": "packages/core/src/adapters/open-interpreter.ts",
    "schema_version": "1.0",
    "project_config_file": ".open-interpreter/config.yaml"
  }
}
```

---

## Migration Gotchas — High-Priority Test Cases

These are the cases most likely to cause silent failures. Write TDD tests for each one **before** implementing the adapter:

1. **VS Code `servers` key** — must not be passed through as `mcpServers` or `mcp`
2. **OpenCode `mcp` key** — must not be written as `mcpServers` to other tools
3. **OpenCode transport values** — `local` → `stdio`, `remote` → `http` (and reverse)
4. **Gemini CLI transport detection** — no explicit `type` field; inferred from which URL field is present
5. **Claude Code MCP file location** — `~/.claude.json` at home root, NOT `~/.claude/settings.json`
6. **VS Code `inputs` array** — no equivalent in other tools; must warn user keys need manual re-entry
7. **Cursor `.cursorrules` (deprecated)** — still functional; parser must read it as fallback
8. **OpenCode CLAUDE.md fallback** — if AGENTS.md absent, reads CLAUDE.md; don't double-migrate instructions
9. **Gemini CLI has no agents/skills** — migration of agents TO gemini-cli should warn: no equivalent, content will be placed in GEMINI.md only
10. **VS Code global path is OS-dependent** — must resolve based on `process.platform`

---

_This registry is the authoritative source of truth for AgentSync v1 adapter development._
_Update this file when tool schemas change — schema versioning in the manifest prevents breaking migrations._
