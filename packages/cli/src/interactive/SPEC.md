# Agent Loop (REPL) - Technical Specification

**Feature:** Agent Loop (Interactive Agent Mode)  
**Sprint:** 4, Phase 1  
**Package:** `@agent-sync/cli`  
**Location:** `packages/cli/src/interactive/`  
**Status:** Draft  
**Last Updated:** 2026-04-01

---

## 1. Overview

The Agent Loop is the core REPL (Read-Eval-Print Loop) component that transforms the AgentSync CLI into an interactive AI terminal environment. When users run `agentsync` without arguments, they enter Agent Mode — a persistent session with slash commands, live UI updates, and session state management.

### 1.1 Purpose

- Provide a persistent, interactive terminal experience (like Claude Code, OpenCode Agent)
- Enable continuous interaction without restarting the CLI
- Maintain session state across commands
- Route slash commands to appropriate handlers via a pluggable registry
- Support guided workflows with step-by-step prompts

### 1.2 Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Entry Point** | `agentsync` without arguments |
| **Command Style** | Slash commands (`/scan`, `/migrate`, `/status`) |
| **State** | Persistent session across commands |
| **UI** | Live updates with spinners, structured summaries |
| **Exit** | `/exit` command or Ctrl+C |

### 1.3 User Experience Flow

```
$ agentsync

AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> /scan
[Interactive scan workflow...]

> /status
[Display session state...]

> /migrate
[Migration workflow using session data...]

> /exit
Goodbye!
```

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Loop (REPL)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. Display banner and help hints                     │  │
│  │  2. Read user input (readline)                        │  │
│  │  3. Parse input (detect slash commands)               │  │
│  │  4. Route to Command Registry                         │  │
│  │  5. Execute handler                                   │  │
│  │  6. Loop back to step 2                               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               Slash Command Registry                         │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ /scan        │ /migrate     │ /status      │             │
│  │ scanHandler  │ migrateHandler│ statusHandler│            │
│  ├──────────────┼──────────────┼──────────────┤             │
│  │ /detect      │ /help        │ /exit        │             │
│  │ detectHandler│ helpHandler  │ exitHandler  │             │
│  └──────────────┴──────────────┴──────────────┘             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                Session State Manager                         │
│  - scannedTools: string[]                                    │
│  - detectedAgents: string[]                                  │
│  - detectedSkills: string[]                                  │
│  - detectedMCPs: string[]                                    │
│  - scanPaths: string[]                                       │
│  - selectedTargetTool: string | null                         │
│  - scanTimestamp: Date | null                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
packages/cli/src/interactive/
├── agent-loop.ts              # Main REPL loop implementation
├── command-registry.ts        # Slash command registry and routing
├── session-state.ts           # Session state management
├── commands/
│   ├── scan.ts               # /scan command handler
│   ├── migrate.ts            # /migrate command handler
│   ├── status.ts             # /status command handler
│   ├── help.ts               # /help command handler
│   ├── exit.ts               # /exit command handler
│   └── detect.ts             # /detect command handler
├── types.ts                  # Shared type definitions
└── SPEC.md                   # This document
```

---

## 3. Data Types

### 3.1 Session State

```typescript
/**
 * Represents the complete session state maintained across Agent Mode commands.
 * This state persists for the duration of the REPL session.
 */
interface SessionState {
  /** Tools that have been detected during scanning (e.g., 'claude', 'opencode') */
  scannedTools: string[];
  
  /** Agent names discovered during scanning */
  detectedAgents: string[];
  
  /** Skill names discovered during scanning */
  detectedSkills: string[];
  
  /** MCP server names discovered during scanning */
  detectedMCPs: string[];
  
  /** File system paths that were scanned */
  scanPaths: string[];
  
  /** The target tool selected for migration (if any) */
  selectedTargetTool: string | null;
  
  /** Timestamp of the last scan operation */
  scanTimestamp: Date | null;
  
  /** Whether a scan has been performed in this session */
  hasScanned: boolean;
}

/**
 * Factory function to create initial empty session state
 */
type CreateSessionState = () => SessionState;
```

### 3.2 Command Definitions

```typescript
/**
 * Context passed to command handlers containing session state and utilities
 */
interface CommandContext {
  /** Current session state (mutable) */
  session: SessionState;
  
  /** Function to update session state */
  updateSession: (updates: Partial<SessionState>) => void;
  
  /** Function to clear/reset session state */
  clearSession: () => void;
  
  /** Reference to the command registry for command chaining */
  registry: CommandRegistry;
}

/**
 * A command handler function type
 */
type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<CommandResult> | CommandResult;

/**
 * Result returned by command handlers
 */
interface CommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  
  /** Optional message to display to the user */
  message?: string;
  
  /** Whether to continue the REPL loop (false = exit) */
  continue: boolean;
  
  /** Optional error details if success is false */
  error?: Error;
}

/**
 * Command metadata for display in help
 */
interface CommandMetadata {
  /** Command name including slash (e.g., '/scan') */
  name: string;
  
  /** Brief description (one line) */
  description: string;
  
  /** Usage example */
  usage: string;
  
  /** Aliases for this command (e.g., ['s'] for /scan) */
  aliases?: string[];
}

/**
 * Registered command entry
 */
interface RegisteredCommand extends CommandMetadata {
  /** The handler function */
  handler: CommandHandler;
}
```

### 3.3 Agent Loop Configuration

```typescript
/**
 * Configuration options for the Agent Loop
 */
interface AgentLoopConfig {
  /** Custom banner text (uses default if not provided) */
  banner?: string;
  
  /** Custom prompt prefix (default: '> ') */
  promptPrefix?: string;
  
  /** Whether to show help hints on startup */
  showHelpHints?: boolean;
  
  /** Custom exit command callback */
  onExit?: () => void | Promise<void>;
}
```

### 3.4 Input Parsing

```typescript
/**
 * Parsed user input from the REPL
 */
interface ParsedInput {
  /** The raw input string */
  raw: string;
  
  /** Whether this is a slash command */
  isCommand: boolean;
  
  /** Command name without slash (e.g., 'scan' from '/scan') */
  command?: string;
  
  /** Arguments after the command */
  args: string[];
}

/**
 * Parser function type
 */
type InputParser = (input: string) => ParsedInput;
```

---

## 4. Module Specifications

### 4.1 agent-loop.ts

**Purpose:** Main REPL loop that orchestrates the interactive session.

**Key Responsibilities:**
- Display entry banner and help hints
- Read user input continuously
- Parse input to detect slash commands
- Route commands to handlers via registry
- Handle graceful exit

**Functions:**

```typescript
/**
 * Starts the Agent Loop REPL session
 * @param config - Optional configuration for the loop
 * @returns Promise that resolves when the loop exits
 */
function startAgentLoop(config?: AgentLoopConfig): Promise<void>;

/**
 * Displays the entry banner with branding
 * @param banner - Optional custom banner text
 */
function displayBanner(banner?: string): void;

/**
 * Displays help hints for first-time users
 */
function displayHelpHints(): void;

/**
 * Reads a line of input from the user
 * @param prompt - The prompt to display
 * @returns Promise resolving to the input string
 */
function readInput(prompt: string): Promise<string>;

/**
 * Parses raw input into structured command data
 * @param input - Raw user input
 * @returns Parsed input structure
 */
function parseInput(input: string): ParsedInput;

/**
 * Executes a parsed command through the registry
 * @param parsed - Parsed input
 * @param context - Command execution context
 * @returns Command result
 */
function executeCommand(
  parsed: ParsedInput,
  context: CommandContext
): Promise<CommandResult>;

/**
 * Main loop iteration
 * @param context - Command context with session state
 * @param config - Loop configuration
 * @returns Whether to continue looping
 */
function loopIteration(
  context: CommandContext,
  config: AgentLoopConfig
): Promise<boolean>;
```

**Constants:**

```typescript
/** Default banner displayed on startup */
const DEFAULT_BANNER = `
╔═══════════════════════════════════════╗
║     AgentSync Interactive Mode        ║
╚═══════════════════════════════════════╝
`;

/** Default prompt prefix */
const DEFAULT_PROMPT = '> ';

/** Help hints displayed on startup */
const HELP_HINTS = `
Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.
`;
```

### 4.2 command-registry.ts

**Purpose:** Central registry for slash commands with routing capabilities.

**Key Responsibilities:**
- Register command handlers
- Resolve commands by name or alias
- Route parsed input to appropriate handler
- Provide command metadata for help display

**Class: CommandRegistry**

```typescript
class CommandRegistry {
  /**
   * Creates a new command registry
   */
  constructor();
  
  /**
   * Registers a new command
   * @param metadata - Command metadata
   * @param handler - Command handler function
   * @returns This registry for chaining
   */
  register(metadata: CommandMetadata, handler: CommandHandler): this;
  
  /**
   * Unregisters a command
   * @param name - Command name to unregister
   * @returns True if command was found and removed
   */
  unregister(name: string): boolean;
  
  /**
   * Looks up a command by name or alias
   * @param name - Command name or alias
   * @returns The registered command or undefined
   */
  resolve(name: string): RegisteredCommand | undefined;
  
  /**
   * Gets all registered commands
   * @returns Array of all registered commands
   */
  getAllCommands(): RegisteredCommand[];
  
  /**
   * Checks if a command is registered
   * @param name - Command name or alias
   * @returns True if the command exists
   */
  hasCommand(name: string): boolean;
  
  /**
   * Gets command metadata for help display
   * @returns Array of command metadata
   */
  getHelpInfo(): CommandMetadata[];
  
  /**
   * Creates default registry with built-in commands
   * @returns Pre-configured registry
   */
  static createDefault(): CommandRegistry;
}
```

**Error Types:**

```typescript
/**
 * Error thrown when a command is not found
 */
class CommandNotFoundError extends Error {
  constructor(commandName: string);
  readonly commandName: string;
}

/**
 * Error thrown when command registration fails
 */
class CommandRegistrationError extends Error {
  constructor(message: string, commandName: string);
  readonly commandName: string;
}
```

### 4.3 session-state.ts

**Purpose:** Manages persistent session state across commands.

**Key Responsibilities:**
- Create and initialize session state
- Update state immutably
- Clear/reset state
- Provide type-safe access to state

**Functions:**

```typescript
/**
 * Creates a new empty session state
 * @returns Fresh SessionState object
 */
function createSessionState(): SessionState;

/**
 * Updates session state with partial updates
 * @param current - Current session state
 * @param updates - Partial state updates
 * @returns Updated session state
 */
function updateSessionState(
  current: SessionState,
  updates: Partial<SessionState>
): SessionState;

/**
 * Resets session state to initial empty values
 * @returns Fresh SessionState object
 */
function clearSessionState(): SessionState;

/**
 * Creates a CommandContext from session state
 * @param initialState - Optional initial state
 * @returns CommandContext with state and update functions
 */
function createCommandContext(
  initialState?: SessionState
): CommandContext;
```

**Class: SessionStateManager**

```typescript
class SessionStateManager {
  /**
   * Creates a new session state manager
   * @param initialState - Optional initial state
   */
  constructor(initialState?: SessionState);
  
  /** Gets current state (immutable) */
  getState(): Readonly<SessionState>;
  
  /** Updates state with partial changes */
  update(updates: Partial<SessionState>): void;
  
  /** Clears state to initial values */
  clear(): void;
  
  /** Checks if any scan has been performed */
  hasScanData(): boolean;
  
  /** Gets formatted status string for display */
  getStatusDisplay(): string;
}
```

### 4.4 commands/scan.ts

**Purpose:** Handles the `/scan` command for agent and tool discovery.

**Key Responsibilities:**
- Prompt user for scan scope (current dir, system, custom path)
- Execute scanning with live UI updates
- Store results in session state
- Display structured summary
- Prompt for migration continuation

**Functions:**

```typescript
/**
 * /scan command handler
 * Scans for agents, tools, and MCP servers
 */
function scanHandler(
  args: string[],
  context: CommandContext
): Promise<CommandResult>;

/**
 * Prompts user for scan scope selection
 * @returns Selected scope option
 */
function promptScanScope(): Promise<'current' | 'system' | 'custom'>;

/**
 * Prompts for custom path when custom scope selected
 * @returns Validated path string
 */
function promptCustomPath(): Promise<string>;

/**
 * Executes scan with live UI updates
 * @param scope - Selected scan scope
 * @param customPath - Custom path if scope is 'custom'
 * @returns Scan results
 */
function executeScan(
  scope: 'current' | 'system' | 'custom',
  customPath?: string
): Promise<ScanResults>;

/**
 * Displays scan results summary
 * @param results - Scan results to display
 */
function displayScanResults(results: ScanResults): void;

/**
 * Prompts user to continue to migration
 * @returns Whether to start migration
 */
function promptForMigration(): Promise<boolean>;

/**
 * Updates session state with scan results
 * @param context - Command context
 * @param results - Scan results
 */
function updateSessionWithResults(
  context: CommandContext,
  results: ScanResults
): void;
```

**Types:**

```typescript
interface ScanResults {
  tools: string[];
  agents: string[];
  skills: string[];
  mcps: string[];
  paths: string[];
  timestamp: Date;
}
```

### 4.5 commands/status.ts

**Purpose:** Handles the `/status` command to display current session state.

**Functions:**

```typescript
/**
 * /status command handler
 * Displays current session state
 */
function statusHandler(
  args: string[],
  context: CommandContext
): CommandResult;

/**
 * Formats session state for display
 * @param state - Session state to format
 * @returns Formatted string for terminal display
 */
function formatSessionStatus(state: SessionState): string;
```

### 4.6 commands/help.ts

**Purpose:** Handles the `/help` and `/` commands to display available commands.

**Functions:**

```typescript
/**
 * /help command handler
 * Displays available commands and usage
 */
function helpHandler(
  args: string[],
  context: CommandContext
): CommandResult;

/**
 * Formats help text from registry
 * @param commands - Available commands metadata
 * @returns Formatted help string
 */
function formatHelpText(commands: CommandMetadata[]): string;
```

### 4.7 commands/exit.ts

**Purpose:** Handles the `/exit` command for graceful shutdown.

**Functions:**

```typescript
/**
 * /exit command handler
 * Gracefully exits Agent Mode
 */
function exitHandler(
  args: string[],
  context: CommandContext
): CommandResult;
```

### 4.8 commands/detect.ts

**Purpose:** Handles the `/detect` command for quick tool detection.

**Functions:**

```typescript
/**
 * /detect command handler
 * Detects installed tools without full scan
 */
function detectHandler(
  args: string[],
  context: CommandContext
): Promise<CommandResult>;
```

### 4.9 commands/migrate.ts

**Purpose:** Handles the `/migrate` command using session state.

**Functions:**

```typescript
/**
 * /migrate command handler
 * Starts migration workflow using session state
 */
function migrateHandler(
  args: string[],
  context: CommandContext
): Promise<CommandResult>;

/**
 * Prompts for target tool selection
 * @param detectedTools - Tools detected in session
 * @returns Selected target tool
 */
function promptTargetTool(detectedTools: string[]): Promise<string>;
```

---

## 5. Error Handling

### 5.1 Error Categories

| Category | Description | Handling Strategy |
|----------|-------------|-------------------|
| **Input Errors** | Invalid commands, malformed input | Display friendly error, continue loop |
| **Command Errors** | Handler execution failures | Display error details, continue loop |
| **System Errors** | File system, network issues | Log error, offer retry, continue loop |
| **Fatal Errors** | Unrecoverable crashes | Exit gracefully with error code |

### 5.2 Error Types

```typescript
/**
 * Base error for Agent Loop
 */
class AgentLoopError extends Error {
  constructor(message: string, code: string);
  readonly code: string;
  readonly isRecoverable: boolean;
}

/**
 * Input parsing error
 */
class InputParseError extends AgentLoopError {
  constructor(input: string, reason: string);
  readonly input: string;
}

/**
 * Command not found error
 */
class UnknownCommandError extends AgentLoopError {
  constructor(command: string);
  readonly command: string;
}

/**
 * Session state error
 */
class SessionStateError extends AgentLoopError {
  constructor(operation: string, reason: string);
  readonly operation: string;
}
```

### 5.3 Error Handling Strategy

1. **Command Not Found:** Display "Unknown command: {cmd}. Type /help for available commands."
2. **Handler Errors:** Display error message, log stack trace in verbose mode
3. **Session Errors:** Display error, offer to reset session state
4. **Parse Errors:** Display parsing error, show example usage

### 5.4 Recovery Mechanisms

- Invalid command → Continue to next input
- Handler exception → Log error, display message, continue
- Session corruption → Offer reset option
- Ctrl+C → Graceful exit with cleanup

---

## 6. Test Scenarios

### 6.1 Unit Tests

#### agent-loop.ts Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| AL-01 | Start loop displays banner | Banner shown on startup |
| AL-02 | Start loop displays help hints | Help hints shown |
| AL-03 | Empty input continues loop | Loop continues without error |
| AL-04 | Valid slash command executes | Handler called with correct args |
| AL-05 | Unknown command shows error | Error message displayed, loop continues |
| AL-06 | Exit command stops loop | Loop terminates cleanly |
| AL-07 | Ctrl+C exits gracefully | Cleanup performed, loop exits |
| AL-08 | Parse input extracts command | Correct command and args parsed |
| AL-09 | Parse input handles quoted args | Quoted strings handled correctly |

#### command-registry.ts Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| CR-01 | Register command succeeds | Command stored in registry |
| CR-02 | Register duplicate throws | RegistrationError thrown |
| CR-03 | Resolve by name returns handler | Correct handler returned |
| CR-04 | Resolve by alias returns handler | Correct handler returned |
| CR-05 | Resolve unknown returns undefined | Undefined returned |
| CR-06 | Unregister removes command | Command no longer resolvable |
| CR-07 | Get all returns all commands | Array contains all registered |
| CR-08 | Has command checks correctly | True for registered, false otherwise |

#### session-state.ts Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| SS-01 | Create returns empty state | All arrays empty, null values |
| SS-02 | Update merges changes | Only specified fields updated |
| SS-03 | Clear resets to empty | State matches create output |
| SS-04 | Has scan data returns true | True when scan performed |
| SS-05 | Has scan data returns false | False when no scan |
| SS-06 | Status display formats correctly | Formatted string returned |

#### Command Handler Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| CH-SCAN-01 | Scan with no args prompts scope | User prompted for scope |
| CH-SCAN-02 | Scan updates session state | Session contains scan results |
| CH-SCAN-03 | Scan displays results | Summary shown to user |
| CH-STATUS-01 | Status displays empty state | "No scan data" message |
| CH-STATUS-02 | Status displays scan data | All detected items listed |
| CH-HELP-01 | Help shows all commands | All registered commands listed |
| CH-EXIT-01 | Exit returns continue=false | Loop terminates |
| CH-DETECT-01 | Detect finds installed tools | Tools list updated in session |

### 6.2 Integration Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| INT-01 | Full scan → status flow | Status shows scan results |
| INT-02 | Scan → migrate flow | Migrate uses scan data |
| INT-03 | Multiple scans update state | Latest scan data available |
| INT-04 | Command chaining via registry | Commands can invoke others |
| INT-05 | Session persists across commands | State maintained correctly |

### 6.3 E2E Tests

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| E2E-01 | Complete agent mode session | All commands work end-to-end |
| E2E-02 | Scan and migrate workflow | Agents migrated successfully |
| E2E-03 | Exit and re-enter preserves nothing | Fresh session on re-entry |
| E2E-04 | Error recovery continues session | Session continues after error |

---

## 7. Acceptance Criteria

### 7.1 Functional Requirements

| ID | Requirement | Acceptance Criteria | Status |
|----|-------------|---------------------|--------|
| AGENT-01 | REPL Loop | Running `agentsync` enters Agent Mode with persistent loop | [ ] |
| AGENT-02 | Slash Commands | All commands use `/` prefix and route correctly | [ ] |
| AGENT-03 | Session State | State maintained across commands until exit | [ ] |
| AGENT-04 | Command Registry | New commands can be registered and resolved | [ ] |
| AGENT-05 | Graceful Exit | `/exit` cleanly shuts down with cleanup | [ ] |
| SCAN-01 | Scope Selection | `/scan` prompts for scope (current/system/custom) | [ ] |
| SCAN-04 | Structured Summary | Scan results displayed in formatted summary | [ ] |
| SCAN-06 | Session Storage | Scan results stored in session state | [ ] |
| CMD-01 | /help Command | `/help` displays available commands | [ ] |
| CMD-02 | /scan Command | `/scan` initiates scan workflow | [ ] |
| CMD-03 | /migrate Command | `/migrate` uses session state for migration | [ ] |
| CMD-05 | /status Command | `/status` displays current session state | [ ] |
| CMD-06 | /exit Command | `/exit` exits Agent Mode | [ ] |
| STATE-01 | State Persistence | State persists for session duration | [ ] |
| STATE-02 | State Contents | All required fields tracked in state | [ ] |

### 7.2 Non-Functional Requirements

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-01 | Performance | REPL responds in < 100ms | [ ] |
| NFR-03 | Cross-Platform | Works on macOS, Linux, Windows | [ ] |
| NFR-04 | Testability | All logic covered by tests | [ ] |

### 7.3 Definition of Done

- [ ] All unit tests passing (TDD compliance)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code coverage ≥ 90% for interactive package
- [ ] No TypeScript errors
- [ ] No lint warnings
- [ ] Documentation complete (JSDoc comments)
- [ ] Manual testing completed
- [ ] Demo ready for team review

---

## 8. Dependencies

### 8.1 Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `readline` | Node.js built-in | REPL input handling |
| `inquirer` | ^9.x | Interactive prompts |
| `ora` | ^8.x | CLI spinners for scan UI |
| `chalk` | ^5.x | Terminal colors and formatting |
| `commander` | ^11.x | CLI framework (existing) |

### 8.2 Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@agent-sync/core` | Scanner, AI mapping engine |
| `@agent-sync/schemas` | Tool schema definitions |

### 8.3 Dev Dependencies

| Package | Purpose |
|---------|---------|
| `vitest` | Test framework |
| `@types/inquirer` | TypeScript types |
| `@types/node` | Node.js types |

---

## 9. Implementation Tasks

### Sprint 4, Phase 1 Tasks

| Task ID | Task | File | Status |
|---------|------|------|--------|
| S4-01 | Write tests for Agent Loop REPL | `__tests__/agent-loop.spec.ts` | [ ] |
| S4-02 | Implement Agent Loop | `agent-loop.ts` | [ ] |
| S4-03 | Write tests for Command Registry | `__tests__/command-registry.spec.ts` | [ ] |
| S4-04 | Implement Command Registry | `command-registry.ts` | [ ] |
| S4-05 | Write tests for /scan command | `__tests__/commands/scan.spec.ts` | [ ] |
| S4-06 | Implement /scan command | `commands/scan.ts` | [ ] |
| S4-11 | Write tests for Session State | `__tests__/session-state.spec.ts` | [ ] |
| S4-12 | Implement Session State Manager | `session-state.ts` | [ ] |
| S4-13 | Implement /migrate command | `commands/migrate.ts` | [ ] |
| S4-14 | Implement /status command | `commands/status.ts` | [ ] |
| S4-15 | Implement /help command | `commands/help.ts` | [ ] |
| S4-16 | Implement /exit command | `commands/exit.ts` | [ ] |
| S4-17 | Update CLI entry point | `src/index.ts` | [ ] |
| S4-18 | E2E tests | `packages/e2e/` | [ ] |

---

## 10. UI/UX Specifications

### 10.1 Entry Banner

```
╔═══════════════════════════════════════════╗
║         AgentSync Interactive Mode        ║
║                                           ║
║   AI-Assisted Agent Configuration CLI     ║
╚═══════════════════════════════════════════╝

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> 
```

### 10.2 Prompt Style

- **Default Prompt:** `> `
- **Color:** Cyan (using chalk)
- **Cursor:** Block or line cursor

### 10.3 Error Display

```
❌ Unknown command: /foo
Type /help for available commands.
```

### 10.4 Success Indicators

```
✔ Scan complete
✔ Session state updated
✔ Migration started
```

---

## 11. Security Considerations

1. **Input Validation:** All user input validated before processing
2. **Path Sanitization:** Custom paths validated and sanitized
3. **No Secrets in Logs:** API keys never logged or displayed
4. **Session Isolation:** No sensitive data persisted between sessions

---

## 12. Related Documents

- [CLI Interface](../../docs/cli-interface.md)
- [Project Context](../../docs/project-context.md)
- [Software Requirements Specification](../../docs/srs.md)
- [Implementation Plan](../../docs/implementation-plan.md)

---

*Document End — Agent Loop Specification v1.0*
