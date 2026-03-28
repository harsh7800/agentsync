# AgentSync CLI

## Software Requirements Specification

**Version 1.0 | March 2026**

**Status: Draft**

| Field | Details |
| --- | --- |
| Project Name | AgentSync CLI |
| Document Type | Software Requirements Specification (SRS) |
| Version | 1.0 |
| Language / Runtime | Node.js / TypeScript |
| Target Tools (v1) | Claude Code, Gemini CLI, GitHub Copilot CLI, OpenCode, Cursor |
| Author | Internal Engineering Team |
| Date | March 2026 |

---

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for AgentSync CLI — an AI-assisted command-line tool that migrates AI agent configurations, MCP (Model Context Protocol) server definitions, custom skills, and masked API credentials between popular AI development tools. It serves as the single source of truth for design, development, and testing decisions throughout the project lifecycle.

### 1.2 Problem Statement

Development teams adopting AI-first and TDD workflows face a critical friction point: each AI CLI tool (Claude Code, Gemini CLI, GitHub Copilot CLI, OpenCode, Cursor) stores its configuration in incompatible formats and locations. When a developer switches tools or a team standardizes on a new platform, they must manually recreate:

- MCP server definitions and connection parameters
- Custom agents and skill configurations
- API keys and credentials (with risk of accidental exposure)
- Tool-specific prompts and context files

This manual process is error-prone, time-consuming, and creates inconsistency across team members — directly undermining the productivity goals of an AI-first engineering culture.

### 1.3 Scope

**AgentSync CLI v1 will:**

- Support bidirectional migration between all five target tools
- Migrate MCP configurations, custom agents/skills, and API keys (masked)
- Run entirely locally — no data leaves the machine without explicit opt-in
- Be built in TypeScript for Node.js
- Ship as an open source CLI with potential future SaaS team-sync capability
- Support both command mode and AI-assisted interactive mode

**Out of scope for v1:**

- Cloud sync or team sharing features
- Non-CLI AI tools (e.g., web-based IDEs)
- Automated schema update via documentation scraping (planned for v2)

### 1.4 Definitions

| Term | Definition |
| --- | --- |
| MCP | Model Context Protocol — a standard for connecting AI agents to external tools and data sources |
| Agent | A configured AI persona or workflow with specific instructions and tool access |
| Skill | A reusable capability module attachable to an agent |
| Schema Registry | A versioned store of config format definitions per tool per version |
| Masked Key | An API key stored with sensitive characters replaced, preserving structure for validation |
| Migration | The act of translating config from one tool's format to another's equivalent format |
| AI Mapping | AI-assisted transformation of configurations that cannot be mapped deterministically |

---

## 2. Overall Description

### 2.1 Product Perspective

AgentSync CLI operates as a standalone developer tool installed via npm. It reads configuration files from the source AI tool's known locations on the local filesystem, transforms them through a versioned schema registry, and writes the translated output to the target tool's expected locations. The tool does not require network access for core migration operations.

The tool uses an AI-assisted mapping engine to handle configuration transformations that cannot be done deterministically, following the architecture pipeline defined in [Project Context](./project-context.md).

### 2.2 Target Users

- Individual developers switching between AI CLI tools
- Engineering teams standardizing their AI workflow stack
- DevOps engineers automating developer environment provisioning
- Onboarding engineers setting up new team members in an AI-first workflow

### 2.3 Supported Tool Matrix (v1)

| Tool | Config Location | MCP Support | Agents/Skills | API Keys |
| --- | --- | --- | --- | --- |
| Claude Code | ~/.claude/ | Yes | Yes (.md skills) | Yes (.env) |
| Gemini CLI | ~/.gemini/ | Yes | Partial | Yes |
| GitHub Copilot CLI | ~/.config/gh-copilot/ | Partial | No (v1) | Yes |
| OpenCode | ~/.opencode/ | Yes | Yes | Yes |
| Cursor | ~/.cursor/ | Yes | Yes (.cursorrules) | Yes |

---

## 3. Functional Requirements

### 3.1 Core Migration

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| FR-01 | Tool Detection | CLI auto-detects installed AI tools by scanning known config paths and reports what it finds before migration | High |
| FR-02 | Migration Wizard | Interactive prompt: select source tool, target tool, and which config types to migrate (MCP / agents / keys) | High |
| FR-03 | MCP Config Migration | Parse and translate MCP server definitions from source format to target format using schema registry | High |
| FR-04 | Agent / Skill Migration | Map custom agents and skill files to their nearest equivalent in the target tool's format | High |
| FR-05 | API Key Masking | Copy API key entries with sensitive characters replaced (e.g. sk-***...***) and warn user to re-enter real values | High |
| FR-06 | Dry Run Mode | Flag --dry-run shows what would be written without modifying any files | High |
| FR-07 | Backup Before Write | Automatically back up target tool's existing config to ~/.agentsync/backups/ before overwriting | High |
| FR-08 | Rollback | Command agentsync rollback restores the most recent backup for a given target tool | Medium |
| FR-09 | Migration Report | Post-migration summary: items migrated, items skipped, warnings, and keys requiring manual re-entry | Medium |

### 3.2 Schema Registry

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| FR-10 | Local Schema Store | Versioned JSON schemas for each tool's config format stored locally at ~/.agentsync/schemas/ | High |
| FR-11 | Schema Version Lock | Each migration records the schema versions used, enabling reproducibility and rollback | Medium |
| FR-12 | Manual Schema Update | Command agentsync update-schemas checks GitHub releases of supported tools and prompts user to update | Medium |

### 3.3 AI-Assisted Features

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| FR-13 | AI Mapping Engine | Use AI to convert configurations that cannot be mapped deterministically between tools | High |
| FR-14 | Interactive AI Mode | Conversational interface allowing natural language migration commands | Medium |
| FR-15 | AI Command Parsing | Parse natural language commands like "migrate claude to cursor" in interactive mode | Medium |
| FR-16 | AI Isolation | AI mapping operates on data only — no direct file operations by AI | High |

### 3.4 Security

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| FR-17 | Local-Only by Default | No network requests during migration — all operations on local filesystem only | High |
| FR-18 | Permission Prompt | Before scanning, CLI requests explicit user confirmation with a list of directories it will read | High |
| FR-19 | Key Masking Enforcement | API keys are never written in plain text to any output config — always masked | High |
| FR-20 | Backup Encryption (opt-in) | User may opt in to AES-256 encrypted backups via --encrypt-backups flag | Low |

---

## 4. Non-Functional Requirements

| ID | Requirement | Description | Priority |
| --- | --- | --- | --- |
| NFR-01 | Performance | Full migration of all config types completes in under 10 seconds on any modern machine | High |
| NFR-02 | Reliability | No partial writes — migration is atomic; either all target files are written or none | High |
| NFR-03 | Cross-Platform | Supports macOS, Linux, and Windows (WSL) from day one | High |
| NFR-04 | Testability | All transformation logic is pure functions with 100% unit test coverage (TDD) | High |
| NFR-05 | Extensibility | New tool support can be added by adding a schema file and adapter — no core changes needed | Medium |
| NFR-06 | Observability | Verbose mode --verbose logs every read/write operation with file paths and schema versions used | Medium |
| NFR-07 | Offline Operation | Tool must work offline by default; AI mapping uses local models or is disabled when offline | High |

---

## 5. CLI Interface Requirements

### 5.1 Command Mode

The CLI shall support the following commands:

```bash
# Migration commands
agentsync migrate --from <source> --to <target> [--dry-run]
agentsync migrate --from claude --to cursor --dry-run

# Detection and inspection
agentsync detect
agentsync list-tools

# Rollback
agentsync rollback <tool>
agentsync rollback cursor

# Schema management
agentsync update-schemas

# Help
agentsync --help
agentsync migrate --help
```

### 5.2 Interactive Mode (AI-Assisted)

The CLI shall support an interactive mode for AI-assisted operation:

```bash
agentsync
```

Interactive prompt examples:

```
> migrate claude to cursor
> show installed tools
> rollback cursor
> what would migrate from claude to gemini?
> help
> exit
```

Requirements for interactive mode:

| ID | Requirement | Priority |
| --- | --- | --- |
| CLI-01 | Interactive prompt with command history | High |
| CLI-02 | Natural language command parsing | Medium |
| CLI-03 | Context-aware suggestions | Medium |
| CLI-04 | Branded terminal UI with banner | Low |

---

## 6. Constraints & Assumptions

### 6.1 Constraints

- Tool config schemas are subject to change by third-party vendors without notice
- MCP is an evolving protocol; v1 support covers the stable MCP 1.0 spec only
- GitHub Copilot CLI has limited programmatic config access; agent migration is out of scope for v1
- No internet access assumed during migration (air-gapped environments must be supported)
- AI assists migration but does not control file operations (per security principle #7)

### 6.2 Assumptions

- The user has at least one source tool installed and configured before running AgentSync
- Config files follow documented formats; corrupted or manually edited files may fail gracefully with a warning
- Node.js 18+ is available on the target machine
- The user has read/write permissions to their own home directory config files

---

## 7. Risk Register

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Vendor changes config schema breaking migration | High | High | Schema versioning + update-schemas command |
| Big vendor (Anthropic/Google) ships native migration tool | High | Medium | Focus on cross-vendor portability they won't build |
| API key masking insufficient — partial key exposure | High | Low | Regex-based masking with full coverage tests |
| Community fails to maintain open source schemas | Medium | Medium | Build schema auto-detection via AI diff (v2 roadmap) |
| Low adoption outside the team | Medium | Medium | Ship internally first; open source after proven |
| AI mapping produces incorrect configurations | Medium | Medium | Human review step before applying migrations |
| Offline environments cannot use AI features | Low | High | Graceful degradation to deterministic-only mode |

---

## 8. AI-Assisted Architecture

Per the [Project Context](./project-context.md), the system follows a strict separation between AI-assisted mapping and file operations:

### 8.1 Migration Pipeline

```
Source Tool Config
        ↓
      Parser          (pure function)
        ↓
   Common Schema      (versioned internal representation)
        ↓
Deterministic Transform  (pure function)
        ↓
AI Mapping (if needed)   (isolated, operates on data only)
        ↓
      Adapter         (pure function)
        ↓
    Key Masking       (pure function)
        ↓
    File Writer       (CLI layer, no AI involvement)
        ↓
Target Tool Config
```

### 8.2 AI Mapping Engine

The AI Mapping Engine is responsible for:

- Converting tool-specific concepts that have no direct equivalent
- Suggesting alternative configurations when exact mapping is impossible
- Providing explanations for non-deterministic transformations

The AI Mapping Engine is NOT responsible for:

- File system operations
- API key handling
- Backup creation
- Final configuration writes

---

## 9. Related Documents

- [Implementation Plan](./implementation-plan.md)
- [Project Context](./project-context.md)
- [Migration Flow](./migration-flow.md)
- [AI Mapping Engine](./ai-mapping-engine.md)
- [Security Model](./security-model.md)
- [CLI Interface](./cli-interface.md)

---

*Document End — AgentSync CLI SRS v1.0*
