# Agent Loop (REPL) — Specification

**Feature**: Agent Mode REPL System  
**Package**: `packages/cli`  
**Phase**: Sprint 4, Phase 1  
**Status**: Design  
**Last Updated**: 2025-04-01

---

## Overview

The Agent Loop is a persistent REPL (Read-Eval-Print Loop) that provides an interactive terminal environment for managing AI agent configurations. When users run `agentsync` without arguments, they enter Agent Mode with slash command support (/scan, /migrate, /status, /help, /exit).

---

## Files

| File | Purpose |
|------|---------|
| `packages/cli/src/interactive/agent-loop.ts` | Main REPL loop implementation |
| `packages/cli/src/interactive/command-registry.ts` | Command registration and routing |
| `packages/cli/src/interactive/session-state.ts` | Session state management |
| `packages/cli/src/interactive/commands/scan.ts` | /scan command handler |
| `packages/cli/src/interactive/commands/migrate.ts` | /migrate command handler |
| `packages/cli/src/interactive/commands/status.ts` | /status command handler |
| `packages/cli/src/interactive/commands/help.ts` | /help command handler |
| `packages/cli/src/interactive/commands/exit.ts` | /exit command handler |

---

## Data Types

### AgentLoopConfig

```typescript
interface AgentLoopConfig {
  prompt: string;                    // REPL prompt symbol (default: "> ")
  welcomeMessage: string;            // Entry banner message
  exitCommands: string[];            // Commands that exit REPL
  historyFile?: string;              // Optional history persistence
}
```

### CommandContext

```typescript
interface CommandContext {
  session: SessionState;             // Current session state
  args: string[];                    // Command arguments
  flags: Record<string, boolean>;    // Parsed flags
}
```

### CommandResult

```typescript
interface CommandResult {
  success: boolean;                  // Whether command succeeded
  message?: string;                  // Optional message to display
  shouldExit?: boolean;              // Whether to exit REPL
  updatedSession?: Partial<SessionState>; // Session updates
}
```

### SlashCommand

```typescript
interface SlashCommand {
  name: string;                      // Command name (e.g., "scan")
  description: string;               // Short description for /help
  usage: string;                     // Usage example
  aliases?: string[];                // Optional aliases (e.g., ["s"])
  execute: (context: CommandContext) => Promise<CommandResult>;
}
```

---

## Functions

### AgentLoop

#### `constructor(config?: Partial<AgentLoopConfig>)`

Creates a new AgentLoop instance with optional configuration.

**Parameters:**
- `config` (optional): Partial configuration to override defaults

**Behavior:**
- Initializes with default config if none provided
- Creates empty command registry
- Initializes empty session state

---

#### `registerCommand(command: SlashCommand): void`

Registers a slash command in the registry.

**Parameters:**
- `command`: SlashCommand to register

**Throws:**
- Error if command name is already registered
- Error if command name doesn't start with letter

---

#### `start(): Promise<void>`

Starts the REPL loop. Displays welcome message and begins processing input.

**Behavior:**
- Prints welcome banner
- Displays help hint
- Enters input loop
- Handles graceful shutdown on exit

---

#### `stop(): void`

Stops the REPL loop gracefully.

**Behavior:**
- Sets running flag to false
- Allows current operation to complete
- Prints exit message

---

#### `processInput(input: string): Promise<CommandResult>`

Processes a single input line.

**Parameters:**
- `input`: Raw user input string

**Returns:** CommandResult indicating success/failure

**Behavior:**
- Trims whitespace
- Empty input returns silently
- Parses command and arguments
- Routes to appropriate handler
- Updates session state on success
- Returns error result on failure

---

### CommandRegistry

#### `register(command: SlashCommand): void`

Registers a command.

**Parameters:**
- `command`: Command to register

**Throws:**
- `CommandAlreadyExistsError`: If name already registered
- `InvalidCommandNameError`: If name is invalid

---

#### `get(name: string): SlashCommand | undefined`

Retrieves a command by name.

**Parameters:**
- `name`: Command name (without / prefix)

**Returns:** Command or undefined if not found

---

#### `getAll(): SlashCommand[]`

Returns all registered commands.

**Returns:** Array of all commands

---

#### `parse(input: string): { command: string; args: string[]; flags: Record<string, boolean> }`

Parses a command line input.

**Parameters:**
- `input`: Raw input string

**Returns:** Parsed command with args and flags

**Example:**
```typescript
registry.parse("/scan --current-dir --verbose")
// Returns: { command: "scan", args: [], flags: { "current-dir": true, "verbose": true } }
```

---

### SessionState

#### `getState(): SessionState`

Gets the current session state.

**Returns:** Current state snapshot

---

#### `update(updates: Partial<SessionState>): void`

Updates the session state.

**Parameters:**
- `updates`: Partial state to merge

**Behavior:**
- Merges updates into current state
- Overwrites existing values

---

#### `clear(): void`

Resets session state to initial values.

---

## SessionState Structure

```typescript
interface SessionState {
  // Scan results
  scannedTools: string[];              // Names of detected tools
  detectedAgents: Agent[];             // Detected agents
  detectedSkills: Skill[];             // Detected skills
  detectedMCPs: MCPServer[];          // Detected MCP servers
  scanPaths: string[];                 // Paths that were scanned
  
  // Migration state
  selectedSourceTool: string | null;   // Selected source tool
  selectedTargetTool: string | null;   // Selected target tool
  migrationResult?: MigrationResult;   // Last migration result
  
  // Session metadata
  sessionId: string;                   // Unique session ID
  startTime: Date;                     // Session start time
  lastActivity: Date;                  // Last command timestamp
}
```

---

## Error Handling

| Error Case | Response |
|------------|----------|
| Unknown command | Display error: "Unknown command: /{command}. Type /help for available commands." |
| Command throws exception | Display error message, continue REPL |
| Session state corrupted | Reset to defaults, display warning |
| Exit command | Graceful shutdown with goodbye message |

---

## Test Scenarios

### Unit Tests

1. **AgentLoop creation**
   - Creates with default config
   - Creates with custom config
   - Initializes empty registry

2. **Command registration**
   - Register single command
   - Register multiple commands
   - Reject duplicate command names
   - Reject invalid command names

3. **Input processing**
   - Empty input returns silently
   - Whitespace-only input returns silently
   - Valid command executes successfully
   - Unknown command returns error
   - Command with arguments parses correctly
   - Command with flags parses correctly

4. **Session state management**
   - Get initial state
   - Update state
   - Clear state resets to defaults
   - State persists between commands

5. **Command result handling**
   - Success result displays message
   - Error result displays error
   - Exit flag stops REPL
   - Session updates applied

### Integration Tests

1. **Full REPL lifecycle**
   - Start REPL
   - Process multiple commands
   - Stop REPL gracefully

2. **Command routing**
   - Routes to correct handler
   - Passes correct context
   - Updates session correctly

### E2E Tests

1. **Entry experience**
   - Run `agentsync` without args enters REPL
   - Welcome banner displays
   - Help hint shows

2. **Command execution**
   - /help shows available commands
   - /exit exits cleanly
   - /status shows current state

---

## Acceptance Criteria

- [ ] REPL starts when running `agentsync` without arguments
- [ ] Welcome message and help hint display on entry
- [ ] Slash commands (/scan, /migrate, /status, /help, /exit) work
- [ ] Unknown commands show helpful error message
- [ ] Session state persists across commands
- [ ] Graceful exit with /exit command
- [ ] All tests passing (100% coverage target)

---

## Dependencies

**Must be completed first:**
- S3-13: Interactive AI-assisted mapping prompts (for UI patterns)
- S3-14: Interactive mode implementation (for command patterns)

**Used by:**
- S4-05: /scan command tests
- S4-07: Scanner Loading UI tests

---

## Related Documents

- [SRS - Agent Mode Requirements](../docs/srs.md#31-agent-mode-core)
- [Architecture - Agent Mode](../docs/architecture.md#2-agent-mode-architecture)
- [Implementation Plan](../docs/implementation-plan.md#sprint-4)
