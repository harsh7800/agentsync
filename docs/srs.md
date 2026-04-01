# AgentSync CLI

## Software Requirements Specification

**Version 2.0 | April 2026**

**Status: Draft**

| Field | Details |
| --- | --- |
| Project Name | AgentSync CLI |
| Document Type | Software Requirements Specification (SRS) |
| Version | 2.0 |
| Language / Runtime | Node.js / TypeScript |
| Target Tools (v1) | Claude Code, Gemini CLI, GitHub Copilot CLI, OpenCode, Cursor |
| Author | Internal Engineering Team |
| Date | April 2026 |

---

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for AgentSync CLI — an **AI-assisted terminal environment** that migrates AI agent configurations between popular AI development tools. It serves as the single source of truth for design, development, and testing decisions throughout the project lifecycle.

### 1.2 Problem Statement

Development teams adopting AI-first workflows face a critical friction point: each AI CLI tool stores its configuration in incompatible formats. When switching tools, developers must manually recreate configurations. AgentSync solves this by providing:

1. **Automated migration** between tool formats
2. **Agent Mode** — An interactive terminal environment for managing AI configurations
3. **AI-assisted mapping** for complex transformations

### 1.3 Scope

**AgentSync CLI v2 will:**

- Support bidirectional migration between all five target tools
- Provide **Agent Mode** — A persistent REPL with slash commands
- Migrate MCP configurations, custom agents/skills, and API keys (masked)
- Maintain session state across interactions
- Run entirely locally — no data leaves the machine without explicit opt-in
- Be built in TypeScript for Node.js
- Ship as an open source CLI

**Out of scope for v2:**

- Cloud sync or team sharing features
- Non-CLI AI tools (e.g., web-based IDEs)
- Automated schema update via documentation scraping (planned for v3)

---

## 2. Product Modes

### 2.1 Agent Mode (REPL) ⭐ PRIMARY

The default mode when running `agentsync` without arguments.

**Characteristics:**
- Persistent interactive session (REPL-style)
- Slash commands (/scan, /migrate, /status, /help, /exit)
- Session state maintained across commands
- Live UI with spinners and progress updates
- Structured scan results
- Step-by-step guided workflows

**Example Session:**
```bash
$ agentsync

AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> /scan
Where would you like to scan?
1. Current directory
2. Entire system
3. Custom path

> 2

Scanning directories...
✔ Found Claude Code config
✔ Found OpenCode agents
✔ Found 3 agents, 12 skills

Scan Complete. Would you like to migrate? (Yes/No)
> Yes

Select target tool:
1. Claude Code
2. OpenCode
...
```

### 2.2 Command Mode

Traditional one-shot CLI commands for scripting and automation.

```bash
agentsync migrate --from claude --to cursor
agentsync detect
agentsync rollback cursor
```

---

## 3. Functional Requirements

### 3.1 Agent Mode Core

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| AGENT-01 | REPL Loop | CLI enters persistent REPL when run without arguments | High |
| AGENT-02 | Slash Commands | All commands use / prefix (/scan, /migrate, /status, /help, /exit) | High |
| AGENT-03 | Session State | Maintain state across commands (scanned tools, agents, MCPs) | High |
| AGENT-04 | Command Registry | Pluggable command system for adding new slash commands | Medium |
| AGENT-05 | Graceful Exit | /exit command cleanly shuts down, preserving state | Medium |

### 3.2 Scan Command

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| SCAN-01 | Scope Selection | User chooses: Current directory, Entire system, or Custom path | High |
| SCAN-02 | Live UI | Show spinner with dynamic messages during scan | High |
| SCAN-03 | Progress Updates | Display incremental results as tools are found | High |
| SCAN-04 | Structured Summary | Show formatted summary: tools, agents count, skills count, MCPs, paths | High |
| SCAN-05 | Migration Prompt | After scan, prompt user to start migration workflow | High |
| SCAN-06 | Session Storage | Store scan results in session for subsequent commands | High |

### 3.3 Slash Command System

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| CMD-01 | /help Command | Display available commands and usage hints | High |
| CMD-02 | /scan Command | Start scanning workflow with scope selection | High |
| CMD-03 | /migrate Command | Start migration workflow (uses session state if available) | High |
| CMD-04 | /detect Command | Detect installed tools without full scan | Medium |
| CMD-05 | /status Command | Display current session state | High |
| CMD-06 | /exit Command | Exit Agent Mode cleanly | High |
| CMD-07 | /clear Command | Clear terminal screen | Low |

### 3.4 Session State Management

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| STATE-01 | State Persistence | Maintain state for duration of Agent Mode session | High |
| STATE-02 | State Contents | Store: scannedTools, detectedAgents, detectedSkills, detectedMCPs, scanPaths, selectedTargetTool | High |
| STATE-03 | State Access | /status command displays all session data | High |
| STATE-04 | State Reset | New /scan clears previous session state | Medium |

### 3.5 Core Migration (Existing)

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| MIG-01 | Tool Detection | CLI auto-detects installed AI tools | High |
| MIG-02 | Migration Wizard | Interactive prompt for source/target selection | High |
| MIG-03 | MCP Config Migration | Parse and translate MCP server definitions | High |
| MIG-04 | Agent / Skill Migration | Map agents and skills to target format | High |
| MIG-05 | API Key Masking | Mask sensitive API keys in output | High |
| MIG-06 | Dry Run Mode | --dry-run shows what would change | High |
| MIG-07 | Backup Before Write | Auto-backup target config before overwrite | High |

### 3.6 Security

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| SEC-01 | Local-Only by Default | No network requests during migration | High |
| SEC-02 | Permission Prompt | Request explicit user confirmation before filesystem scan | High |
| SEC-03 | Key Masking Enforcement | API keys never written in plain text | High |

---

## 4. UI/UX Requirements

### 4.1 Entry Experience

```
AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

>
```

### 4.2 Scanning Experience

Live updates with spinner:
```
Scanning ~/.claude...           [spinner]
✔ Found Claude Code config
Scanning ~/.config/opencode...  [spinner]
✔ Found OpenCode agents
Analyzing files...              [spinner]
✔ Found 3 agents, 12 skills
```

### 4.3 Summary Display

```
═══════════════════════════════════
         SCAN COMPLETE
═══════════════════════════════════

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

Locations:
  ~/.claude/
  ~/.config/opencode/
```

---

## 5. CLI Interface Requirements

### 5.1 Agent Mode Commands

| Command | Description |
|---------|-------------|
| `/` or `/help` | Show available commands |
| `/scan` | Scan for agents and tools |
| `/migrate` | Start migration workflow |
| `/detect` | Detect installed tools |
| `/status` | Show current session state |
| `/clear` | Clear screen |
| `/exit` | Exit Agent Mode |

### 5.2 Command Mode

```bash
# Migration
agentsync migrate --from <source> --to <target> [--dry-run]

# Detection
agentsync detect
agentsync list-tools

# Rollback
agentsync rollback <tool>

# Schema management
agentsync update-schemas

# Legacy interactive mode (deprecated)
agentsync --legacy-interactive
```

---

## 6. Non-Functional Requirements

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| NFR-01 | Performance | REPL responds to commands in < 100ms | High |
| NFR-02 | Reliability | No partial writes — atomic migration | High |
| NFR-03 | Cross-Platform | Supports macOS, Linux, Windows (WSL) | High |
| NFR-04 | Testability | All transformation logic is pure functions | High |
| NFR-05 | Extensibility | New tools via schema + adapter | Medium |
| NFR-06 | Offline Operation | Works without internet | High |

---

## 7. Architecture

### 7.1 Agent Mode Architecture

```
┌─────────────────────────────────────────┐
│           Agent Loop (REPL)              │
│  ┌─────────────────────────────────────┐ │
│  │ Input → Parse → Route → Execute    │ │
│  └─────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Slash Command Registry          │
│  /scan → scanHandler                    │
│  /migrate → migrateHandler              │
│  /status → statusHandler                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Session State Manager           │
│  scannedTools, agents, skills, MCPs     │
└─────────────────────────────────────────┘
```

### 7.2 Migration Pipeline (Unchanged)

```
Source Config → Parser → Common Schema → AI Mapping → 
Adapter → Key Masking → File Writer → Target Config
```

---

## 8. File Structure

```
packages/cli/
├── src/
│   ├── index.ts                    # Entry point
│   ├── interactive/
│   │   ├── agent-loop.ts          # REPL loop
│   │   ├── command-registry.ts    # Slash command registry
│   │   ├── session-state.ts       # Session state manager
│   │   └── commands/
│   │       ├── scan.ts            # /scan command
│   │       ├── migrate.ts         # /migrate command
│   │       ├── status.ts          # /status command
│   │       ├── help.ts            # /help command
│   │       └── exit.ts            # /exit command
│   ├── ui/
│   │   ├── scanner-ui.ts          # Scanning UI with ora
│   │   ├── banner.ts              # Entry banner
│   │   └── summary.ts             # Results summary
│   └── commands/
│       ├── migrate.ts             # Legacy migrate command
│       ├── scan.ts                # Legacy scan command
│       └── interactive.ts         # Legacy interactive command
```

---

## 9. Related Documents

- [Implementation Plan](./implementation-plan.md)
- [Project Context](./project-context.md)
- [CLI Interface](./cli-interface.md)
- [CLI UI & Branding](./cli-ui-branding.md)
- [Migration Flow](./migration-flow.md)
- [Architecture](./architecture.md)
- [Security Model](./security-model.md)

---

*Document End — AgentSync CLI SRS v2.0*
