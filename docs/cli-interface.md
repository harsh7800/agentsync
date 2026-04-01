# CLI Interface — AgentSync CLI

## 1. CLI Modes

AgentSync CLI supports three modes:

### Command Mode (One-Shot Commands)

```bash
agentsync migrate --from claude --to cursor
agentsync rollback cursor
agentsync detect
```

### Interactive Agent Mode (REPL with Slash Commands) ⭐ NEW

When you run `agentsync` without arguments, the CLI enters **Agent Mode** — a persistent interactive REPL with slash commands:

```bash
$ agentsync

AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> /scan
Scan current directory or entire system?
1. Current directory
2. Entire system  
3. Custom path

User: 2

Scanning directories...
✔ Found Claude Code config
✔ Found OpenCode agents
✔ Found MCP servers
✔ Found 3 agents, 12 skills

Scan Complete

Tools Detected:
- Claude Code
- OpenCode

Agents Found: 3
Agent Names:
- backend-agent
- migration-agent
- ui-agent

Skills Found: 12

MCP Servers:
- filesystem
- terminal
- github

Locations:
- ~/.claude/
- ~/.config/opencode/
- ./agents/

Would you like to migrate these agents to another tool?
1. Yes
2. No

User: 1

Select target tool:
1. Claude Code
2. OpenCode
3. Gemini CLI
4. Cursor
5. GitHub Copilot CLI

> 
```

### Legacy Interactive Mode (Natural Language) — Deprecated

```bash
agentsync --legacy-interactive
> migrate claude to cursor
> show installed tools
> rollback cursor
> help
```

**Note:** Legacy natural language mode is deprecated in favor of the new slash command system.

### TUI Mode (Ink-based Terminal UI) ⭐ NEW

Launch the modern React-based terminal UI:

```bash
agentsync tui
```

The TUI provides a full-screen interactive interface with:
- **Welcome Screen**: Entry point with tool detection
- **Scan View**: Visual scanning with progress indicators
- **Migration Wizard**: 6-step guided migration process
  1. Select Source Tool
  2. Select Target Tool (Claude Code only)
  3. Select Output Location (with FileBrowser)
  4. Confirm Migration
  5. Migration Progress (with real-time logs)
  6. Migration Complete
- **File Browser**: Keyboard-navigable path selection
- **Keyboard Shortcuts**: Arrow keys, Enter, Escape, 'q' for quit

**Features:**
- Dark, minimal color scheme
- Full keyboard navigation
- Real-time progress updates
- Scrollable log panels
- Wizard-style step indicators

**Fallback:** Automatically falls back to inquirer-based prompts when TTY is not available (e.g., CI/SSH).

---

## 2. Slash Commands (Agent Mode)

When in Agent Mode, all commands start with `/`:

| Command | Description | Example |
|---------|-------------|---------|
| `/` or `/help` | Show available commands | `/>` |
| `/scan` | Scan for agents and tools | `/scan` |
| `/sync` | Incremental sync of detected tools | `/sync` |
| `/migrate` | Start migration workflow | `/migrate` |
| `/detect` | Detect installed tools | `/detect` |
| `/status` | Show current session state | `/status` |
| `/exit` | Exit Agent Mode | `/exit` |
| `/clear` | Clear screen | `/clear` |

---

## 3. Agent Mode Features

### 3.1 Persistent Session State

Agent Mode maintains session state across commands:

```typescript
session = {
  scannedTools: ['claude', 'opencode'],
  detectedAgents: ['backend-agent', 'migration-agent', 'ui-agent'],
  detectedSkills: [...],
  detectedMCPs: ['filesystem', 'terminal', 'github'],
  scanPaths: ['~/.claude/', '~/.config/opencode/', './agents/'],
  selectedTargetTool: null
}
```

This allows workflows like:
1. `/scan` — scan and detect
2. `/status` — review what was found
3. `/migrate` — migrate detected agents

### 3.2 Scan Command Flow

```
User: /scan
    ↓
Prompt: Scan scope?
    - Current directory
    - Entire system
    - Custom path
    ↓
Scan with live UI (spinner + progress)
    ↓
Show Scan Results Summary
    ↓
Prompt: Migrate now?
    - Yes → Start migration workflow
    - No → Return to prompt
```

### 3.3 Scan Scope Options

| Option | Description | Scan Target |
|--------|-------------|-------------|
| Current directory | Scan only current working directory | `process.cwd()` |
| Entire system | Scan known tool locations + home directory | `~/.claude/`, `~/.opencode/`, etc. |
| Custom path | User-specified path | User input |

---

## 4. Command Mode (Non-Agent)

| Command | Description | Example |
|---------|-------------|---------|
| `migrate` | Run migration | `agentsync migrate --from claude --to opencode` |
| `sync` | Incremental sync | `agentsync sync` |
| `detect` | Detect installed tools | `agentsync detect` |
| `tui` | Launch Ink TUI | `agentsync tui` |
| `rollback` | Restore backup | `agentsync rollback cursor` |
| `update-schemas` | Update schema registry | `agentsync update-schemas` |
| `report` | Show migration report | `agentsync report` |
| `doctor` | Diagnose config issues | `agentsync doctor` |

---

## 5. CLI Startup Flow

### Agent Mode (Default)

```
agentsync
    ↓
Show banner
    ↓
AgentSync Interactive Mode
    ↓
Show help hint (/ for commands)
    ↓
Start Agent Loop (REPL)
    ↓
Wait for slash commands
```

### Command Mode

```
agentsync migrate --from claude --to cursor
    ↓
Show banner (if TTY)
    ↓
Execute command
    ↓
Exit
```

---

## 6. Interactive Architecture

### File Structure

```
packages/cli/interactive/
├── agent-loop.ts           # Main REPL loop
├── command-registry.ts     # Slash command registry
├── session-state.ts        # Session state manager
└── commands/
    ├── scan.ts            # /scan command handler
    ├── migrate.ts         # /migrate command handler
    ├── status.ts          # /status command handler
    ├── help.ts            # /help command handler
    └── exit.ts            # /exit command handler
```

### Command Registry

Maps slash commands to handlers:

```typescript
registry.register('/scan', scanCommandHandler);
registry.register('/migrate', migrateCommandHandler);
registry.register('/status', statusCommandHandler);
```

---

## 7. UX Philosophy

Agent Mode is designed to feel like an **AI agent terminal**, not a traditional CLI:

| Traditional CLI | Agent Mode |
|-----------------|------------|
| One-shot commands | Persistent REPL session |
| Arguments and flags | Slash commands |
| Static output | Live UI with spinners |
| Stateless | Session memory |
| Manual workflow steps | Guided step-by-step flows |
| Raw data dumps | Structured summaries |

The CLI should feel like Claude Code, OpenCode, or Cursor Agent — an interactive AI environment.

