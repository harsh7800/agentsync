# Test Cases: Agent Loop (REPL)

Generated from: `packages/cli/src/interactive/agent-loop/SPEC.md`
Generated on: 2025-04-01

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit (AgentLoop) | 15 | 10 | 4 | 1 |
| Unit (CommandRegistry) | 8 | 6 | 2 | 0 |
| Unit (SessionState) | 6 | 5 | 1 | 0 |
| Integration | 4 | 3 | 1 | 0 |
| **Total** | **33** | **24** | **8** | **1** |

---

## Unit Tests: AgentLoop

### AgentLoop Creation

#### UNIT-AGENT-001: Creates AgentLoop with default config
- **Priority**: P0
- **Given**: No configuration provided
- **When**: AgentLoop is instantiated
- **Then**: Uses default prompt ("> "), default welcome message, empty registry

#### UNIT-AGENT-002: Creates AgentLoop with custom config
- **Priority**: P0
- **Given**: Custom config with prompt "~> " and custom welcome message
- **When**: AgentLoop is instantiated
- **Then**: Applies custom configuration values

#### UNIT-AGENT-003: Initializes empty command registry
- **Priority**: P0
- **Given**: New AgentLoop instance
- **When**: Accessing registered commands
- **Then**: Registry is empty, no commands registered

---

### Command Registration

#### UNIT-AGENT-004: Registers single command successfully
- **Priority**: P0
- **Given**: AgentLoop with empty registry
- **When**: Registering /help command
- **Then**: Command is stored in registry, can be retrieved

#### UNIT-AGENT-005: Registers multiple commands
- **Priority**: P0
- **Given**: AgentLoop instance
- **When**: Registering /scan, /migrate, /help commands
- **Then**: All commands stored, getAll returns all three

#### UNIT-AGENT-006: Rejects duplicate command names
- **Priority**: P0
- **Given**: AgentLoop with /help registered
- **When**: Attempting to register another /help command
- **Then**: Throws CommandAlreadyExistsError

#### UNIT-AGENT-007: Rejects invalid command names
- **Priority**: P1
- **Given**: AgentLoop instance
- **When**: Attempting to register command with name "123" or "-invalid"
- **Then**: Throws InvalidCommandNameError

---

### Input Processing

#### UNIT-AGENT-008: Empty input returns silently
- **Priority**: P0
- **Given**: Running AgentLoop
- **When**: Processing empty string ""
- **Then**: Returns silent success, no command executed

#### UNIT-AGENT-009: Whitespace-only input returns silently
- **Priority**: P0
- **Given**: Running AgentLoop
- **When**: Processing "   " or "\t\n"
- **Then**: Returns silent success after trimming

#### UNIT-AGENT-010: Valid command executes successfully
- **Priority**: P0
- **Given**: /help command registered
- **When**: Processing "/help"
- **Then**: Executes help command, returns success result

#### UNIT-AGENT-011: Unknown command returns error
- **Priority**: P0
- **Given**: AgentLoop with only /help registered
- **When**: Processing "/unknown"
- **Then**: Returns error result with helpful message

#### UNIT-AGENT-012: Command with arguments parses correctly
- **Priority**: P0
- **Given**: /scan command registered
- **When**: Processing "/scan /custom/path"
- **Then**: Passes ["/custom/path"] as args to command

#### UNIT-AGENT-013: Command with flags parses correctly
- **Priority**: P0
- **Given**: Command with flag support
- **When**: Processing "/scan --current-dir --verbose"
- **Then**: Flags parsed as { "current-dir": true, "verbose": true }

#### UNIT-AGENT-014: Mixed args and flags parse correctly
- **Priority**: P1
- **Given**: Command with args and flags
- **When**: Processing "/migrate claude cursor --dry-run"
- **Then**: Args: ["claude", "cursor"], flags: { "dry-run": true }

---

### Session State Management

#### UNIT-AGENT-015: Get initial state returns defaults
- **Priority**: P0
- **Given**: New AgentLoop instance
- **When**: Getting session state
- **Then**: Returns empty arrays, null tools, valid sessionId

#### UNIT-AGENT-016: Update state merges values
- **Priority**: P0
- **Given**: Session with scannedTools: ["claude"]
- **When**: Updating with scannedTools: ["opencode"]
- **Then**: State contains both tools

#### UNIT-AGENT-017: State persists between commands
- **Priority**: P0
- **Given**: AgentLoop with state containing scanned tools
- **When**: Processing multiple commands
- **Then**: Each command sees previous state updates

#### UNIT-AGENT-018: Clear state resets to defaults
- **Priority**: P1
- **Given**: Session with populated data
- **When**: Calling clear()
- **Then**: All arrays empty, tools null, sessionId preserved

---

### Command Result Handling

#### UNIT-AGENT-019: Success result displays message
- **Priority**: P0
- **Given**: Command returns success with message
- **When**: Processing completes
- **Then**: Message is displayed to user

#### UNIT-AGENT-020: Error result displays error
- **Priority**: P0
- **Given**: Command fails with error
- **When**: Processing completes
- **Then**: Error message is displayed

#### UNIT-AGENT-021: Exit flag stops REPL
- **Priority**: P0
- **Given**: Running AgentLoop
- **When**: Command returns shouldExit: true
- **Then**: REPL loop terminates

#### UNIT-AGENT-022: Session updates applied
- **Priority**: P0
- **Given**: Command returns updatedSession
- **When**: Processing completes
- **Then**: Session state reflects updates

---

## Unit Tests: CommandRegistry

### Registration

#### UNIT-REGISTRY-001: Register command stores correctly
- **Priority**: P0
- **Given**: Empty registry
- **When**: Registering scan command
- **Then**: Can retrieve by name "scan"

#### UNIT-REGISTRY-002: Get returns undefined for unknown command
- **Priority**: P0
- **Given**: Registry with /help only
- **When**: Getting "unknown"
- **Then**: Returns undefined

#### UNIT-REGISTRY-003: GetAll returns all commands
- **Priority**: P0
- **Given**: Registry with 5 commands
- **When**: Calling getAll()
- **Then**: Returns array of 5 commands

---

### Parsing

#### UNIT-REGISTRY-004: Parse simple command
- **Priority**: P0
- **Given**: Input "/help"
- **When**: Parsing
- **Then**: { command: "help", args: [], flags: {} }

#### UNIT-REGISTRY-005: Parse command with args
- **Priority**: P0
- **Given**: Input "/scan /path/to/scan"
- **When**: Parsing
- **Then**: { command: "scan", args: ["/path/to/scan"], flags: {} }

#### UNIT-REGISTRY-006: Parse command with flags
- **Priority**: P0
- **Given**: Input "/scan --verbose --current-dir"
- **When**: Parsing
- **Then**: { command: "scan", args: [], flags: { verbose: true, "current-dir": true } }

#### UNIT-REGISTRY-007: Parse mixed args and flags
- **Priority**: P1
- **Given**: Input "/migrate claude cursor --dry-run"
- **When**: Parsing
- **Then**: { command: "migrate", args: ["claude", "cursor"], flags: { "dry-run": true } }

#### UNIT-REGISTRY-008: Parse handles extra whitespace
- **Priority**: P1
- **Given**: Input "/scan   /path   --verbose"
- **When**: Parsing
- **Then**: Correctly extracts command, single arg, and flag

---

## Unit Tests: SessionState

#### UNIT-SESSION-001: GetState returns current snapshot
- **Priority**: P0
- **Given**: Session with scannedTools: ["claude"]
- **When**: Calling getState()
- **Then**: Returns object with scannedTools array

#### UNIT-SESSION-002: Update merges partial state
- **Priority**: P0
- **Given**: Empty session
- **When**: Updating with { scannedTools: ["claude"] }
- **Then**: scannedTools contains "claude", other fields unchanged

#### UNIT-SESSION-003: Update overwrites existing values
- **Priority**: P0
- **Given**: Session with scannedTools: ["claude"]
- **When**: Updating with { scannedTools: ["opencode"] }
- **Then**: scannedTools is now ["opencode"]

#### UNIT-SESSION-004: Clear resets arrays to empty
- **Priority**: P0
- **Given**: Session with populated arrays
- **When**: Calling clear()
- **Then**: All arrays empty, selected tools null

#### UNIT-SESSION-005: Clear preserves sessionId
- **Priority**: P0
- **Given**: Session with sessionId "abc-123"
- **When**: Calling clear()
- **Then**: sessionId still "abc-123"

#### UNIT-SESSION-006: Update updates lastActivity
- **Priority**: P1
- **Given**: Session with old lastActivity
- **When**: Calling update()
- **Then**: lastActivity is updated to current time

---

## Integration Tests

#### INT-AGENT-001: Full command execution flow
- **Priority**: P0
- **Given**: AgentLoop with registered /status command
- **When**: Processing "/status" input
- **Then**: Command executes, sees current session, returns result

#### INT-AGENT-002: Command updates session state
- **Priority**: P0
- **Given**: AgentLoop with /scan command that updates state
- **When**: Processing "/scan" then "/status"
- **Then**: /status sees updated state from /scan

#### INT-AGENT-003: Multiple commands maintain state
- **Priority**: P0
- **Given**: AgentLoop with multiple commands
- **When**: Running /scan, /migrate, /status in sequence
- **Then**: State accumulates correctly across commands

#### INT-AGENT-004: Error in command doesn't corrupt state
- **Priority**: P1
- **Given**: AgentLoop with command that throws error
- **When**: Processing command that fails
- **Then**: State remains unchanged, error displayed

---

## E2E Tests

#### E2E-AGENT-001: Entry experience
- **Priority**: P0
- **Steps**:
  1. Run `agentsync` without arguments
  2. Verify welcome banner displays
  3. Verify help hint shows
  4. Verify prompt appears ("> ")
- **Expected**: REPL starts successfully

#### E2E-AGENT-002: Help command flow
- **Priority**: P0
- **Steps**:
  1. Enter Agent Mode
  2. Type "/help"
  3. Verify available commands listed
- **Expected**: Shows all registered commands with descriptions

#### E2E-AGENT-003: Exit command flow
- **Priority**: P0
- **Steps**:
  1. Enter Agent Mode
  2. Type "/exit"
  3. Verify graceful shutdown
- **Expected**: REPL exits cleanly with goodbye message

#### E2E-AGENT-004: Unknown command handling
- **Priority**: P0
- **Steps**:
  1. Enter Agent Mode
  2. Type "/unknowncommand"
  3. Verify error message
  4. Verify REPL continues
- **Expected**: Helpful error, REPL stays active

#### E2E-AGENT-005: Status command shows session
- **Priority**: P0
- **Steps**:
  1. Enter Agent Mode
  2. Type "/status"
  3. Verify session info displayed
- **Expected**: Shows sessionId, startTime, current state

---

## Test File Structure

```
packages/cli/src/__tests__/
├── agent-loop.spec.ts          # AgentLoop tests
├── command-registry.spec.ts    # CommandRegistry tests  
└── session-state.spec.ts       # SessionState tests
```

---

## Running Tests

```bash
# Run all agent loop tests
pnpm test -- packages/cli/src/__tests__/agent-loop.spec.ts

# Run with coverage
pnpm test -- --coverage packages/cli/src/__tests__/agent-loop.spec.ts

# Run specific test
pnpm test -- --testNamePattern="UNIT-AGENT-001"
```

---

## Coverage Requirements

| Component | Target |
|-----------|--------|
| AgentLoop | 95% |
| CommandRegistry | 95% |
| SessionState | 95% |
| Command handlers | 85% |

---

## Mock Data

```typescript
// Mock commands for testing
const mockHelpCommand: SlashCommand = {
  name: 'help',
  description: 'Show help',
  usage: '/help',
  execute: async () => ({ success: true, message: 'Help text' })
};

const mockExitCommand: SlashCommand = {
  name: 'exit',
  description: 'Exit REPL',
  usage: '/exit',
  execute: async () => ({ success: true, shouldExit: true })
};

const mockUpdateCommand: SlashCommand = {
  name: 'update',
  description: 'Update state',
  usage: '/update',
  execute: async (ctx) => ({
    success: true,
    updatedSession: { scannedTools: ['claude'] }
  })
};
```

---

## Related Tests

- Command Registry tests (S4-03, S4-04)
- /scan command tests (S4-05, S4-06)
- Scanner UI tests (S4-07, S4-08)
