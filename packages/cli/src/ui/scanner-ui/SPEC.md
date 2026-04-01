# Scanner UI Specification

**Feature**: Scanner UI with Ora Spinner  
**Task ID**: S4-18H  
**Package**: CLI (`packages/cli/src/ui/`)  
**Status**: In Progress  
**Phase**: Sprint 4 Phase 1.5  

---

## Overview

The Scanner UI provides real-time visual feedback during the AI-powered directory scanning process. It uses the `ora` package to display animated spinners, incremental progress updates, and structured scan results. The UI bridges the gap between the AIDirectoryScanner engine and the user, showing which directories are being scanned, what entities are discovered, and providing clear success/failure feedback.

The ScannerUI class integrates with the AIDirectoryScanner via callback hooks to receive real-time updates as the scan progresses through different directories and discovers agents, skills, and MCP servers.

---

## Files

| File | Purpose |
|------|---------|
| `packages/cli/src/ui/scanner-ui.ts` | Main ScannerUI class with ora spinner integration |
| `packages/cli/src/ui/index.ts` | Re-exports ScannerUI for public API |
| `packages/cli/src/interactive/commands/scan.ts` | Updated to use ScannerUI for real-time feedback |
| `packages/cli/src/__tests__/scanner-ui.spec.ts` | Unit tests for ScannerUI class |

---

## Types

### ScanProgress

```typescript
interface ScanProgress {
  currentDirectory: string;
  directoriesScanned: number;
  totalDirectories: number;
  agentsFound: number;
  skillsFound: number;
  mcpServersFound: number;
  toolsDetected: string[];
}
```

### ScanCallbacks

```typescript
interface ScanCallbacks {
  onDirectoryStart: (directory: string) => void;
  onDirectoryComplete: (directory: string, results: DirectoryResults) => void;
  onAgentFound: (agentName: string, source: string) => void;
  onSkillFound: (skillName: string, source: string) => void;
  onMCPServerFound: (serverName: string, source: string) => void;
  onToolDetected: (toolName: string) => void;
  onComplete: (summary: ScanSummary) => void;
  onError: (error: Error) => void;
}
```

### DirectoryResults

```typescript
interface DirectoryResults {
  agents: string[];
  skills: string[];
  mcpServers: string[];
}
```

### ScanSummary

```typescript
interface ScanSummary {
  toolsDetected: string[];
  totalAgents: number;
  totalSkills: number;
  totalMCPServers: number;
  scannedPaths: string[];
  duration: number;
  success: boolean;
}
```

---

## ScannerUI Class

### Constructor

```typescript
constructor(options?: ScannerUIOptions)
```

**Parameters:**
- `options.verbose` (boolean): Show detailed output during scanning
- `options.silent` (boolean): Suppress all spinner output (for testing)

### Methods

#### startScan(scope: ScanScope)

Starts the scanning process with initial spinner state.

```typescript
startScan(scope: ScanScope): void
```

**Behavior:**
- Creates an ora spinner with initial text based on scope
- Displays "Scanning {scope}..." with animated spinner
- Sets up internal state tracking

#### updateProgress(progress: ScanProgress)

Updates the spinner text with current progress information.

```typescript
updateProgress(progress: ScanProgress): void
```

**Behavior:**
- Updates spinner text to show current directory being scanned
- Shows incremental counts: "Found X agents, Y skills..."
- Animates through different spinner characters

#### reportAgentFound(agentName: string, source: string)

Reports discovery of an agent configuration.

```typescript
reportAgentFound(agentName: string, source: string): void
```

**Behavior:**
- Displays success checkmark with agent name
- Shows truncated source path
- Updates internal agent count

#### reportSkillFound(skillName: string, source: string)

Reports discovery of a skill.

```typescript
reportSkillFound(skillName: string, source: string): void
```

**Behavior:**
- Displays success checkmark with skill name
- Shows truncated source path
- Updates internal skill count

#### reportMCPServerFound(serverName: string, source: string)

Reports discovery of an MCP server.

```typescript
reportMCPServerFound(serverName: string, source: string): void
```

**Behavior:**
- Displays success checkmark with server name
- Updates internal MCP server count

#### reportToolDetected(toolName: string)

Reports detection of a tool configuration.

```typescript
reportToolDetected(toolName: string): void
```

**Behavior:**
- Displays info message with tool name
- Adds to list of detected tools

#### completeScan(summary: ScanSummary)

Finalizes the scan with structured results display.

```typescript
completeScan(summary: ScanSummary): void
```

**Behavior:**
- Stops spinner with success/failure state
- Displays formatted summary with:
  - Tools detected list
  - Total agents with names (first 3 + "N more...")
  - Total skills
  - Total MCP servers
  - Scan duration
  - Paths scanned
- Uses chalk for colorized output

#### failScan(error: Error)

Handles scan failure with error display.

```typescript
failScan(error: Error): void
```

**Behavior:**
- Stops spinner with failure state
- Displays error message in red
- Shows helpful troubleshooting tip

---

## Display Format

### During Scanning

```
Scanning ~/.config/opencode...  ⠋
✓ Found 3 agent configs
✓ Found 2 MCP servers
Scanning ./.opencode...         ⠙
✓ Found 2 agents
✓ Found 14 skills
Analyzing with AI...            ⠹
✓ Validated 3 agents
```

### Final Summary

```
═══════════════════════════════════════════
           SCAN COMPLETE
═══════════════════════════════════════════

Tools Detected:
  ✔ OpenCode (project + global)

Agents Found: 5
  • engineering-agent
  • test-runner-agent
  • (3 more...)

Skills Found: 14
MCP Servers: 2

Locations:
  ~/.config/opencode
  ./.opencode

Duration: 1.2s
═══════════════════════════════════════════
```

---

## Integration with AIDirectoryScanner

The ScannerUI integrates with AIDirectoryScanner through callback registration:

```typescript
const scannerUI = new ScannerUI();
const scanner = new AIDirectoryScanner({
  onProgress: (progress) => scannerUI.updateProgress(progress),
  onAgentFound: (agent, source) => scannerUI.reportAgentFound(agent, source),
  onSkillFound: (skill, source) => scannerUI.reportSkillFound(skill, source),
  onMCPServerFound: (server, source) => scannerUI.reportMCPServerFound(server, source),
  onToolDetected: (tool) => scannerUI.reportToolDetected(tool),
  onComplete: (summary) => scannerUI.completeScan(summary),
  onError: (error) => scannerUI.failScan(error)
});

scannerUI.startScan('system');
await scanner.scan(scope);
```

---

## Error Handling

| Error Scenario | Response |
|----------------|----------|
| Directory not found | Spinner fails with "Directory not accessible: {path}" |
| Permission denied | Spinner fails with "Permission denied: {path}" |
| Scanner timeout | Spinner fails with "Scan timeout after {duration}s" |
| Invalid config found | Warning displayed, scan continues |
| Empty scan results | Success state with "No configurations found" message |

---

## Test Scenarios

### Unit Tests

1. **Constructor initializes with default options**
   - Verify spinner is null initially
   - Verify internal state is reset

2. **startScan creates spinner with correct text**
   - Verify ora is called with scope-specific text
   - Verify spinner state is 'spinning'

3. **updateProgress updates spinner text**
   - Verify text includes current directory
   - Verify counts are displayed correctly

4. **reportAgentFound displays success message**
   - Verify checkmark is displayed
   - Verify agent name appears

5. **reportSkillFound displays success message**
   - Verify checkmark is displayed
   - Verify skill name appears

6. **reportMCPServerFound displays success message**
   - Verify checkmark is displayed
   - Verify server name appears

7. **completeScan displays formatted summary**
   - Verify tools list is displayed
   - Verify agent names are truncated after 3
   - Verify counts are correct
   - Verify duration is shown

8. **failScan displays error with spinner failure**
   - Verify spinner fails with error message
   - Verify error is formatted in red

9. **silent mode suppresses output**
   - Verify no ora calls when silent: true
   - Verify methods still track internal state

10. **Multiple directory scans update correctly**
    - Verify counts accumulate across directories
    - Verify spinner text updates with each directory

### Integration Tests

1. **ScannerUI integrates with AIDirectoryScanner**
   - Verify callbacks are invoked correctly
   - Verify progress updates flow through

2. **Scan command uses ScannerUI**
   - Verify scan.ts creates ScannerUI instance
   - Verify UI updates during actual scan

---

## Acceptance Criteria

- [x] Uses `ora` package for animated spinners
- [x] Shows real-time progress during scanning
- [x] Displays current directory being scanned
- [x] Shows incremental results ("Found X agents...")
- [x] Updates spinner text dynamically
- [x] Supports success/fail states with visual feedback
- [x] Shows final summary with structured output
- [x] Colorized output using chalk
- [x] Truncates long agent lists (show first 3 + "N more...")
- [x] Displays scan duration
- [x] Silent mode for testing
- [x] Integrates with AIDirectoryScanner via callbacks
- [x] Unit tests for all public methods
- [x] Integration with scan command

---

## Dependencies

### Required

- `ora` - CLI spinner library
- `chalk` - Terminal color formatting
- `packages/core/src/ai-scanner/aidirectory-scanner.ts` - Scanner engine

### Optional

- `packages/cli/src/ui/spinner.ts` - Existing spinner utilities (may extend)

---

## Deferred Features

- Progress bar for percentage-based completion (requires total file count upfront)
- Multi-line spinner updates (requires ora v6+ features)
- Sound notifications on completion (requires optional dependency)
- JSON output mode for programmatic use

---

*Last Updated: 2026-04-01*
*Phase: Sprint 4 Phase 1.5*
