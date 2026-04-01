# Project Context — AgentSync CLI

## 1. Project Overview

AgentSync CLI is an **AI-assisted terminal environment** for managing AI agent configurations across different AI development tools. It migrates AI agent environments between Claude Code, Gemini CLI, Cursor, OpenCode, and GitHub Copilot CLI.

The tool migrates:

* MCP server configurations
* Agents
* Skills
* Prompts
* Context files
* API keys (masked)
* Tool-specific configuration files

AgentSync provides **two distinct experiences**:
1. **Agent Mode** (REPL) — Persistent interactive session with slash commands
2. **Command Mode** — Traditional one-shot CLI commands

---

## 2. Product Philosophy

AgentSync is built on the following principles:

1. **AI Agent Terminal** — Behaves like Claude Code, OpenCode, Cursor Agent
2. **Persistent Sessions** — Maintains state across interactions
3. **Slash Commands** — Intuitive command interface (/scan, /migrate, /status)
4. All migrations must go through a common internal schema
5. No direct tool-to-tool translation
6. Core transformation logic must be pure functions
7. CLI handles filesystem operations only
8. API keys must always be masked before writing
9. Target configs must be backed up before overwrite
10. AI assists migration but does not control file operations
11. Migration must be reproducible and deterministic where possible
12. Schemas must be versioned
13. Tool must work offline by default
14. CLI should have a branded terminal UI and banner
15. **CLI is an environment, not just a tool**

---

## 3. System Mental Model

All migrations follow this pipeline:

```
Source Tool Config
        ↓
      Parser
        ↓
   Common Schema
        ↓
Deterministic Transform
        ↓
AI Mapping (if needed)
        ↓
      Adapter
        ↓
    Key Masking
        ↓
    File Writer
        ↓
Target Tool Config
```

---

## 4. System Components

AgentSync consists of four major components:

### 4.1 Migration Engine

Handles parsing, schema conversion, transformation, adapters, masking, and migration reports.

### 4.2 AI Mapping Engine

Uses AI to convert configurations that cannot be mapped deterministically between tools.

### 4.3 Agent Mode Shell ⭐ NEW

Provides the REPL environment with:
- Slash command system
- Session state management
- Live scanning UI
- Guided workflows

### 4.4 Legacy CLI Interface

Traditional command-line interface for one-shot operations.

---

## 5. CLI Modes

AgentSync CLI supports three modes:

### 5.1 Agent Mode (REPL) ⭐ DEFAULT

```bash
$ agentsync

AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> /scan
> /status
> /migrate
> /exit
```

**Features:**
- Persistent session state
- Slash commands (/scan, /migrate, /status, /help, /exit)
- Live scanning UI with spinners
- Structured scan summaries
- Step-by-step migration prompts

### 5.2 Command Mode (One-Shot)

```bash
agentsync migrate --from claude --to cursor
agentsync rollback cursor
agentsync detect
```

### 5.3 Legacy Interactive Mode (Deprecated)

```bash
agentsync --legacy-interactive
> migrate claude to cursor
```

**Note:** Natural language mode is deprecated in favor of slash commands.

---

## 6. Session State

Agent Mode maintains session state across commands:

```typescript
session = {
  scannedTools: ['claude', 'opencode'],
  detectedAgents: ['backend-agent', 'migration-agent'],
  detectedSkills: [...],
  detectedMCPs: ['filesystem', 'terminal'],
  scanPaths: ['~/.claude/', '~/.config/opencode/'],
  selectedTargetTool: 'opencode',
  scanTimestamp: '2026-04-01T14:32:15Z'
}
```

This enables workflows like:
```
> /scan        # Scan and detect
> /status      # Review what was found
> /migrate     # Migrate detected agents
```

---

## 7. Architecture Goal

The architecture is designed so that:

* Adding a new tool requires only parser + adapter + schema
* Migration engine is fully testable
* AI mapping is optional and isolated
* CLI is separate from core logic
* The system scales to many tools
* Migration remains safe and deterministic
* **Agent Mode provides an AI terminal experience**

---

## 8. What You're Building

AgentSync is evolving into a **serious developer tool** — not just a migration script.

**AgentSync =**
- Migration tool between AI environments
- Agent scanner and discovery
- Config translator with AI assistance
- **Interactive AI CLI environment manager**

Think of it as:
- Like Claude Code, but for managing AI agents across tools
- Like OpenCode's agent mode, but for migrations
- A terminal-based environment for AI configuration management

---

## 9. Design Philosophy

### Traditional CLI vs Agent Mode

| Aspect | Traditional CLI | Agent Mode |
|--------|-----------------|------------|
| Interface | One-shot commands | Persistent REPL |
| Commands | Arguments & flags | Slash commands |
| Output | Static text | Live UI with spinners |
| State | Stateless | Session memory |
| Workflow | Manual steps | Guided flows |
| Experience | Tool | Environment |

### UX Inspiration

Agent Mode takes inspiration from:
- **Claude Code** — Terminal-based AI agent
- **OpenCode** — Interactive agent mode
- **Cursor Agent** — AI-assisted terminal
- **Gemini CLI** — Conversational interface

The goal is to make AgentSync feel like you're inside an AI agent terminal, not just running a utility.

