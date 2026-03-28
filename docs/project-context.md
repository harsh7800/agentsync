# Project Context — AgentSync CLI

## 1. Project Overview

AgentSync CLI is an AI-assisted command-line tool that migrates AI agent environments between different AI development tools such as Claude Code, Gemini CLI, Cursor, OpenCode, and GitHub Copilot CLI.

The tool migrates:

* MCP server configurations
* Agents
* Skills
* Prompts
* Context files
* API keys (masked)
* Tool-specific configuration files

AgentSync uses a schema-based migration engine combined with AI-assisted mapping to translate configurations between tools.

---

## 2. Product Philosophy

AgentSync is built on the following principles:

1. All migrations must go through a common internal schema
2. No direct tool-to-tool translation
3. Core transformation logic must be pure functions
4. CLI handles filesystem operations only
5. API keys must always be masked before writing
6. Target configs must be backed up before overwrite
7. AI assists migration but does not control file operations
8. Migration must be reproducible and deterministic where possible
9. Schemas must be versioned
10. Tool must work offline by default
11. CLI should have a branded terminal UI and banner
12. CLI should support both command mode and AI interactive mode

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

AgentSync consists of three major components:

### 4.1 Migration Engine

Handles parsing, schema conversion, transformation, adapters, masking, and migration reports.

### 4.2 AI Mapping Engine

Uses AI to convert configurations that cannot be mapped deterministically between tools.

### 4.3 CLI Interface

Provides commands, migration wizard, interactive AI command mode, and terminal UI.

---

## 5. CLI Modes

AgentSync CLI supports two modes:

### Command Mode

```
agentsync migrate --from claude --to cursor
agentsync rollback cursor
agentsync detect
```

### Interactive Mode

```
agentsync
> migrate claude to cursor
> show installed tools
> rollback cursor
> help
```

---

## 6. Architecture Goal

The architecture is designed so that:

* Adding a new tool requires only parser + adapter + schema
* Migration engine is fully testable
* AI mapping is optional and isolated
* CLI is separate from core logic
* The system scales to many tools
* Migration remains safe and deterministic
