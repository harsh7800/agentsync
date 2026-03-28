# Architecture — AgentSync CLI

## 1. High Level Architecture

AgentSync CLI is composed of four main layers:

```
CLI Interface Layer
        ↓
Migration Engine
        ↓
Tool-Specific Parsers
        ↓
Schema Registry
```

---

## 2. Parser Architecture

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
├── claude/           # Single-file parser
│   ├── scanner.ts
│   ├── tool.parser.ts
│   └── types.ts
├── opencode/         # Directory-based parser
│   ├── scanner.ts
│   ├── tool.parser.ts
│   ├── types.ts
│   └── parsers/     # Individual file parsers
│       ├── agent.parser.ts
│       ├── skill.parser.ts
│       ├── mcp.parser.ts
│       └── config.parser.ts
└── registry/         # Tool path registry
    └── tool-paths.registry.ts
```

---

## 3. Migration Flow

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

## 4. Migration Engine Components

| Component    | Responsibility              |
| ------------ | --------------------------- |
| Tool Path Registry | Resolve tool paths      |
| Tool Parser  | Parse tool-specific configs  |
| Scanner     | Scan directory structures     |
| AI Mapper   | AI-assisted mapping          |
| Translator  | Bidirectional transform      |
| Masker      | Mask API keys               |
| Writer      | Write configs               |
| Backup      | Backup configs              |
| Report      | Migration report            |

---

## 5. Monorepo Architecture

```
agentsync/
  packages/
    core/         # Parsers, translators, AI mapping
    cli/          # Commands, interactive UI
    schemas/      # Tool schemas
    e2e/          # End-to-end tests
```

---

## 6. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Directory-based parsers | Tools like OpenCode use multi-file structures |
| Tool Path Registry | Centralized path resolution for all tools |
| Tool-specific parsers | Each tool parses its own structure |
| Adapter pattern | Adding new tool = new parser directory |
| Atomic writes with backup | Prevents partial migration |
| AI Mapping Engine | Intelligent field mapping with confidence scores |
