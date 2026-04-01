# CLI UI & Branding — AgentSync CLI

## 1. Purpose

The CLI UI should feel modern, clean, and professional — like an **AI agent terminal** rather than a traditional CLI. Similar to Claude Code, Gemini CLI, OpenCode, and Cursor Agent.

Key characteristics:
- Persistent interactive session
- Slash commands
- Live UI with spinners and progress
- Session state memory
- Structured summaries
- Step-by-step workflows

---

## 2. Entry Banner

### Agent Mode Entry

When running `agentsync` without arguments:

```
AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

>
```

### ASCII Banner (Optional)

For branding displays:

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗██╗   ██╗███╗   ██╗ ██████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████╗ ╚████╔╝ ██╔██╗ ██║██║     
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║  ╚██╔╝  ██║╚██╗██║██║     
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████║   ██║   ██║ ╚████║╚██████╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝

AgentSync CLI — AI Agent Environment Migration Tool
```

### Minimal Banner

```
◆ AgentSync CLI
  Migrate AI agents, MCP servers, and configs between tools
```

---

## 3. Colors & Styling

Use terminal colors consistently across the CLI.

| Element           | Color                                     |
| ----------------- | ----------------------------------------- |
| Banner            | Gradient (Cyan → Purple / Blue → Magenta) |
| Success           | Green                                     |
| Warning           | Yellow                                    |
| Error             | Red                                       |
| Info              | Blue                                      |
| Tool Names        | Cyan                                      |
| Paths             | Gray                                      |
| Migration Summary | Magenta                                   |
| Section Headers   | Bold White                                |
| Prompts           | Cyan                                      |
| AI Messages       | Purple                                    |
| Slash Commands    | Yellow                                    |
| Agent Counts      | Bold Cyan                                 |

---

## 4. Scanner Loading UI

### Live Scanning Experience

When running `/scan`, show live updates with spinner:

```
Scanning directories...

✔ Found Claude Code config
✔ Found OpenCode agents  
✔ Found MCP servers
✔ Found 3 agents, 12 skills
```

### Spinner Messages (Dynamic)

The spinner text updates as scanning progresses:

```
Scanning ~/.claude...                    [spinner]
Scanning ~/.config/opencode...           [spinner]
Scanning project directory...            [spinner]
Analyzing agent files...                 [spinner]
```

### Implementation

Use `ora` for spinners:

```typescript
const spinner = ora('Scanning directories...').start();

// Update spinner text dynamically
spinner.text = 'Scanning ~/.claude...';
// ... do work
spinner.succeed('Found Claude Code config');

spinner.text = 'Scanning ~/.config/opencode...';
// ... do work
spinner.succeed('Found OpenCode agents');
```

---

## 5. Scan Results Summary

### Structured Output

After scanning completes:

```
═══════════════════════════════════════════
           SCAN COMPLETE
═══════════════════════════════════════════

Tools Detected:
  ✔ Claude Code
  ✔ OpenCode

Agents Found: 3
  • backend-agent
  • migration-agent
  • ui-agent

Skills Found: 12

MCP Servers:
  • filesystem
  • terminal
  • github

Locations Scanned:
  ~/.claude/
  ~/.config/opencode/
  ./agents/

═══════════════════════════════════════════
```

### Summary Data Structure

| Field | Description | Example |
|-------|-------------|---------|
| Tools Detected | List of found tools | Claude Code, OpenCode |
| Agents Found | Count + names | 3 agents listed |
| Skills Found | Count only | 12 skills |
| MCP Servers | List of server names | filesystem, terminal |
| Locations | Paths scanned | ~/.claude/, etc. |

---

## 6. Session State Display

### /status Command Output

```
═══════════════════════════════════════════
         CURRENT SESSION
═══════════════════════════════════════════

Scan Status: ✔ Complete
Last Scan: 2026-04-01 14:32:15

Tools Detected: 2
  • Claude Code
  • OpenCode

Agents: 3
  • backend-agent
  • migration-agent
  • ui-agent

Skills: 12

MCP Servers: 3
  • filesystem
  • terminal
  • github

Scanned Paths:
  ~/.claude/
  ~/.config/opencode/
  ./agents/

Target Tool: Not selected

═══════════════════════════════════════════
```

---

## 7. Slash Command Help

### /help or / Output

```
═══════════════════════════════════════════
       AVAILABLE COMMANDS
═══════════════════════════════════════════

  /scan          Scan for agents and tools
  /migrate       Start migration workflow
  /detect        Detect installed tools
  /status        Show current session state
  /clear         Clear the screen
  /help          Show this help message
  /exit          Exit Agent Mode

═══════════════════════════════════════════

Tip: Use /scan first to detect your agents,
     then /migrate to start migration.
```

---

## 8. Migration Prompt Flow

### After Scan

```
Would you like to migrate these agents to another tool?

1. Yes - Start migration
2. No - Return to prompt

> 1

Select target tool:

1. Claude Code
2. OpenCode
3. Gemini CLI
4. Cursor
5. GitHub Copilot CLI

> 2

Starting migration from Claude Code to OpenCode...
```

---

## 9. Recommended Libraries

Use these Node.js libraries:

| Library         | Purpose                    |
| --------------- | -------------------------- |
| figlet          | ASCII banner               |
| chalk           | Colors                     |
| gradient-string | Gradient banner            |
| boxen           | Boxes / panels             |
| ora             | Spinner for async ops      |
| cli-table3      | Tables                     |
| log-symbols     | Icons (✔, ✖, ⚠, ℹ)        |
| inquirer        | Interactive prompts        |
| readline        | REPL/command line interface|

---

## 10. CLI UX Goals

Agent Mode should feel:

- **Like an AI terminal** — not a traditional CLI
- **Professional** — polished and reliable
- **Fast** — responsive, live UI updates
- **Clean** — structured, readable output
- **Modern** — comparable to Claude Code, Cursor
- **Developer-focused** — efficient keyboard workflows
- **Stateful** — remembers what was scanned
- **Guided** — clear next steps after each action

---

## 11. Message Style Guide

### Friendly but Professional

**Scan Start**
```
Scanning your system for AI tools and agents...
```

**Scan Complete**
```
Found 3 agents and 12 skills across 2 tools.
```

**Migration Start**
```
Starting migration from Claude Code to OpenCode...
```

**Backup**
```
Backing up existing configuration...
```

**Dry Run**
```
Dry run complete. No files were changed.
```

**Exit**
```
Goodbye! Your session state is preserved for next time.
```

**Error**
```
Migration failed: Cursor configuration directory not found.
```

---

## 12. Loading States

Use spinner for:
- Scanning directories
- Reading configs
- Parsing configs
- AI mapping
- Writing files
- Backups

Example spinner text:
```
Analyzing source configuration...
Mapping agents...
Generating target configuration...
Scanning ~/.claude...
```

