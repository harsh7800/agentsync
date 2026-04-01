# Architecture — AgentSync CLI

## 1. High Level Architecture

AgentSync CLI is composed of five main layers:

```
┌─────────────────────────────────────────┐
│         Agent Mode (REPL Layer)          │ ⭐ NEW
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  /scan   │ │ /migrate │ │ /status  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ │
└───────┼────────────┼────────────┼───────┘
        │            │            │
        └────────────┴────────────┘
                     │
┌────────────────────▼────────────────────┐
│        CLI Interface Layer               │
│   Commands, Legacy Interactive UI        │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│         Migration Engine                 │
│   Parsers, Translators, AI Mapping       │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│      Tool-Specific Parsers               │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│        Schema Registry                   │
└─────────────────────────────────────────┘
```

---

## 2. Agent Mode Architecture ⭐ NEW

### 2.1 Component Diagram

```
┌─────────────────────────────────────────┐
│           Agent Loop (REPL)              │
│  ┌─────────────────────────────────────┐│
│  │ while (running) {                   ││
│  │   input = await readLine();         ││
│  │   if (input.startsWith('/')) {      ││
│  │     command = registry.parse(input);││
│  │     result = await command.execute();││
│  │     updateSession(result);          ││
│  │   }                                 ││
│  │ }                                   ││
│  └─────────────────────────────────────┘│
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Slash Command Registry             │
│  ┌───────────────────────────────────┐  │
│  │ "/scan"    → scanCommand          │  │
│  │ "/migrate" → migrateCommand       │  │
│  │ "/status"  → statusCommand        │  │
│  │ "/help"    → helpCommand          │  │
│  │ "/exit"    → exitCommand          │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Session State Manager              │
│  ┌───────────────────────────────────┐  │
│  │ scannedTools: string[]            │  │
│  │ detectedAgents: Agent[]           │  │
│  │ detectedSkills: Skill[]           │  │
│  │ detectedMCPs: MCPServer[]         │  │
│  │ scanPaths: string[]               │  │
│  │ selectedTargetTool: string | null │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 File Structure

```
packages/cli/interactive/
├── agent-loop.ts              # Main REPL loop
├── command-registry.ts        # Command registration & routing
├── session-state.ts           # Session state management
└── commands/
    ├── scan.ts               # /scan command
    ├── migrate.ts            # /migrate command
    ├── status.ts             # /status command
    ├── help.ts               # /help command
    ├── exit.ts               # /exit command
    └── detect.ts             # /detect command
```

### 2.3 Agent Loop Flow

```
User Input: /scan
    ↓
Parse Command → "scan"
    ↓
Lookup Handler in Registry
    ↓
Execute scanCommand.execute()
    ↓
  - Show scope prompt
    ↓
  - Scan with UI updates
    ↓
  - Show results summary
    ↓
  - Prompt for migration
    ↓
Update Session State
    ↓
Return to REPL
```

### 2.4 Session State Flow

```
Initial State
    ↓
/scan → Update scannedTools, agents, skills, MCPs, paths
    ↓
/status → Read from session state
    ↓
/migrate → Read from session state
    ↓
/exit → Discard state (or save to temp file for resume)
```

---

## 3. Parser Architecture

AgentSync supports two types of tools:

### Single-File Tools (Claude, Cursor, Copilot)
```
~/.config/claude/settings.json
└── One file with all config (mcpServers, agents)
```

### Directory-Based Tools (OpenCode, Gemini)
```
~/.config/opencode/
├── config.json, mcp.json, opencode.json
├── agents/
│   ├── agent-name/agent.md
│   └── ...
└── skills/
    ├── skill-name/skill.md
    └── ...
```

Each tool has its own parser directory:
```
packages/core/src/parsers/
├── claude/                    # Single-file parser (NEW)
│   ├── scanner.ts
│   ├── tool.parser.ts
│   ├── types.ts
│   ├── adapter.ts             # Common Schema adapter
│   └── normalizer.ts          # Common Schema normalizer
│   └── parsers/
│       ├── agent.parser.ts
│       ├── mcp.parser.ts
│       └── config.parser.ts
├── opencode/                  # Directory-based parser (NEW)
│   ├── scanner.ts
│   ├── tool.parser.ts
│   ├── types.ts
│   ├── adapter.ts             # Common Schema adapter
│   ├── normalizer.ts          # Common Schema normalizer
│   └── parsers/              # Individual file parsers
│       ├── agent.parser.ts
│       ├── skill.parser.ts
│       ├── mcp.parser.ts
│       └── config.parser.ts
├── cursor/                    # Cursor parser (NEW)
│   ├── parser.ts
│   └── types.ts
├── gemini/                    # Gemini parser (NEW)
│   ├── parser.ts
│   └── types.ts
├── opencode-directory-scanner/# Legacy scanner (DEPRECATED)
│   └── opencode-agent-parser.ts
├── claude.parser.ts          # Legacy parser (DEPRECATED)
├── opencode.parser.ts        # Legacy parser (DEPRECATED)
├── cursor.parser.ts          # Legacy parser (DEPRECATED)
├── gemini.parser.ts          # Legacy parser (DEPRECATED)
└── registry/                 # Tool path registry
    └── tool-paths.registry.ts
```

### Parser Architecture Notes

**New Architecture (v1.1.0+):**
- Tool-specific directories (`claude/`, `opencode/`, `cursor/`, `gemini/`)
- Common Schema support via adapters and normalizers
- Modular design with separate scanners, parsers, and types

**Legacy Architecture (v1.0.x):**
- Root-level parser files (DEPRECATED)
- Will be removed in v2.0.0
- Currently maintained for backward compatibility

**Migration Path:**
- Use new tool-specific parsers for new development
- Legacy parsers redirect to new parsers internally
- All new features implemented in new architecture only

---

## 4. Migration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Layer                                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ migrate  │  │ scan --ai    │  │ interactive              │   │
│  └────┬─────┘  └──────┬───────┘  └────────────┬─────────────┘   │
└───────┼────────────────┼─────────────────────┼─────────────────┘
        │                │                     │
        ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Path Registry                            │
│  Resolves: global path vs project path, tool structure type      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tool-Specific Parser                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ OpenCodeToolParser  │  ClaudeToolParser  │  Future...    │ │
│  │ ┌─────────────────┐ │ ┌─────────────────┐ │               │ │
│  │ │ DirectoryScanner│ │ │  SingleScanner │ │               │ │
│  │ └─────────────────┘ │ └─────────────────┘ │               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Model (Common Format)                    │
│  { tool, mcpServers[], agents[], skills[], settings }          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Mapping Engine                           │
│  Similarity scoring, field matching, conflict resolution          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Translator Layer                            │
│  ClaudeToOpenCodeTranslator  │  OpenCodeToClaudeTranslator      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mask Keys + Write                             │
│  API key masking, backup, atomic write                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Migration Engine Components

| Component | Responsibility |
| --------- | -------------- |
| **Agent Loop** | REPL for interactive mode ⭐ NEW |
| **Command Registry** | Slash command routing ⭐ NEW |
| **Session State** | Maintains scan/migration state ⭐ NEW |
| Tool Path Registry | Resolve tool paths |
| Tool Parser | Parse tool-specific configs |
| Scanner | Scan directory structures |
| AI Mapper | AI-assisted mapping |
| Translator | Bidirectional transform |
| Masker | Mask API keys |
| Writer | Write configs |
| Backup | Backup configs |
| Report | Migration report |

---

## 6. Monorepo Architecture

```
agentsync/
  packages/
    core/         # Parsers, translators, AI mapping
    cli/          # Commands, interactive UI, Agent Mode ⭐
    schemas/      # Tool schemas
    e2e/          # End-to-end tests
```

---

## 7. UI Components Architecture ⭐ NEW

### 7.1 Scanner UI

```
packages/cli/ui/scanner-ui.ts

┌─────────────────────────────────────┐
│  ScannerUI                          │
│  ┌───────────────────────────────┐  │
│  │ start(message: string)        │  │
│  │ update(message: string)       │  │
│  │ succeed(message: string)      │  │
│  │ fail(message: string)         │  │
│  │ stop()                        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 7.2 Summary UI

```
packages/cli/ui/summary.ts

┌─────────────────────────────────────┐
│  SummaryUI                          │
│  ┌───────────────────────────────┐  │
│  │ showScanResults(results)      │  │
│  │ showSessionStatus(session)    │  │
│  │ showMigrationSummary(result)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 8. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Agent Mode REPL** | Provides AI terminal experience like Claude Code ⭐ NEW |
| **Slash Commands** | Clear, discoverable command interface ⭐ NEW |
| **Session State** | Enables multi-step workflows without rescanning ⭐ NEW |
| Directory-based parsers | Tools like OpenCode use multi-file structures |
| Tool Path Registry | Centralized path resolution for all tools |
| Tool-specific parsers | Each tool parses its own structure |
| Adapter pattern | Adding new tool = new parser directory |
| Atomic writes with backup | Prevents partial migration |
| AI Mapping Engine | Intelligent field mapping with confidence scores |

---

## 9. Data Flow: Agent Mode Scan → Migrate

```
User: /scan
    ↓
Agent Loop
    ↓
scanCommand.execute()
    ↓
  - Prompt: Scope (current/system/custom)
    ↓
  - Scanner.scan(scope)
    ↓
  - scanner-ui.start()
    ↓
  - For each path:
    - scanner-ui.update("Scanning ~/.claude...")
    - Parse tool configs
    - scanner-ui.succeed("Found Claude Code")
    ↓
  - summary.showScanResults()
    ↓
  - Prompt: Migrate now?
    ↓
sessionState.update(results)
    ↓
Return to Agent Loop

User: /migrate
    ↓
migrateCommand.execute()
    ↓
  - Check sessionState.agents
    ↓
  - Prompt: Select target tool
    ↓
  - Run migration engine
    ↓
  - Show migration summary
```

