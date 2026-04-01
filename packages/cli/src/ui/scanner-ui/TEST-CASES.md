# Test Cases: Scanner UI

Generated from: `packages/cli/src/ui/scanner-ui/SPEC.md`
Generated on: 2026-04-01

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit Tests | 12 | 8 | 3 | 1 |
| Integration Tests | 2 | 2 | 0 | 0 |
| E2E Tests | 0 | 0 | 0 | 0 |
| **Total** | 14 | 10 | 3 | 1 |

---

## Unit Tests

### Constructor and Initialization

#### UNIT-SCANNER-UI-001: Constructor initializes with default options
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: No options provided
- **When**: ScannerUI is instantiated
- **Then**: 
  - Internal spinner is null
  - Internal state counters are zeroed
  - silent mode is false
  - verbose mode is false

#### UNIT-SCANNER-UI-002: Constructor accepts and stores options
- **Priority**: P1
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Options { silent: true, verbose: true }
- **When**: ScannerUI is instantiated
- **Then**: 
  - silent mode is true
  - verbose mode is true

### Scan Lifecycle

#### UNIT-SCANNER-UI-003: startScan creates spinner with correct text for 'current' scope
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: ScannerUI instance
- **When**: startScan('current') is called
- **Then**: 
  - ora is called with text containing "current directory"
  - Spinner starts spinning
  - Internal state is reset

#### UNIT-SCANNER-UI-004: startScan creates spinner with correct text for 'system' scope
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: ScannerUI instance
- **When**: startScan('system') is called
- **Then**: 
  - ora is called with text containing "system-wide"
  - Spinner starts spinning

#### UNIT-SCANNER-UI-005: startScan creates spinner with custom path
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: ScannerUI instance with custom path
- **When**: startScan('custom', '/custom/path') is called
- **Then**: 
  - ora is called with text containing the custom path
  - Spinner starts spinning

### Progress Updates

#### UNIT-SCANNER-UI-006: updateProgress updates spinner text with current directory
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan with spinner
- **When**: updateProgress({ currentDirectory: '/some/path', ... }) is called
- **Then**: 
  - Spinner text is updated to show current directory
  - Text includes scanning indicator

#### UNIT-SCANNER-UI-007: updateProgress shows incremental counts
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan with entities found
- **When**: updateProgress with non-zero counts is called
- **Then**: 
  - Spinner text includes counts (e.g., "Found 3 agents, 2 skills...")
  - All count types are represented (agents, skills, mcpServers)

### Entity Discovery Reports

#### UNIT-SCANNER-UI-008: reportAgentFound displays success checkmark
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan
- **When**: reportAgentFound('my-agent', '/path/to/agent') is called
- **Then**: 
  - Success message displayed with checkmark
  - Agent name appears in output
  - Source path is truncated appropriately
  - Internal agent count increments

#### UNIT-SCANNER-UI-009: reportSkillFound displays success checkmark
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan
- **When**: reportSkillFound('my-skill', '/path/to/skill') is called
- **Then**: 
  - Success message displayed with checkmark
  - Skill name appears in output
  - Internal skill count increments

#### UNIT-SCANNER-UI-010: reportMCPServerFound displays success checkmark
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan
- **When**: reportMCPServerFound('my-server', '/path/to/server') is called
- **Then**: 
  - Success message displayed with checkmark
  - Server name appears in output
  - Internal MCP server count increments

#### UNIT-SCANNER-UI-011: reportToolDetected displays tool information
- **Priority**: P1
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan
- **When**: reportToolDetected('opencode') is called
- **Then**: 
  - Info message displayed with tool name
  - Tool added to internal detected tools list

### Completion and Summary

#### UNIT-SCANNER-UI-012: completeScan displays formatted summary with all sections
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Scan completed with results
- **When**: completeScan(summary) is called with complete data
- **Then**: 
  - Spinner stops with success state
  - Tools detected list is displayed
  - Agent count and names shown (first 3)
  - "N more..." appears when more than 3 agents
  - Skill count displayed
  - MCP server count displayed
  - Scan duration shown
  - Paths scanned listed

#### UNIT-SCANNER-UI-013: completeScan handles empty results gracefully
- **Priority**: P1
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Scan completed with no results
- **When**: completeScan(emptySummary) is called
- **Then**: 
  - Spinner stops with success state
  - "No configurations found" message displayed
  - Summary sections are empty but present

#### UNIT-SCANNER-UI-014: failScan displays error with failure state
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan that encountered error
- **When**: failScan(error) is called
- **Then**: 
  - Spinner stops with failure state (red X)
  - Error message is displayed
  - Error is formatted with red color
  - Helpful troubleshooting tip shown

### Silent Mode

#### UNIT-SCANNER-UI-015: Silent mode suppresses ora calls
- **Priority**: P1
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: ScannerUI with silent: true
- **When**: All methods are called (startScan, updateProgress, etc.)
- **Then**: 
  - No ora spinner is created
  - No console output is produced
  - Internal state still tracks correctly

### Multiple Directories

#### UNIT-SCANNER-UI-016: Multiple directory scans accumulate counts correctly
- **Priority**: P2
- **File**: `packages/cli/src/__tests__/scanner-ui.spec.ts`
- **Given**: Active scan across multiple directories
- **When**: Multiple reportAgentFound calls from different directories
- **Then**: 
  - Agent count accumulates correctly
  - Each directory's results tracked
  - Final summary shows combined totals

---

## Integration Tests

### ScannerUI with AIDirectoryScanner

#### INT-SCANNER-001: ScannerUI receives callbacks from AIDirectoryScanner
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/scanner-ui.integration.spec.ts`
- **Given**: ScannerUI and AIDirectoryScanner configured with callbacks
- **When**: Scanner runs and discovers entities
- **Then**: 
  - onProgress updates spinner text
  - onAgentFound displays checkmark
  - onSkillFound displays checkmark
  - onComplete displays summary

#### INT-SCANNER-002: Scan command uses ScannerUI for real-time feedback
- **Priority**: P0
- **File**: `packages/cli/src/__tests__/commands/scan.integration.spec.ts`
- **Given**: Interactive scan command with ScannerUI
- **When**: User runs /scan command
- **Then**: 
  - ScannerUI.startScan is called
  - Real-time updates displayed during scan
  - Final summary shown after completion

---

## Error Handling Tests

| ID | Description | Priority |
|----|-------------|----------|
| ERR-001 | Directory not found displays appropriate error | P0 |
| ERR-002 | Permission denied displays appropriate error | P0 |
| ERR-003 | Scanner timeout displays timeout message | P1 |
| ERR-004 | Invalid config displays warning but continues | P1 |

---

## Mock Data

```typescript
// packages/cli/src/__tests__/fixtures/scanner-ui.ts

export const mockScanProgress = {
  currentDirectory: '/home/user/.config/opencode',
  directoriesScanned: 2,
  totalDirectories: 5,
  agentsFound: 3,
  skillsFound: 7,
  mcpServersFound: 2,
  toolsDetected: ['opencode', 'claude']
};

export const mockScanSummary = {
  toolsDetected: ['opencode', 'claude'],
  totalAgents: 5,
  totalSkills: 14,
  totalMCPServers: 2,
  scannedPaths: [
    '/home/user/.config/opencode',
    './.opencode'
  ],
  duration: 1250,
  success: true
};

export const mockEmptyScanSummary = {
  toolsDetected: [],
  totalAgents: 0,
  totalSkills: 0,
  totalMCPServers: 0,
  scannedPaths: [],
  duration: 100,
  success: true
};

export const mockScanError = new Error('Permission denied: /root/.config');
```

---

## Running Tests

```bash
# Run all scanner-ui tests
pnpm test -- --testPathPattern=scanner-ui

# Run unit tests only
pnpm test -- packages/cli/src/__tests__/scanner-ui.spec.ts

# Run integration tests
pnpm test -- packages/cli/src/__tests__/scanner-ui.integration.spec.ts

# Run with coverage
pnpm test -- --coverage --testPathPattern=scanner-ui
```

---

## Coverage Requirements

| Category | Target | Notes |
|----------|--------|-------|
| ScannerUI class | 95%+ | All public methods tested |
| Error handling | 100% | All error cases covered |
| Integration with scanner | 90%+ | Callback flow tested |
| Silent mode | 100% | Test all methods in silent mode |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| ora spinner animation frames | Third-party library, tested separately |
| chalk color output | Terminal formatting, not functional logic |
| Console clearing behavior | Terminal-specific, not deterministic |
| Unicode character rendering | Terminal-dependent behavior |

---

*Last Updated: 2026-04-01*
*Phase: Sprint 4 Phase 1.5*
