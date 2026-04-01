# Test Cases: Agent Loop (REPL)

Generated from: `packages/cli/src/interactive/SPEC.md`
Generated on: 2026-04-01

---

## Summary

| Layer | Count | High (P0) | Medium (P1) | Low (P2) |
|-------|-------|-----------|-------------|----------|
| Unit (Agent Loop) | 18 | 13 | 4 | 1 |
| Unit (Command Registry) | 12 | 9 | 3 | 0 |
| Unit (Session State) | 10 | 8 | 2 | 0 |
| Unit (Command Handlers) | 20 | 15 | 4 | 1 |
| Integration | 8 | 6 | 2 | 0 |
| E2E | 6 | 5 | 1 | 0 |
| **Total** | **74** | **56** | **16** | **2** |

---

## Unit Tests: Agent Loop Module (agent-loop.ts)

### Agent Loop Initialization

#### AL-INIT-001: startAgentLoop displays banner on startup
- **Test ID**: AL-INIT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with default settings
- **When**: startAgentLoop() is called
- **Then**: DEFAULT_BANNER is displayed to stdout

#### AL-INIT-002: startAgentLoop displays custom banner
- **Test ID**: AL-INIT-002
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with custom banner text
- **When**: startAgentLoop() is called
- **Then**: Custom banner is displayed instead of default

#### AL-INIT-003: startAgentLoop displays help hints when enabled
- **Test ID**: AL-INIT-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with showHelpHints: true
- **When**: startAgentLoop() is called
- **Then**: HELP_HINTS are displayed after banner

#### AL-INIT-004: startAgentLoop skips help hints when disabled
- **Test ID**: AL-INIT-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with showHelpHints: false
- **When**: startAgentLoop() is called
- **Then**: Only banner is displayed, no help hints

#### AL-INIT-005: startAgentLoop initializes command context
- **Test ID**: AL-INIT-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Default AgentLoopConfig
- **When**: startAgentLoop() is called
- **Then**: CommandContext is created with fresh SessionState and default CommandRegistry

---

### Input Reading

#### AL-INPUT-001: readInput displays prompt and returns user input
- **Test ID**: AL-INPUT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Prompt string "> "
- **When**: readInput() is called and user types "hello"
- **Then**: Prompt is displayed, function returns "hello"

#### AL-INPUT-002: readInput uses custom prompt prefix
- **Test ID**: AL-INPUT-002
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with promptPrefix: "$ "
- **When**: readInput() is called
- **Then**: "$ " is displayed as the prompt

#### AL-INPUT-003: readInput handles empty input
- **Test ID**: AL-INPUT-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Prompt string "> "
- **When**: readInput() is called and user presses Enter without typing
- **Then**: Returns empty string ""

#### AL-INPUT-004: readInput handles whitespace-only input
- **Test ID**: AL-INPUT-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Prompt string "> "
- **When**: readInput() is called and user types "   "
- **Then**: Returns whitespace string (not trimmed)

---

### Input Parsing

#### AL-PARSE-001: parseInput extracts command from slash command
- **Test ID**: AL-PARSE-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Input string "/scan"
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with isCommand: true, command: "scan", args: []

#### AL-PARSE-002: parseInput extracts command and arguments
- **Test ID**: AL-PARSE-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Input string "/scan --current-dir"
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with command: "scan", args: ["--current-dir"]

#### AL-PARSE-003: parseInput handles multiple arguments
- **Test ID**: AL-PARSE-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Input string "/migrate claude cursor"
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with command: "migrate", args: ["claude", "cursor"]

#### AL-PARSE-004: parseInput handles quoted arguments
- **Test ID**: AL-PARSE-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Input string '/scan "/custom/path with spaces"'
- **When**: parseInput() is called
- **Then**: Returns args: ["/custom/path with spaces"] (as single argument)

#### AL-PARSE-005: parseInput marks non-slash input as not command
- **Test ID**: AL-PARSE-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Input string "hello world"
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with isCommand: false, command: undefined

#### AL-PARSE-006: parseInput handles empty input
- **Test ID**: AL-PARSE-006
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Input string ""
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with isCommand: false, raw: ""

#### AL-PARSE-007: parseInput handles lone slash
- **Test ID**: AL-PARSE-007
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Input string "/"
- **When**: parseInput() is called
- **Then**: Returns ParsedInput with isCommand: true, command: "" (empty string), args: []

---

### Command Execution

#### AL-EXEC-001: executeCommand routes to registered handler
- **Test ID**: AL-EXEC-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: ParsedInput with command: "help", registered /help handler
- **When**: executeCommand() is called
- **Then**: Help handler is invoked with correct args and context

#### AL-EXEC-002: executeCommand returns unknown command error
- **Test ID**: AL-EXEC-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: ParsedInput with command: "unknown", no registered handler
- **When**: executeCommand() is called
- **Then**: Returns CommandResult with success: false, message containing "Unknown command"

#### AL-EXEC-003: executeCommand passes context to handler
- **Test ID**: AL-EXEC-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandContext with session containing scannedTools
- **When**: executeCommand() is called with /status
- **Then**: Status handler receives context with session data

#### AL-EXEC-004: executeCommand handles handler exceptions
- **Test ID**: AL-EXEC-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Command handler that throws an error
- **When**: executeCommand() is called
- **Then**: Returns CommandResult with success: false, error details preserved

---

### Loop Continuation and Exit

#### AL-LOOP-001: Loop continues when command returns continue: true
- **Test ID**: AL-LOOP-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandResult with continue: true
- **When**: loopIteration() processes result
- **Then**: Returns true (continue looping)

#### AL-LOOP-002: Loop exits when command returns continue: false
- **Test ID**: AL-LOOP-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandResult with continue: false (e.g., from /exit)
- **When**: loopIteration() processes result
- **Then**: Returns false (exit loop)

#### AL-LOOP-003: Loop handles Ctrl+C gracefully
- **Test ID**: AL-LOOP-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: User presses Ctrl+C during readInput
- **When**: SIGINT is received
- **Then**: Loop terminates cleanly, onExit callback is invoked

#### AL-LOOP-004: onExit callback is invoked on graceful exit
- **Test ID**: AL-LOOP-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: AgentLoopConfig with custom onExit callback
- **When**: /exit command is executed
- **Then**: Custom onExit callback is called before loop terminates

---

## Unit Tests: Command Registry (command-registry.ts)

### Command Registration

#### CR-REG-001: Register command stores command in registry
- **Test ID**: CR-REG-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Empty CommandRegistry, CommandMetadata for /scan
- **When**: register() is called
- **Then**: Command is stored and can be retrieved

#### CR-REG-002: Register returns registry for chaining
- **Test ID**: CR-REG-002
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: CommandRegistry instance
- **When**: register() is called multiple times chained
- **Then**: All commands are registered successfully

#### CR-REG-003: Register with alias stores alias mapping
- **Test ID**: CR-REG-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandMetadata with aliases: ["s"]
- **When**: register() is called
- **Then**: Both "scan" and "s" resolve to the same handler

#### CR-REG-004: Register duplicate command name throws error
- **Test ID**: CR-REG-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /help already registered
- **When**: Attempting to register another /help command
- **Then**: Throws CommandRegistrationError with message about duplicate

#### CR-REG-005: Register duplicate alias throws error
- **Test ID**: CR-REG-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with command using alias "s"
- **When**: Attempting to register another command with alias "s"
- **Then**: Throws CommandRegistrationError

---

### Command Resolution

#### CR-RES-001: Resolve by name returns registered command
- **Test ID**: CR-RES-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /scan registered
- **When**: resolve("scan") is called
- **Then**: Returns RegisteredCommand with correct handler and metadata

#### CR-RES-002: Resolve by alias returns registered command
- **Test ID**: CR-RES-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /scan having alias "s"
- **When**: resolve("s") is called
- **Then**: Returns same RegisteredCommand as resolve("scan")

#### CR-RES-003: Resolve unknown command returns undefined
- **Test ID**: CR-RES-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with only /help registered
- **When**: resolve("unknown") is called
- **Then**: Returns undefined

#### CR-RES-004: Resolve handles empty string
- **Test ID**: CR-RES-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Any populated registry
- **When**: resolve("") is called
- **Then**: Returns undefined or handles gracefully

---

### Command Listing and Checks

#### CR-LIST-001: getAllCommands returns all registered commands
- **Test ID**: CR-LIST-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /scan, /help, /exit registered
- **When**: getAllCommands() is called
- **Then**: Returns array with all 3 commands

#### CR-LIST-002: getHelpInfo returns metadata for all commands
- **Test ID**: CR-LIST-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with multiple commands
- **When**: getHelpInfo() is called
- **Then**: Returns array of CommandMetadata without handlers

#### CR-CHECK-001: hasCommand returns true for registered command
- **Test ID**: CR-CHECK-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /scan registered
- **When**: hasCommand("scan") is called
- **Then**: Returns true

#### CR-CHECK-002: hasCommand returns true for registered alias
- **Test ID**: CR-CHECK-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with /scan having alias "s"
- **When**: hasCommand("s") is called
- **Then**: Returns true

#### CR-CHECK-003: hasCommand returns false for unknown command
- **Test ID**: CR-CHECK-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Empty registry
- **When**: hasCommand("unknown") is called
- **Then**: Returns false

---

### Unregistration

#### CR-UNREG-001: Unregister removes command from registry
- **Test ID**: CR-UNREG-001
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Registry with /scan registered
- **When**: unregister("scan") is called
- **Then**: Returns true, resolve("scan") returns undefined

#### CR-UNREG-002: Unregister unknown command returns false
- **Test ID**: CR-UNREG-002
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Empty registry
- **When**: unregister("unknown") is called
- **Then**: Returns false

#### CR-UNREG-003: Unregister removes aliases
- **Test ID**: CR-UNREG-003
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Registry with /scan having alias "s"
- **When**: unregister("scan") is called
- **Then**: Both "scan" and "s" no longer resolve

---

### Default Registry

#### CR-DEFAULT-001: createDefault creates registry with all built-in commands
- **Test ID**: CR-DEFAULT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: No existing registry
- **When**: CommandRegistry.createDefault() is called
- **Then**: Returns registry with /scan, /migrate, /status, /help, /exit, /detect

---

## Unit Tests: Session State Manager (session-state.ts)

### State Initialization

#### SS-INIT-001: createSessionState returns empty state
- **Test ID**: SS-INIT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: No arguments
- **When**: createSessionState() is called
- **Then**: Returns SessionState with empty arrays and null values

#### SS-INIT-002: SessionStateManager initializes with empty state
- **Test ID**: SS-INIT-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: No initial state
- **When**: new SessionStateManager() is created
- **Then**: getState() returns empty state

#### SS-INIT-003: SessionStateManager initializes with provided state
- **Test ID**: SS-INIT-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Partial SessionState with scannedTools: ["claude"]
- **When**: new SessionStateManager(initialState) is created
- **Then**: getState() returns merged state with provided values

#### SS-INIT-004: createCommandContext creates context with state and functions
- **Test ID**: SS-INIT-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Initial SessionState
- **When**: createCommandContext() is called
- **Then**: Returns CommandContext with session, updateSession, clearSession, and registry

---

### State Updates

#### SS-UPDATE-001: updateSessionState merges partial updates
- **Test ID**: SS-UPDATE-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Current state with scannedTools: ["claude"]
- **When**: Updating with { detectedAgents: ["agent1"] }
- **Then**: New state has both scannedTools and detectedAgents

#### SS-UPDATE-002: updateSessionState overwrites existing values
- **Test ID**: SS-UPDATE-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Current state with scannedTools: ["claude"]
- **When**: Updating with { scannedTools: ["opencode"] }
- **Then**: scannedTools is now ["opencode"], not merged

#### SS-UPDATE-003: SessionStateManager.update applies changes
- **Test ID**: SS-UPDATE-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with empty state
- **When**: update({ hasScanned: true }) is called
- **Then**: getState() returns state with hasScanned: true

#### SS-UPDATE-004: Update updates scanTimestamp
- **Test ID**: SS-UPDATE-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with scanTimestamp: null
- **When**: update({ scanTimestamp: new Date() }) is called
- **Then**: scanTimestamp is set to provided date

#### SS-UPDATE-005: Update updates selectedTargetTool
- **Test ID**: SS-UPDATE-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with selectedTargetTool: null
- **When**: update({ selectedTargetTool: "cursor" }) is called
- **Then**: selectedTargetTool is "cursor"

---

### State Retrieval

#### SS-GET-001: SessionStateManager.getState returns immutable state
- **Test ID**: SS-GET-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with state
- **When**: getState() is called and returned object is modified
- **Then**: Internal state remains unchanged

#### SS-GET-002: SessionStateManager.getStatusDisplay formats state correctly
- **Test ID**: SS-GET-002
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: State with scannedTools: ["claude", "cursor"], hasScanned: true
- **When**: getStatusDisplay() is called
- **Then**: Returns formatted string showing detected tools

---

### State Reset

#### SS-RESET-001: clearSessionState returns fresh empty state
- **Test ID**: SS-RESET-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any existing state
- **When**: clearSessionState() is called
- **Then**: Returns SessionState matching createSessionState() output

#### SS-RESET-002: SessionStateManager.clear resets to initial state
- **Test ID**: SS-RESET-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with populated state
- **When**: clear() is called
- **Then**: getState() returns empty state, hasScanData() returns false

---

### State Queries

#### SS-QUERY-001: hasScanData returns false when no scan performed
- **Test ID**: SS-QUERY-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Fresh SessionStateManager
- **When**: hasScanData() is called
- **Then**: Returns false

#### SS-QUERY-002: hasScanData returns true when scan performed
- **Test ID**: SS-QUERY-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: SessionStateManager with hasScanned: true
- **When**: hasScanData() is called
- **Then**: Returns true

---

## Unit Tests: Command Handlers

### /scan Command Handler

#### CH-SCAN-001: scanHandler prompts for scan scope
- **Test ID**: CH-SCAN-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: No arguments provided to /scan
- **When**: scanHandler is called
- **Then**: promptScanScope() is invoked to ask user for scope

#### CH-SCAN-002: scanHandler executes scan with current scope
- **Test ID**: CH-SCAN-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: User selects 'current' scope
- **When**: scanHandler executes
- **Then**: executeScan('current') is called

#### CH-SCAN-003: scanHandler prompts for custom path when custom scope selected
- **Test ID**: CH-SCAN-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: User selects 'custom' scope
- **When**: scanHandler executes
- **Then**: promptCustomPath() is called before executeScan

#### CH-SCAN-004: scanHandler updates session with scan results
- **Test ID**: CH-SCAN-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: ScanResults with tools: ["claude"], agents: ["agent1"]
- **When**: scanHandler completes scan
- **Then**: updateSessionWithResults() is called, session state updated

#### CH-SCAN-005: scanHandler displays scan results
- **Test ID**: CH-SCAN-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Successful scan completion
- **When**: scanHandler receives results
- **Then**: displayScanResults() is called with results

#### CH-SCAN-006: scanHandler prompts for migration continuation
- **Test ID**: CH-SCAN-006
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Successful scan with detected tools
- **When**: Results are displayed
- **Then**: promptForMigration() is called

#### CH-SCAN-007: scanHandler returns success on completion
- **Test ID**: CH-SCAN-007
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Successful scan workflow
- **When**: scanHandler completes
- **Then**: Returns CommandResult with success: true, continue: true

#### CH-SCAN-008: scanHandler handles scan errors gracefully
- **Test ID**: CH-SCAN-008
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: executeScan throws an error
- **When**: scanHandler executes
- **Then**: Returns CommandResult with success: false, error details

---

### /status Command Handler

#### CH-STATUS-001: statusHandler displays empty state message
- **Test ID**: CH-STATUS-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandContext with empty session (no scan data)
- **When**: statusHandler is called
- **Then**: Displays message indicating no scan data available

#### CH-STATUS-002: statusHandler displays session state
- **Test ID**: CH-STATUS-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Session with scannedTools, detectedAgents, scanTimestamp
- **When**: statusHandler is called
- **Then**: Displays formatted status showing all session data

#### CH-STATUS-003: statusHandler returns success result
- **Test ID**: CH-STATUS-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any valid session state
- **When**: statusHandler completes
- **Then**: Returns CommandResult with success: true, continue: true

#### CH-STATUS-004: formatSessionStatus formats state correctly
- **Test ID**: CH-STATUS-004
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: SessionState with multiple detected items
- **When**: formatSessionStatus() is called
- **Then**: Returns formatted string with proper indentation and labels

---

### /help Command Handler

#### CH-HELP-001: helpHandler displays all available commands
- **Test ID**: CH-HELP-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: CommandContext with registry containing multiple commands
- **When**: helpHandler is called
- **Then**: All registered commands are displayed with descriptions

#### CH-HELP-002: helpHandler displays usage examples
- **Test ID**: CH-HELP-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Registry with commands having usage metadata
- **When**: helpHandler is called
- **Then**: Usage examples are displayed for each command

#### CH-HELP-003: helpHandler handles empty registry
- **Test ID**: CH-HELP-003
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: CommandContext with empty registry
- **When**: helpHandler is called
- **Then**: Displays message indicating no commands available

#### CH-HELP-004: helpHandler returns success result
- **Test ID**: CH-HELP-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any valid registry
- **When**: helpHandler completes
- **Then**: Returns CommandResult with success: true, continue: true

#### CH-HELP-005: formatHelpText creates readable help output
- **Test ID**: CH-HELP-005
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Array of CommandMetadata
- **When**: formatHelpText() is called
- **Then**: Returns formatted string with command names, descriptions, and usage

---

### /exit Command Handler

#### CH-EXIT-001: exitHandler returns continue: false
- **Test ID**: CH-EXIT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any session state
- **When**: exitHandler is called
- **Then**: Returns CommandResult with continue: false, triggering loop exit

#### CH-EXIT-002: exitHandler displays goodbye message
- **Test ID**: CH-EXIT-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any session state
- **When**: exitHandler is called
- **Then**: Displays "Goodbye!" or similar exit message

#### CH-EXIT-003: exitHandler returns success: true
- **Test ID**: CH-EXIT-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Any session state
- **When**: exitHandler completes
- **Then**: Returns CommandResult with success: true

---

### /detect Command Handler

#### CH-DETECT-001: detectHandler performs quick tool detection
- **Test ID**: CH-DETECT-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: System with installed tools
- **When**: detectHandler is called
- **Then**: Detects tools without full filesystem scan

#### CH-DETECT-002: detectHandler updates session with detected tools
- **Test ID**: CH-DETECT-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Detection finds claude and cursor installed
- **When**: detectHandler completes
- **Then**: Session scannedTools includes detected tools

#### CH-DETECT-003: detectHandler displays detection results
- **Test ID**: CH-DETECT-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Detection completes
- **When**: Results are available
- **Then**: Displays list of detected tools to user

#### CH-DETECT-004: detectHandler returns success result
- **Test ID**: CH-DETECT-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Successful detection
- **When**: detectHandler completes
- **Then**: Returns CommandResult with success: true, continue: true

#### CH-DETECT-005: detectHandler handles detection errors
- **Test ID**: CH-DETECT-005
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Detection throws error
- **When**: detectHandler executes
- **Then**: Returns CommandResult with success: false, error message

---

### /migrate Command Handler

#### CH-MIGRATE-001: migrateHandler prompts for target tool selection
- **Test ID**: CH-MIGRATE-001
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Session with scannedTools: ["claude", "cursor"]
- **When**: migrateHandler is called
- **Then**: promptTargetTool() is called with detected tools

#### CH-MIGRATE-002: migrateHandler checks for scan data before migration
- **Test ID**: CH-MIGRATE-002
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Session with no scan data (hasScanned: false)
- **When**: migrateHandler is called
- **Then**: Displays error message prompting user to run /scan first

#### CH-MIGRATE-003: migrateHandler updates selectedTargetTool in session
- **Test ID**: CH-MIGRATE-003
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: User selects "cursor" as target tool
- **When**: Target is selected
- **Then**: Session selectedTargetTool is updated to "cursor"

#### CH-MIGRATE-004: migrateHandler initiates migration workflow
- **Test ID**: CH-MIGRATE-004
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Valid session with scan data and selected target
- **When**: migrateHandler executes
- **Then**: Migration workflow begins using session data

#### CH-MIGRATE-005: migrateHandler returns success on completion
- **Test ID**: CH-MIGRATE-005
- **Priority**: P0 (High)
- **Test Type**: Unit
- **Given**: Successful migration initiation
- **When**: migrateHandler completes
- **Then**: Returns CommandResult with success: true, continue: true

#### CH-MIGRATE-006: migrateHandler handles migration errors
- **Test ID**: CH-MIGRATE-006
- **Priority**: P1 (Medium)
- **Test Type**: Unit
- **Given**: Migration workflow throws error
- **When**: migrateHandler executes
- **Then**: Returns CommandResult with success: false, error details

---

## Integration Tests

### Full REPL Session Flows

#### INT-001: Entry → Help → Exit flow
- **Test ID**: INT-001
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Start AgentLoop with default config
  2. Verify banner and hints displayed
  3. Input: "/help"
  4. Verify help text displayed with all commands
  5. Input: "/exit"
  6. Verify goodbye message and clean exit
- **Expected**: Complete session flow works end-to-end

#### INT-002: Scan → Status flow
- **Test ID**: INT-002
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Start AgentLoop
  2. Input: "/scan"
  3. Select scope: "current"
  4. Wait for scan to complete
  5. Decline migration prompt
  6. Input: "/status"
  7. Verify status shows scan results
- **Expected**: Status displays data from previous scan command

#### INT-003: Detect → Scan → Migrate flow
- **Test ID**: INT-003
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Start AgentLoop
  2. Input: "/detect"
  3. Verify tools detected and displayed
  4. Input: "/scan"
  5. Complete scan workflow
  6. Input: "/migrate"
  7. Select target tool from detected list
  8. Verify migration starts with correct source and target
- **Expected**: Commands share session state correctly across flow

#### INT-004: Multiple scans update state correctly
- **Test ID**: INT-004
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Start AgentLoop
  2. Run "/scan" with scope A, find tools: ["claude"]
  3. Run "/status" - verify shows claude
  4. Run "/scan" with scope B, find tools: ["cursor"]
  5. Run "/status" - verify shows cursor (replaced, not merged)
- **Expected**: Latest scan data replaces previous, timestamp updated

---

### Command Sequences

#### INT-005: Command chaining via registry
- **Test ID**: INT-005
- **Priority**: P1 (Medium)
- **Test Type**: Integration
- **Given**: Custom command handler that invokes another command via registry
- **When**: First command is executed
- **Then**: Second command executes, both results processed correctly

#### INT-006: Error recovery continues session
- **Test ID**: INT-006
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Start AgentLoop
  2. Input: "/unknowncommand"
  3. Verify error message displayed
  4. Verify REPL continues (prompt shown again)
  5. Input: "/help"
  6. Verify help displayed successfully
- **Expected**: Session continues after error, state intact

#### INT-007: Session persists across multiple commands
- **Test ID**: INT-007
- **Priority**: P0 (High)
- **Test Type**: Integration
- **Steps**:
  1. Execute 5 different commands in sequence
  2. Each command checks/modifies session state
  3. Final command verifies all previous state changes
- **Expected**: All state changes accumulated correctly

#### INT-008: State reset clears all session data
- **Test ID**: INT-008
- **Priority**: P1 (Medium)
- **Test Type**: Integration
- **Steps**:
  1. Run "/scan" to populate session
  2. Verify "/status" shows data
  3. (Assuming a reset command exists or direct call)
  4. Clear session state
  5. Run "/status" - verify shows empty state
- **Expected**: Clear operation resets all session fields

---

## E2E Tests

### Complete Agent Mode Sessions

#### E2E-001: Full interactive session with all commands
- **Test ID**: E2E-001
- **Priority**: P0 (High)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync` without arguments
  2. Verify banner and help hints displayed
  3. Type "/help" and verify all commands listed
  4. Type "/detect" and verify tools detected
  5. Type "/scan", select "current" scope
  6. Complete scan, verify results displayed
  7. Decline migration prompt
  8. Type "/status" and verify scan data shown
  9. Type "/exit" and verify graceful shutdown
- **Expected**: All commands work correctly in sequence

#### E2E-002: Scan and migrate workflow end-to-end
- **Test ID**: E2E-002
- **Priority**: P0 (High)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync` with test project directory
  2. Type "/scan", select scope containing test configs
  3. Complete scan with structured results
  4. Accept migration prompt or type "/migrate"
  5. Select target tool from detected list
  6. Complete migration workflow
  7. Verify migration output files created
  8. Type "/exit"
- **Expected**: Migration completes successfully using session data

#### E2E-003: Error recovery and continued usage
- **Test ID**: E2E-003
- **Priority**: P0 (High)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync`
  2. Type "/migrate" without running scan first
  3. Verify error message: "No scan data. Run /scan first."
  4. Type "/scan" and complete successfully
  5. Type "/migrate" again
  6. Select target and complete migration
  7. Type "/exit"
- **Expected**: Error handled gracefully, user can recover and continue

#### E2E-004: Unknown command handling
- **Test ID**: E2E-004
- **Priority**: P0 (High)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync`
  2. Type "/foo"
  3. Verify error: "Unknown command: foo. Type /help for available commands."
  4. Verify prompt returns
  5. Type "/help" - verify works
  6. Type "/exit"
- **Expected**: Helpful error message, session continues

#### E2E-005: Ctrl+C graceful exit
- **Test ID**: E2E-005
- **Priority**: P0 (High)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync`
  2. Press Ctrl+C at prompt
  3. Verify graceful exit with cleanup
- **Expected**: Clean exit, no stack trace, terminal restored

#### E2E-006: Fresh session on re-entry
- **Test ID**: E2E-006
- **Priority**: P1 (Medium)
- **Test Type**: E2E
- **Steps**:
  1. Run `agentsync`, run "/scan", exit
  2. Run `agentsync` again
  3. Type "/status"
  4. Verify shows empty state (no previous session data)
- **Expected**: Each Agent Mode session starts fresh

---

## Test File Structure

```
packages/cli/src/__tests__/
├── agent-loop.spec.ts              # Agent Loop tests (AL-*)
├── command-registry.spec.ts        # Command Registry tests (CR-*)
├── session-state.spec.ts           # Session State tests (SS-*)
└── commands/
    ├── scan.spec.ts                # /scan command tests (CH-SCAN-*)
    ├── status.spec.ts              # /status command tests (CH-STATUS-*)
    ├── help.spec.ts                # /help command tests (CH-HELP-*)
    ├── exit.spec.ts                # /exit command tests (CH-EXIT-*)
    ├── detect.spec.ts              # /detect command tests (CH-DETECT-*)
    └── migrate.spec.ts             # /migrate command tests (CH-MIGRATE-*)

packages/e2e/
└── agent-loop.e2e-spec.ts          # E2E tests (E2E-*)
```

---

## Running Tests

```bash
# Run all agent loop tests
pnpm test -- packages/cli/src/__tests__/agent-loop.spec.ts

# Run all interactive module tests
pnpm test -- packages/cli/src/__tests__/

# Run specific test file
pnpm test -- packages/cli/src/__tests__/commands/scan.spec.ts

# Run all integration tests
pnpm test -- packages/cli/src/__tests__/*.integration.spec.ts

# Run E2E tests
pnpm test -- packages/e2e/agent-loop.e2e-spec.ts

# Run with coverage
pnpm test -- --coverage packages/cli/src/__tests__/

# Run specific test by name
pnpm test -- --testNamePattern="AL-INIT-001"
```

---

## Coverage Requirements

| Component | Target Coverage |
|-----------|-----------------|
| Agent Loop (agent-loop.ts) | 95% |
| Command Registry (command-registry.ts) | 95% |
| Session State (session-state.ts) | 95% |
| /scan Command | 90% |
| /status Command | 90% |
| /help Command | 90% |
| /exit Command | 90% |
| /detect Command | 85% |
| /migrate Command | 85% |
| Overall Interactive Package | 90% |

---

## Mock Data

```typescript
// Mock Session State
export const mockEmptySession: SessionState = {
  scannedTools: [],
  detectedAgents: [],
  detectedSkills: [],
  detectedMCPs: [],
  scanPaths: [],
  selectedTargetTool: null,
  scanTimestamp: null,
  hasScanned: false
};

export const mockPopulatedSession: SessionState = {
  scannedTools: ["claude", "cursor"],
  detectedAgents: ["agent1", "agent2"],
  detectedSkills: ["skill1"],
  detectedMCPs: ["mcp1"],
  scanPaths: ["/path/to/project"],
  selectedTargetTool: "cursor",
  scanTimestamp: new Date("2026-04-01T10:00:00Z"),
  hasScanned: true
};

// Mock Command Metadata
export const mockScanCommand: CommandMetadata = {
  name: "/scan",
  description: "Scan for agents, tools, and MCP servers",
  usage: "/scan [path] [--current-dir]",
  aliases: ["s"]
};

export const mockHelpCommand: CommandMetadata = {
  name: "/help",
  description: "Show available commands",
  usage: "/help [command]",
  aliases: ["h", "?"]
};

// Mock Command Handlers
export const mockSuccessHandler: CommandHandler = async (args, context) => ({
  success: true,
  message: "Command executed successfully",
  continue: true
});

export const mockExitHandler: CommandHandler = async (args, context) => ({
  success: true,
  message: "Goodbye!",
  continue: false
});

export const mockErrorHandler: CommandHandler = async (args, context) => ({
  success: false,
  message: "Command failed",
  continue: true,
  error: new Error("Test error")
});

// Mock Scan Results
export const mockScanResults: ScanResults = {
  tools: ["claude", "cursor"],
  agents: ["my-agent"],
  skills: ["my-skill"],
  mcps: ["filesystem-mcp"],
  paths: ["/test/project"],
  timestamp: new Date()
};
```

---

## Security Test Cases

| ID | Description | Criteria |
|----|-------------|----------|
| SEC-INT-001 | Input validation prevents injection | Malicious input doesn't crash or execute code |
| SEC-INT-002 | Custom paths are sanitized | Path traversal attempts are blocked |
| SEC-INT-003 | API keys not displayed in status | Session state masks sensitive values |
| SEC-INT-004 | Session data not persisted between runs | No session files written to disk |

---

## Performance Test Cases

| ID | Description | Criteria |
|----|-------------|----------|
| PERF-INT-001 | REPL startup time | < 500ms from command to prompt |
| PERF-INT-002 | Command execution latency | < 100ms from input to output |
| PERF-INT-003 | Status display with large state | Handles 1000+ detected items smoothly |
| PERF-INT-004 | Memory usage | < 50MB for typical session |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| Actual filesystem scanning | Mocked, tested in Scanner module |
| Actual migration execution | Mocked, tested in Migration module |
| Readline implementation details | Uses Node.js built-in, well-tested |
| Terminal color output | Chalk behavior, external library |
| Prompt library internals | Inquirer.js behavior, external library |

---

## Related Test Cases

- AI Mapping Engine tests (`packages/core/src/ai-mapping/TEST-CASES.md`)
- AI Scanner tests (`packages/core/src/ai-scanner/TEST-CASES.md`)
- CLI Command tests (`packages/cli/src/commands/TEST-CASES.md`)
- Smart Agent Scanner tests (S3-01 to S3-06 in implementation plan)

---

*Document End — Agent Loop Test Cases v1.0*
