# AI-Assisted Agent CLI - Implementation Plan

## TDD-First Approach | Version 2.0 | March 2026

| Field | Details |
| --- | --- |
| **Product Name** | AI-Assisted Agent CLI |
| **Methodology** | Test-Driven Development (TDD) — Red, Green, Refactor |
| **Language** | TypeScript (Node.js 18+) |
| **Test Framework** | Vitest |
| **Package Manager** | pnpm |
| **CLI Framework** | Commander.js + Inquirer.js |
| **AI Integration** | Model Context Protocol (MCP) |
| **Sprint Length** | 1 week per sprint |
| **Total Sprints** | 8 Sprints (MVP in 8 weeks) |
| **Target Tools** | Claude Code, OpenCode, Gemini CLI, Cursor, GitHub Copilot CLI |
| **Repo Structure** | Monorepo — packages/core, packages/cli, packages/schemas, packages/e2e |

---

## 📊 Current Status Overview

### CI/CD & Release Status
```
✅ CI Pipeline: PASSING (343/343 tests on Node 18.x, 20.x, 22.x)
✅ Lint: PASSING
✅ npm packages published: @agent-sync/core, @agent-sync/schemas, @agent-sync/cli
✅ GitHub repo: https://github.com/harsh7800/agentsync
✅ CLI installed globally: agentsync --help works
```

### Project Health
```
Sprint 1: [██████████] 100% ✅ COMPLETE (9/9 tasks)
Sprint 2: [██████████] 100% ✅ COMPLETE (10/10 tasks)
Sprint 3: [████████████████████] 100% ✅ COMPLETE (21/21 tasks)
Sprint 4 Phase 1: [██████████] 100% ✅ COMPLETE (18/18 tasks) - Agent Mode REPL
Sprint 4 Phase 1.5: [██████████] 100% ✅ COMPLETE (12/12 tasks) - AI Scanner + OpenCode Fix
Sprint 4 Phase 1.6: [████████░░] 75%  (9/12 tasks) - Modern TUI with Ink (IN PROGRESS)
Sprint 4 Phase 2: [████████░░] 88%  (7/8 tasks) - Gemini/Cursor adapters
Overall:  [█████████████░░░░░░░] 70% (83/134 tasks)
```

### Latest Metrics
- **Total Tests**: 638 ✅ (638 total)
- **Pass Rate**: 100%
- **Coverage**: Core package 95%+, Schemas 88%+, CLI 91%+, E2E 100%
- **npm Packages**: @agent-sync/core@1.0.0, @agent-sync/schemas@1.0.0, @agent-sync/cli@1.0.1
- **Last Updated**: 2026-04-01

### Current Sprint Status
✅ **CI/CD Setup Complete** - Ready for Sprint 4

**Recent Achievements:**
- ✅ GitHub Actions CI pipeline (Node 18.x, 20.x, 22.x)
- ✅ ESLint configuration
- ✅ npm packages published to @agent-sync organization
- ✅ CLI globally installable via `npm install -g @agent-sync/cli`
- ✅ 343 tests passing (100%)
- ✅ Fixed cross-platform temp directory categorization
- ✅ Fixed flaky tests S3-05-005 and S3-05-007

**Next Steps:**
1. Sprint 4: Add Gemini CLI and Cursor adapters
2. Cross-tool migration matrix testing

**Sprint 2 Achievements (100% Complete):**
- ✅ Claude → OpenCode translator (11 tests)
- ✅ OpenCode → Claude translator (12 tests)
- ✅ Bidirectional agent/skill migration
- ✅ File operations with atomic writes (13 tests)
- ✅ Auto-backup with timestamps
- ✅ Integration tests for migration workflow
- ✅ CLI migrate command with --from, --to, --dry-run
- ✅ E2E migration tests with real fixtures (12 tests)
- ✅ Interactive CLI mode with inquirer.js (3 tests)
- ✅ Schema Registry with versioned schemas (21 tests)

**Sprint 1 (Complete):**
- ✅ Monorepo scaffold, CI pipeline
- ✅ Claude & OpenCode parsers (100% coverage)
- ✅ API key masking (100% coverage)
- ✅ Fixture files

**Total Tests:** 343 passing (343 total)
**Coverage:** Core 95%+, CLI 91%+, Schemas 88%+, E2E 100%

**Next:** S4-19 - Gemini CLI adapter

---

## Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [UI Flow](./ui-flow.md) | Complete user interface flow (current + planned Ink TUI) |
| [OpenCode Structure](./tool-structure-opencode.md) | OpenCode directory/file structure reference |

---

## 8. Quick Reference for Agent Queries

### When user asks "Where am I standing right now?"

**Current Status:**
- 📊 **Overall Progress**: 52% (70/134 tasks complete)
- 🔄 **Current Sprint**: Sprint 4 Phase 2 - Tool Support Expansion
- ✅ **Just Completed**: 
  - Phase 1: Agent Mode REPL (18/18 tasks)
  - Phase 1.5: AI Scanner + OpenCode Fix (12/12 tasks)
- 🚀 **Starting Next**: S4-19-26 - Gemini/Cursor adapters + Ink TUI planning

### User Interface Status

**Current Implementation (Inquirer-based):**
- ✅ Welcome prompt with guided/manual modes
- ✅ Slash command selector (type "/" for dropdown)
- ✅ Interactive scan with scope selection
- ✅ File browser for custom paths
- ✅ Post-scan action menu
- ✅ Adapter selection for migration
- ⏳ Migration path selection (where to save files) - *To be implemented*
- ⏳ Show exact migrated file paths - *To be implemented*

**Planned Implementation (Ink TUI - Week 6):**
- Full-screen React-based terminal UI
- Visual sidebar navigation
- Modern Cloud/OpenCode aesthetic
- Keyboard shortcuts: `/`, `q`, `esc`, arrows
- Dark, minimal color scheme
- Fallback to inquirer for CI/SSH

See [UI Flow Documentation](./ui-flow.md) for complete specifications.

**Recent Achievements:**
- ✅ Bidirectional translators (Claude ↔ OpenCode) - 23 tests
- ✅ File operations with atomic writes - 13 tests
- ✅ CLI migrate command (--from, --to, --dry-run, --verbose, --interactive)
- ✅ Auto-backup with timestamps
- ✅ Integration tests for migration workflow
- ✅ E2E migration tests (12 tests, all passing)
- ✅ Interactive CLI mode with inquirer.js prompts (3 tests)
- ✅ Schema Registry with 6 versioned schemas (21 tests)
- ✅ 118 total tests passing (100% pass rate)

**Sprint 3 Merged Features:**
- 🆕 Smart Agent Scanner (glob/grep pattern detection)
- 🆕 AI mapping engine with similarity scoring
- 🆕 Interactive AI-assisted mode with intelligent prompts
- 🆕 `agentsync scan` command for autonomous discovery
- 🆕 `--ai-assist` flag with smart suggestions

**Immediate Next Steps:**
1. 🧪 **S3-01**: Write tests for Smart Agent Scanner
2. 🔍 Implement pattern-based agent detection
3. 🤖 Build AI-assisted mapping engine

**Current Blockers:**
- None! Ready to start Sprint 3 implementation.

---

## 1. TDD Approach & Principles

Every feature in AI-Assisted Agent CLI will follow the strict TDD cycle: write a failing test first (Red), implement the minimum code to pass it (Green), then refactor without breaking tests (Refactor). No production code is written without a corresponding test.

### 1.1 TDD Cycle Per Feature

1. **Write a failing unit test** that describes the expected behaviour
2. **Run the test suite** — confirm it fails (Red)
3. **Write the minimum implementation** to make the test pass
4. **Run the test suite** — confirm it passes (Green)
5. **Refactor the implementation** while keeping tests green
6. **Commit only when all tests pass**

### 1.2 Coverage Targets

| Layer | Coverage Target | Test Type |
|-------|----------------|-----------|
| Schema parsers (per tool) | 100% | Unit |
| Config transformation / translation | 100% | Unit |
| API key masking | 100% | Unit |
| File read / write operations | 90% | Unit + Integration |
| CLI command handlers | 85% | Integration |
| End-to-end migration flow | Key happy paths | E2E |
| AI-assisted mapping engine | 90% | Unit |
| MCP server integration | 85% | Integration |

---

## 2. Architecture Overview

### 2.1 Monorepo Structure

```
ai-assisted-agent-cli/
├── packages/
│   ├── core/              # Pure transformation logic
│   │   ├── parsers/       # Tool-specific parsers (directory-based)
│   │   │   ├── claude/    # Claude parser (single-file config)
│   │   │   ├── opencode/  # OpenCode parser (directory-based)
│   │   │   ├── gemini/    # Gemini CLI parser (future)
│   │   │   └── cursor/   # Cursor parser (future)
│   │   ├── translators/   # Bidirectional translators
│   │   ├── masking/       # API key masking logic
│   │   ├── ai-mapping/    # AI-assisted field mapping engine
│   │   ├── ai-scanner/    # Smart agent scanner
│   │   └── registry/      # Tool path registry
│   ├── cli/               # CLI entry point & interactive layer
│   │   ├── commands/      # CLI command implementations
│   │   ├── prompts/       # Interactive prompts (Inquirer.js)
│   │   ├── ui/            # Terminal UI components
│   │   └── interactive/   # Interactive components
│   ├── schemas/           # Versioned JSON schema definitions
│   │   ├── claude/        # Claude Code schemas
│   │   ├── opencode/      # OpenCode schemas
│   │   ├── gemini/        # Gemini CLI schemas
│   │   ├── cursor/        # Cursor schemas
│   │   └── copilot/       # GitHub Copilot CLI schemas
│   └── e2e/               # End-to-end tests with real fixtures
├── docs/                  # Documentation
│   ├── implementation-plan.md
│   ├── srs.md
│   ├── architecture.md
│   └── ...
└── .github/workflows/     # CI pipeline
```

### 2.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Directory-based parsers | Tools like OpenCode use multi-file structures |
| Tool Path Registry | Centralized tool path resolution (global vs project) |
| Tool-specific scanner modules | Each tool parses its own directory structure |
| Adapter pattern per tool | Adding new tool = new parser directory, zero core changes |
| Atomic writes with backup | Prevents partial migration leaving config in broken state |
| Inquirer.js for prompts | Battle-tested interactive CLI with good test support |
| MCP (Model Context Protocol) | Standardized AI agent communication |
| Vitest as test runner | Fast, TypeScript-native, compatible with Node.js 18+ |

---

## 3. Sprint Plan

Each sprint is one week. Sprints follow strict TDD — every task begins with writing tests.

---

## Sprint 1 — Foundation & Core Engine (Week 1)

**Goal**: Repo setup + Claude Code & OpenCode parsers + key masker working under TDD

| # | Task | Type | Status |
|---|------|------|--------|
| S1-01 | Monorepo scaffold: pnpm workspaces, TypeScript config, Vitest setup | Setup | [x] |
| S1-02 | CI pipeline: GitHub Actions running tests on every push | Setup | [x] |
| S1-03 | [TEST FIRST] Write unit tests for Claude Code MCP schema parser | TDD | [x] |
| S1-04 | Implement Claude Code MCP schema parser to pass S1-03 tests | Core | [x] |
| S1-05 | [TEST FIRST] Write unit tests for API key masking function | TDD | [x] |
| S1-06 | Implement API key masking (regex-based, all key formats) | Core | [x] |
| S1-07 | [TEST FIRST] Write unit tests for OpenCode MCP schema parser | TDD | [x] |
| S1-08 | Implement OpenCode MCP schema parser to pass S1-07 tests | Core | [x] |
| S1-09 | Create fixture config files for Claude Code and OpenCode (test data) | Testing | [x] |

**Sprint 1 Definition of Done:**
- [x] All 9 tasks completed
- [x] 74 tests passing
- [x] Core package 100% coverage
- [x] CI pipeline running on every push

---

## Sprint 2 — First Working Migration (Week 2)

**Goal**: Claude Code ↔ OpenCode migration working end to end

| # | Task | Type | Status |
|---|------|------|--------|
| S2-01 | [TEST FIRST] Write unit tests for Claude Code → OpenCode MCP translator | TDD | [x] |
| S2-02 | Implement Claude Code → OpenCode MCP translator | Core | [x] |
| S2-03 | [TEST FIRST] Write unit tests for OpenCode → Claude Code translator | TDD | [x] |
| S2-04 | Implement OpenCode → Claude Code translator | Core | [x] |
| S2-05 | [TEST FIRST] Write integration tests for file read/backup/write operations | TDD | [x] |
| S2-06 | Implement atomic file writer with auto-backup to ~/.agentsync/backups/ | CLI | [x] |
| S2-07 | Build basic CLI scaffold: `agentsync migrate --from --to --dry-run` | CLI | [x] |
| S2-08 | E2E test: full Claude Code → OpenCode migration with real fixture files | E2E | [x] |
| S2-09 | Internal demo prep — working migration demo for the team | Demo | [x] |
| S2-10 | **NEW**: Implement interactive CLI mode with inquirer.js prompts | CLI | [x] |

**Sprint 2 Definition of Done:**
- [x] All 10 tasks completed
- [x] Bidirectional Claude ↔ OpenCode migration works
- [x] CLI with all basic options functional
- [x] E2E tests passing
- [x] Demo ready for team
- [x] Interactive mode with prompts

---

## Sprint 3 — AI-Assisted Interactive Migration Engine (Week 3)

**Goal**: Implement intelligent agent detection with manual & AI-assisted scanning modes, AI-powered field mapping, and interactive migration with smart suggestions

**Two Scanning Modes:**

### Mode 1: Manual Scan (User-Controlled)
- User specifies scan scope (current directory vs system-wide)
- User controls scan depth and file patterns
- User reviews and selects found agents manually
- **Command**: `agentsync scan --manual` or interactive prompt

### Mode 2: AI-Assisted Scan (Autonomous Agent Mode)
- Tool autonomously scans with intelligent pattern matching (glob/grep)
- AI analyzes file contents to identify agent types
- AI suggests migrations based on detected patterns
- User confirms or overrides AI suggestions
- **Command**: `agentsync scan --ai` or `--ai-assist` flag

**Key Features:**
1. **Smart Agent Scanner** - Pattern-based detection using glob/grep (local vs system)
2. **AI-Assisted Mapping Engine** - Field similarity scoring and intelligent suggestions
3. **Interactive AI Mode** - Guided migration with intelligent prompts
4. **User Choice** - Ask user which scanning mode to use on startup

| # | Task | Type | Status |
|---|------|------|--------|
| **PHASE 1: Smart Agent Scanner** |
| S3-01 | [TEST FIRST] Write tests for Smart Agent Scanner (glob patterns) | TDD | [x] |
| S3-02 | Implement Smart Agent Scanner with local/system categorization | Core | [x] |
| S3-03 | [TEST FIRST] Write tests for Manual Scan mode (user-controlled) | TDD | [x] |
| S3-04 | Implement Manual Scan mode with user-specified scope & depth | CLI | [x] |
| S3-05 | [TEST FIRST] Write tests for AI-Assisted Scan mode (autonomous) | TDD | [x] |
| S3-06 | Implement AI-Assisted Scan with intelligent pattern matching (glob/grep) | CLI | [x] |
| **PHASE 2: AI Mapping Engine** |
| S3-07 | [TEST FIRST] Write tests for AI mapping engine core logic | TDD | [x] |
| S3-08 | Implement AI mapping engine with similarity scoring | Core | [x] |
| S3-09 | [TEST FIRST] Write tests for field suggestion algorithms | TDD | [x] |
| S3-10 | Implement field suggestion based on config patterns | Core | [x] |
| S3-11 | [TEST FIRST] Write tests for conflict resolution strategies | TDD | [x] |
| S3-12 | Implement conflict resolution with user prompts | CLI | [x] |
| **PHASE 3: Interactive AI Mode** |
| S3-13 | [TEST FIRST] Write tests for interactive AI-assisted mapping prompts | TDD | [x] |
| S3-14 | Implement interactive AI-assisted mapping with smart prompts | CLI | [x] |
| S3-15 | Add `agentsync scan` command with mode selection (manual/AI) | CLI | [x] |
| S3-16 | Add `--ai-assist` flag for AI-assisted migration | CLI | [x] |
| S3-17 | Add `--manual` flag for manual mode | CLI | [x] |
| **PHASE 4: Testing & Docs** |
| S3-18 | E2E test: Full AI-assisted migration flow | E2E | [x] |
| S3-19 | E2E test: Manual scan mode flow | E2E | [x] |
| S3-20 | E2E test: Smart Agent Scanner with both modes | E2E | [x] |
| S3-21 | Documentation: AI-assisted interactive migration guide | Docs | [x] |

**Sprint 3 Definition of Done:**
- [x] **PHASE 1 Complete:** Smart Agent Scanner with Manual & AI-Assisted modes
- [x] Local vs System categorization working
- [x] **Manual Scan mode** - User controls scope, depth, and file patterns
- [x] **AI-Assisted Scan mode** - Autonomous intelligent detection via glob/grep
- [ ] User prompted to select scan mode on startup (CLI integration pending)
- [x] **PHASE 2 Complete:** AI Mapping Engine
- [x] Similarity scoring (Levenshtein, Jaro-Winkler, combined)
- [x] Field matching with thresholds
- [x] Conflict detection (one-to-many, many-to-one, type mismatch)
- [x] Resolution strategies (strict, lenient, prompt-user)
- [x] Field suggestion algorithms (pattern-based, semantic, contextual)
- [x] Smart fallbacks and confidence calibration
- [x] **PHASE 3 Complete:** Interactive Conflict Resolution
- [x] Strategy selection (strict, lenient, prompt-user)
- [x] Interactive resolution with user prompts
- [x] Batch resolution for similar conflicts
- [x] Conflict explanation and impact analysis
- [x] Undo/redo support with history
- [x] **PHASE 3 Complete:** Interactive AI-Assisted Mapping
- [x] Smart prompts based on confidence levels
- [x] Batch prompting with grouped suggestions
- [x] Progressive disclosure of field details
- [x] User guidance and validation
- [x] Wizard flow with navigation
- [x] `agentsync scan` command (manual/AI modes)
- [x] `--ai-assist` and `--manual` CLI flags
- [x] **PHASE 4 Complete:** Testing & Documentation
- [x] E2E test: Full AI-assisted migration flow (20 tests)
- [x] E2E test: Manual scan mode flow (20 tests)
- [x] E2E test: Smart Agent Scanner with both modes (25 tests)
- [x] Documentation: AI-assisted interactive migration guide

---

## Sprint 4 — Interactive Agent Mode & Tool Expansion (Week 4)

**Goal**: Transform CLI into an AI agent terminal with slash commands, then add Gemini & Cursor adapters

**Phase 1: Interactive Agent Mode (REPL with Slash Commands)**

The CLI becomes an AI-assisted terminal environment with:
- Persistent interactive loop (REPL-style)
- Slash command system (/scan, /migrate, /help, /exit)
- Session state management
- Real-time scanning UI with spinners
- Structured scan results with migration prompts

| # | Task | Type | Status |
|---|------|------|--------|
| S4-01 | [TEST FIRST] Write tests for Agent Loop REPL system | TDD | [x] |
| S4-02 | Implement Agent Loop (packages/cli/interactive/agent-loop.ts) | CLI | [x] |
| S4-03 | [TEST FIRST] Write tests for Slash Command Registry | TDD | [x] |
| S4-04 | Implement Slash Command Registry with command routing | CLI | [x] |
| S4-05 | [TEST FIRST] Write tests for /scan command handler | TDD | [x] |
| S4-06 | Implement /scan command with scope selection (current dir/system/custom) | CLI | [x] |
| S4-07 | [TEST FIRST] Write tests for Scanner Loading UI | TDD | [x] |
| S4-08 | Implement Scanner Loading UI with ora spinner (packages/cli/ui/scanner-ui.ts) | CLI | [x] |
| S4-09 | [TEST FIRST] Write tests for Scan Results Summary UI | TDD | [x] |
| S4-10 | Implement Scan Results Summary with structured output | CLI | [x] |
| S4-11 | [TEST FIRST] Write tests for Session State Manager | TDD | [x] |
| S4-12 | Implement Session State Manager (scannedTools, detectedAgents, etc.) | CLI | [x] |
| S4-13 | Implement /migrate command with session state integration | CLI | [x] |
| S4-14 | Implement /status command to show current session | CLI | [x] |
| S4-15 | Implement /help command with available commands | CLI | [x] |
| S4-16 | Implement /exit command with graceful shutdown | CLI | [x] |
| S4-17 | Update CLI entry point to enter Agent Loop mode by default | CLI | [x] |
| S4-18 | E2E tests: Full interactive agent mode flow | E2E | [x] |

**Phase 1.5: AI-Powered Scanner with Real-time UI & OpenCode Detection Fix (URGENT)**

**Goal**: Fix false positives in scanning and implement AI-powered detection with proper OpenCode structure recognition

**Problem Identified**: Current scanner returns false positives and doesn't properly detect OpenCode's actual structure:
- Project-level: `./.opencode/agents/*.md` and `./.opencode/skills/**/SKILL.md`
- Global: `~/.config/opencode/opencode.json` with MCP servers
- Agents are Markdown files with YAML frontmatter
- Skills are directories containing `SKILL.md` files

| # | Task | Type | Status |
|---|------|------|--------|
| S4-18A | [TEST FIRST] Write tests for AI-powered scanner with glob/grep | TDD | [x] |
| S4-18B | Implement AI Directory Scanner using glob patterns | Core | [x] |
| S4-18C | Implement AI Content Analyzer for agent/skill validation | Core | [x] |
| S4-18D | Fix OpenCode project-level detection (./.opencode/agents/*.md) | Core | [x] |
| S4-18E | Fix OpenCode global detection (~/.config/opencode/) | Core | [x] |
| S4-18F | Implement proper agent Markdown parser with YAML frontmatter | Core | [x] |
| S4-18G | Implement proper skill directory scanner | Core | [x] |
| S4-18H | Add ora spinner UI with real-time scan progress updates | CLI | [x] |
| S4-18I | Add incremental scan results display ("Found X agents...") | CLI | [x] |
| S4-18J | Implement AI cross-validation to eliminate false positives | Core | [x] |
| S4-18K | E2E tests for AI scanner with actual OpenCode structures | E2E | [x] |
| S4-18L | Documentation: OpenCode structure reference guide | Docs | [x] |

**Phase 1.5 Definition of Done:**
- [x] AI scanner uses glob/grep for directory traversal
- [x] Real-time spinner shows current directory being scanned
- [x] Incremental updates: "Scanning ~/.config/opencode... Found 3 agents"
- [x] OpenCode agents properly detected from `./.opencode/agents/*.md`
- [x] OpenCode skills properly detected from `./.opencode/skills/**/SKILL.md`
- [x] OpenCode MCP servers detected from `~/.config/opencode/opencode.json`
- [x] AI validates found files are legitimate (not false positives)
- [x] Cross-provider recognition works (migrated configs detected instantly)
- [x] Zero false positives in scan results
- [x] Complete OpenCode structure documentation

---

**Phase 1.6: Modern Terminal UI with Ink (PLANNED - Week 6)**

**Goal**: Replace inquirer-based prompts with a modern, Cloud/OpenCode-style React-based TUI using Ink

**Why Ink?**
- Used by Claude Code, Gemini CLI, Copilot CLI, and Wrangler
- Component-based React architecture
- Flexbox layouts with Yoga
- Keyboard navigation support
- Modern, non-terminal-like appearance

**Key Features:**
- Full-screen terminal UI (not scrolling prompts)
- Visual sidebar navigation
- Real-time updates with React components
- Keyboard shortcuts: `/`, `q`, `esc`, `enter`, arrows
- Dark, minimal color scheme
- Fallback to inquirer for minimal terminals

| # | Task | Type | Status |
|---|------|------|--------|
| S4-27 | Setup Ink and React dependencies | Setup | [x] |
| S4-28 | Create Ink app infrastructure (App.tsx, routing, state) | UI | [x] |
| S4-29 | Build ScanView component with visual scope selector | UI | [x] |
| S4-30 | Implement FileBrowser component for path selection | UI | [x] |
| S4-32 | Add PathSelector for migration output location | UI | [x] |
| S4-33 | Create MigrationResults showing exact file paths | UI | [x] |
| S4-34 | Build ResultsPanel for scan/migration display | UI | [ ] |
| S4-35 | Add keyboard navigation and shortcuts | UX | [x] |
| S4-36 | Integrate Ink app into CLI with fallback mode | Integration | [x] |
| S4-37 | Write tests for Ink components | Testing | [ ] |
| S4-38 | Update documentation with Ink UI screenshots | Docs | [ ] |

**Phase 1.6 Definition of Done:**
- [x] Ink dependencies installed and configured
- [x] React-based TUI renders full-screen interface
- [x] Visual sidebar with navigation icons
- [x] Scan view with scope buttons (not prompts)
- [x] File browser with arrow key navigation
- [x] Migration view with adapter cards
- [x] Path selector for output location
- [x] Results show exact migrated file paths
- [x] Keyboard shortcuts functional (`/`, `q`, `esc`, arrows)
- [x] Dark, minimal color scheme implemented
- [x] Fallback to inquirer when TTY not available
- [ ] All Ink components tested

**Dependencies:**
- `ink`: ^5.0.0 - React for CLIs
- `react`: ^18.2.0 - React library
- `@types/react`: ^18.2.0 - TypeScript types

**Architecture:**
```
packages/cli/src/ui-ink/
├── index.tsx              # Entry point
├── App.tsx               # Main app with routing
├── components/
│   ├── Layout.tsx        # Main layout wrapper
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── ScanView.tsx      # Scan interface
│   ├── MigrationView.tsx # Migration interface
│   ├── FileBrowser.tsx   # Path selection
│   ├── ResultsPanel.tsx  # Results display
│   └── StatusBar.tsx     # Bottom status bar
├── hooks/
│   ├── useScan.ts        # Scan logic
│   ├── useMigration.ts   # Migration logic
│   └── useNavigation.ts  # Navigation state
└── theme.ts              # Color scheme
```

---

**Phase 2: Tool Support Expansion**

| # | Task | Type | Status |
|---|------|------|--------|
| S4-19 | [TEST FIRST] Write parser tests for Gemini CLI config schema | TDD | [x] |
| S4-20 | Implement Gemini CLI adapter (parser + translator) | Core | [x] |
| S4-21 | [TEST FIRST] Write parser tests for Cursor config schema | TDD | [x] |
| S4-22 | Implement Cursor adapter (.cursorrules + MCP support) | Core | [x] |
| S4-23 | Implement Gemini → Claude translator | Core | [x] |
| S4-24 | Implement Cursor → OpenCode translator | Core | [x] |
| S4-25 | Update CLI to support new tool options (--from/--to) | CLI | [x] |
| S4-26 | Cross-tool matrix tests for 4-tool combinations | E2E | [ ] |

**Sprint 4 Definition of Done:**
- [x] Agent Loop REPL mode functional with slash commands
- [x] /scan command with scope selection working
- [x] Scanner UI with live spinner updates
- [x] Scan Results Summary with migration prompt
- [x] Session State Manager maintaining scan results
- [x] /status, /help, /exit commands working
- [x] AI-powered scanner with glob patterns
- [x] OpenCode structure detection fixed
- [x] AI cross-validation eliminating false positives
- [x] E2E tests for AI scanner
- [x] Migration path selection (where to save files)
- [x] Show exact migrated file paths
- [x] `verify` command for checking tool structure
- [x] Filter adapter list to show only supported adapters
- [x] Ink-based modern TUI (Phase 1.6)
- [x] Gemini CLI adapter complete
- [x] Cursor adapter complete
- [x] All 4 tools supported (Claude, OpenCode, Gemini, Cursor)
- [ ] Cross-tool matrix tests passing

---

## Sprint 5 — GitHub Copilot CLI & Advanced Features (Week 5)

**Goal**: Add GitHub Copilot CLI support and advanced CLI features

| # | Task | Type | Status |
|---|------|------|--------|
| S5-01 | [TEST FIRST] Write parser tests for GitHub Copilot CLI config | TDD | [ ] |
| S5-02 | Implement GitHub Copilot CLI adapter (MCP only) | Core | [ ] |
| S5-03 | Implement rollback command: `agentsync rollback --tool <name>` | CLI | [ ] |
| S5-04 | Add `--verbose` logging mode with path and schema version output | CLI | [ ] |
| S5-05 | Implement `agentsync detect` command for auto-tool detection | CLI | [ ] |
| S5-06 | Add `--output` flag for custom output paths | CLI | [ ] |
| S5-07 | Implement config validation before migration | Core | [ ] |
| S5-08 | Full 5-tool cross-matrix E2E tests | E2E | [ ] |

**Sprint 5 Definition of Done:**
- [ ] GitHub Copilot CLI adapter complete
- [ ] All 5 target tools supported
- [ ] Rollback command functional
- [ ] Auto-detection working
- [ ] Full cross-matrix tests passing

---

## Sprint 6 — MCP Server Integration & Context Management (Week 6)

**Goal**: Full MCP server support and context file migration

| # | Task | Type | Status |
|---|------|------|--------|
| S6-01 | [TEST FIRST] Write tests for MCP server configuration parser | TDD | [ ] |
| S6-02 | Implement MCP server configuration migration | Core | [ ] |
| S6-03 | [TEST FIRST] Write tests for context file migration | TDD | [ ] |
| S6-04 | Implement context/rules file migration (e.g., .cursorrules) | Core | [ ] |
| S6-05 | [TEST FIRST] Write tests for prompt template migration | TDD | [ ] |
| S6-06 | Implement prompt template conversion | Core | [ ] |
| S6-07 | Add `--include-context` flag to CLI | CLI | [ ] |
| S6-08 | E2E test: Full config + context migration | E2E | [ ] |

**Sprint 6 Definition of Done:**
- [ ] MCP server migration working
- [ ] Context files migration working
- [ ] Prompt templates converted
- [ ] `--include-context` flag functional
- [ ] Full E2E tests with context

---

## Sprint 7 — Security, Permissions & Reports (Week 7)

**Goal**: Security hardening, permission system, and migration reports

| # | Task | Type | Status |
|---|------|------|--------|
| S7-01 | [TEST FIRST] Write tests for permission prompt and user consent flow | TDD | [ ] |
| S7-02 | Implement explicit permission prompt before any filesystem scan | CLI | [ ] |
| S7-03 | [TEST FIRST] Write tests for migration report generator | TDD | [ ] |
| S7-04 | Implement post-migration report (items migrated, skipped, warnings) | CLI | [ ] |
| S7-05 | Security audit: review all file paths, key masking, no accidental plaintext writes | Security | [ ] |
| S7-06 | Add `--no-backup` flag with explicit warning | CLI | [ ] |
| S7-07 | Implement migration diff preview mode | CLI | [ ] |

**Sprint 7 Definition of Done:**
- [ ] Permission prompts implemented
- [ ] Migration reports generated
- [ ] Security audit passed
- [ ] All security requirements met
- [ ] Diff preview functional

---

## Sprint 8 — Polish, Documentation & Release (Week 8)

**Goal**: Final polish, comprehensive docs, and open source release

| # | Task | Type | Status |
|---|------|------|--------|
| S8-01 | Write comprehensive README with install instructions, usage examples, demo GIF | Docs | [ ] |
| S8-02 | Write CONTRIBUTING.md and schema contribution guide | Docs | [ ] |
| S8-03 | Write architecture decision records (ADRs) for key decisions | Docs | [ ] |
| S8-04 | Create man page documentation | Docs | [ ] |
| S8-05 | npm publish dry run + package.json finalization | Release | [ ] |
| S8-06 | Performance optimization: benchmark migration times | Performance | [ ] |
| S8-07 | Final integration test suite run | Testing | [ ] |
| S8-08 | Community launch: post in r/ClaudeAI and r/LocalLLaMA | Launch | [ ] |

**Sprint 8 Definition of Done:**
- [ ] All documentation complete
- [ ] Package ready for npm publish
- [ ] Performance benchmarks met
- [ ] All tests passing
- [ ] Community launch completed

---

## 4. Definition of Done

A task is only considered **Done** when **ALL** of the following are true:

1. All tests written **BEFORE** implementation (TDD compliance)
2. All tests passing — zero failures, zero skipped
3. Coverage targets met for the layer (see Section 1.2)
4. Code reviewed by at least one other team member
5. No new TypeScript errors or lint warnings introduced
6. Relevant documentation updated (JSDoc, README section if applicable)
7. Demo-able in under 2 minutes if it is a user-facing feature

---

## 5. Tech Stack & Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.x | Language — strict mode enabled |
| vitest | 1.x | Test runner — fast, TS-native |
| @vitest/coverage-v8 | 1.x | Coverage reporting |
| inquirer | 9.x | Interactive CLI prompts |
| commander | 11.x | CLI argument parsing |
| zod | 3.x | Runtime schema validation |
| chalk | 5.x | Terminal output formatting |
| ora | 8.x | CLI spinner for async operations |
| pnpm | 8.x | Monorepo package manager |
| tsup | 8.x | TypeScript bundler for publishing |
| @modelcontextprotocol/sdk | latest | MCP server integration |

---

## 6. Milestones & Success Criteria

| Milestone | Target Date | Success Criteria | Owner |
|-----------|-------------|------------------|-------|
| **M1 — Core Engine** | End of Sprint 1 | Claude Code + OpenCode parsers passing 100% unit tests | Core team |
| **M2 — First Migration** | End of Sprint 2 | Live demo of Claude Code → OpenCode migration for team | Dev lead |
| **M3 — AI Mapping** | End of Sprint 3 | AI-assisted mapping working with suggestions | Core team |
| **M4 — 4 Tools Supported** | End of Sprint 4 | Gemini + Cursor adapters complete, 4-tool matrix tests passing | Core team |
| **M5 — Full Tool Matrix** | End of Sprint 5 | All 5 tools supported, auto-detection working | Core team |
| **M6 — MCP Integration** | End of Sprint 6 | Full MCP server + context migration | Core team |
| **M7 — Security Hardened** | End of Sprint 7 | Security audit passed, permission system in place | Security lead |
| **M8 — v1.0 Release** | End of Sprint 8 | Published to npm, README live, community post shared | Dev lead |

---

## 7. Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tool schema changes | High | Version schemas, maintain compatibility layers |
| AI mapping accuracy | Medium | Fallback to manual mapping, user confirmation prompts |
| Security vulnerabilities | High | Security audit in Sprint 7, never write plaintext keys |
| Performance with large configs | Medium | Benchmark in Sprint 8, optimize hot paths |
| Community adoption | Medium | Clear docs, demo videos, responsive support |

---

## Related Documents

- [Software Requirements Specification (SRS)](./srs.md)
- [Project Context](./project-context.md)
- [Architecture Decision Records](./adr/)
- [Security Model](./security-model.md)
- [Migration Flow](./migration-flow.md)
- [Testing Strategy](./testing-strategy.md)

---

*Document End — AI-Assisted Agent CLI Implementation Plan v2.0*
*Last Updated: 2025-03-28 | Status: Sprint 2 In Progress (78%)*
