# Test Cases: ResultsPanel

Generated from: `packages/cli/src/ui-ink/components/ResultsPanel/SPEC.md`
Generated on: 2026-04-01

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit (Rendering) | 12 | 8 | 3 | 1 |
| Unit (Keyboard Navigation) | 10 | 8 | 2 | 0 |
| Unit (Error States) | 6 | 4 | 2 | 0 |
| Unit (Empty States) | 4 | 3 | 1 | 0 |
| Integration | 5 | 4 | 1 | 0 |
| E2E | 5 | 4 | 1 | 0 |
| **Total** | **42** | **31** | **10** | **1** |

---

## Unit Tests: Rendering

### Scan Results View

#### UNIT-RESULTS-001: ResultsPanel renders scan results view with header
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with `mode="scan"` and valid `scanResult` prop
- **When**: Component renders
- **Then**: Displays "Scan Complete" header with success indicator

#### UNIT-RESULTS-002: ResultsPanel displays scan summary statistics
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with duration=1230ms and filesScanned=47
- **When**: Component renders
- **Then**: Displays "Duration: 1.23s" and "Files scanned: 47"

#### UNIT-RESULTS-003: ResultsPanel displays tools detected section
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with tools array containing detected tools
- **When**: Component renders
- **Then**: Displays "Tools Detected" section with tool names and icons

#### UNIT-RESULTS-004: ResultsPanel displays agents found with paths
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with agents array containing names and paths
- **When**: Component renders
- **Then**: Displays each agent name with full file path

#### UNIT-RESULTS-005: ResultsPanel truncates long agent lists
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with more than 5 agents
- **When**: Component renders
- **Then**: Displays first 5 agents and "... and X more" message

#### UNIT-RESULTS-006: ResultsPanel displays skills and MCP sections
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with skills and mcps arrays
- **When**: Component renders
- **Then**: Displays "Skills Found" and "MCP Servers" sections with counts

### Migration Results View

#### UNIT-RESULTS-007: ResultsPanel renders migration results view
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with `mode="migration"` and valid `migrationResult`
- **When**: Component renders
- **Then**: Displays "Migration Complete" header with success status

#### UNIT-RESULTS-008: ResultsPanel displays source and target tools
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with sourceTool="opencode" and targetTool="claude"
- **When**: Component renders
- **Then**: Displays "From: OpenCode" and "To: Claude Code" with tool icons

#### UNIT-RESULTS-009: ResultsPanel displays migration counts
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with success=14, error=1, skipped=0
- **When**: Component renders
- **Then**: Displays "14 Success", "1 Failed", "0 Skipped" with status icons

#### UNIT-RESULTS-010: ResultsPanel displays migrated items with source and target paths
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with migratedAgents containing sourcePath and targetPath
- **When**: Component renders
- **Then**: Displays each item with both source and target file paths

#### UNIT-RESULTS-011: ResultsPanel displays created files list
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with createdFiles array
- **When**: Component renders
- **Then**: Displays "Created Files" section with file type icons and paths

#### UNIT-RESULTS-012: ResultsPanel displays backup information
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with backup info containing path and timestamp
- **When**: Component renders
- **Then**: Displays backup path and creation time

---

## Unit Tests: Keyboard Navigation

#### UNIT-RESULTS-013: ResultsPanel calls onAction with continue on Enter key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with onAction mock
- **When**: User presses Enter key
- **Then**: onAction called with `{ type: 'continue' }`

#### UNIT-RESULTS-014: ResultsPanel calls onAction with new-migration on 'm' key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with onAction mock
- **When**: User presses 'm' key
- **Then**: onAction called with `{ type: 'new-migration' }`

#### UNIT-RESULTS-015: ResultsPanel calls onAction with scan-again on 's' key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with onAction mock
- **When**: User presses 's' key
- **Then**: onAction called with `{ type: 'scan-again' }`

#### UNIT-RESULTS-016: ResultsPanel calls onExit on 'q' key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with onExit mock
- **When**: User presses 'q' key
- **Then**: onExit called

#### UNIT-RESULTS-017: ResultsPanel calls onAction with export on 'e' key
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with onAction mock
- **When**: User presses 'e' key
- **Then**: onAction called with `{ type: 'export', format: 'json' }`

#### UNIT-RESULTS-018: ResultsPanel toggles expanded view on 'v' key
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with collapsible sections
- **When**: User presses 'v' key
- **Then**: All sections expand/collapse (expanded state toggles)

#### UNIT-RESULTS-019: ResultsPanel scrolls up with up arrow key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component with content exceeding viewport
- **When**: User presses up arrow key
- **Then**: Scroll offset decreases by 1 (content scrolls up)

#### UNIT-RESULTS-020: ResultsPanel scrolls down with down arrow key
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component with content exceeding viewport
- **When**: User presses down arrow key
- **Then**: Scroll offset increases by 1 (content scrolls down)

#### UNIT-RESULTS-021: ResultsPanel prevents scrolling above content start
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component at scroll offset 0
- **When**: User presses up arrow key
- **Then**: Scroll offset remains at 0 (no negative scrolling)

#### UNIT-RESULTS-022: ResultsPanel prevents scrolling below content end
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component at maximum scroll offset
- **When**: User presses down arrow key
- **Then**: Scroll offset remains at maximum (no overscroll)

---

## Unit Tests: Error States

#### UNIT-RESULTS-023: ResultsPanel shows error when mode=scan but no scanResult provided
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with `mode="scan"` but scanResult is undefined
- **When**: Component renders
- **Then**: Displays "No scan results available" error message

#### UNIT-RESULTS-024: ResultsPanel shows error when mode=migration but no migrationResult provided
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Component mounted with `mode="migration"` but migrationResult is undefined
- **When**: Component renders
- **Then**: Displays "No migration results available" error message

#### UNIT-RESULTS-025: ResultsPanel displays migration errors section
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with errors array containing error messages
- **When**: Component renders
- **Then**: Displays "Errors" section with each error message and context

#### UNIT-RESULTS-026: ResultsPanel displays warnings section
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with warnings array
- **When**: Component renders
- **Then**: Displays warnings section with warning messages

#### UNIT-RESULTS-027: ResultsPanel shows partial success state with errors
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with success=false but some items succeeded
- **When**: Component renders
- **Then**: Displays "Completed with Errors" header with both success and error counts

#### UNIT-RESULTS-028: ResultsPanel handles invalid tool IDs gracefully
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with unknown tool ID
- **When**: Component renders
- **Then**: Displays tool name with generic icon, no crash

---

## Unit Tests: Empty States

#### UNIT-RESULTS-029: ResultsPanel shows empty state when scan finds no entities
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan result with empty agents, skills, and mcps arrays
- **When**: Component renders
- **Then**: Displays "No agents, skills, or MCPs found" message

#### UNIT-RESULTS-030: ResultsPanel shows empty state when no files created
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with empty createdFiles array
- **When**: Component renders
- **Then**: Displays "No files were created" message

#### UNIT-RESULTS-031: ResultsPanel shows error view when all items failed
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Migration result with all items having status='error'
- **When**: Component renders
- **Then**: Displays error-focused view with retry option indicators

#### UNIT-RESULTS-032: ResultsPanel handles missing optional fields gracefully
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx`
- **Given**: Scan/migration result with missing optional fields (description, version)
- **When**: Component renders
- **Then**: Uses defaults, displays "Unknown" for missing names, no crash

---

## Integration Tests

#### INT-RESULTS-001: ResultsPanel integrates with ScanView flow
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx`
- **Given**: ScanView with ResultsPanel for results display
- **When**: Scan completes and user presses 'm' for new migration
- **Then**: onAction callback triggers navigation to MigrationView with scan data

#### INT-RESULTS-002: ResultsPanel integrates with MigrationView flow
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx`
- **Given**: MigrationView with ResultsPanel for results display
- **When**: Migration completes and user presses 's' for scan again
- **Then**: onAction callback triggers navigation back to ScanView

#### INT-RESULTS-003: ResultsPanel passes correct data through callbacks
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx`
- **Given**: ResultsPanel within parent component with action handlers
- **When**: User triggers various keyboard actions
- **Then**: Parent receives correct action types with complete payload data

#### INT-RESULTS-004: ResultsPanel handles rapid navigation key presses
- **Priority**: P1
- **File**: `packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx`
- **Given**: Component with keyboard navigation enabled
- **When**: User rapidly presses multiple navigation keys
- **Then**: Handles keys sequentially without crashes or duplicate actions

#### INT-RESULTS-005: ResultsPanel scroll state persists during re-renders
- **Priority**: P0
- **File**: `packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx`
- **Given**: Component with scrolled content that re-renders
- **When**: Parent component updates causing re-render
- **Then**: Scroll offset is preserved, user position maintained

---

## E2E Tests

#### E2E-RESULTS-001: Complete scan flow displays ResultsPanel with scan results
- **Priority**: P0
- **File**: `packages/e2e/ResultsPanel.e2e-spec.ts`
- **Steps**:
  1. Start AgentSync CLI
  2. Select "Scan" from main menu
  3. Wait for scan to complete
  4. Verify ResultsPanel displays with scan data
- **Expected**: ResultsPanel shows scan duration, tools detected, agents, skills, and MCPs

#### E2E-RESULTS-002: Complete migration flow displays ResultsPanel with migration results
- **Priority**: P0
- **File**: `packages/e2e/ResultsPanel.e2e-spec.ts`
- **Steps**:
  1. Start AgentSync CLI
  2. Configure source and target tools
  3. Run migration
  4. Wait for migration to complete
  5. Verify ResultsPanel displays with migration data
- **Expected**: ResultsPanel shows source/target tools, success/error counts, created files, and backup info

#### E2E-RESULTS-003: Navigate to new migration from scan results
- **Priority**: P0
- **File**: `packages/e2e/ResultsPanel.e2e-spec.ts`
- **Steps**:
  1. Complete a scan to reach ResultsPanel
  2. Press 'm' key
  3. Verify navigation to migration configuration
- **Expected**: ResultsPanel closes, MigrationView opens with scan data pre-populated

#### E2E-RESULTS-004: Navigate to scan again from migration results
- **Priority**: P0
- **File**: `packages/e2e/ResultsPanel.e2e-spec.ts`
- **Steps**:
  1. Complete a migration to reach ResultsPanel
  2. Press 's' key
  3. Verify navigation to scan view
- **Expected**: ResultsPanel closes, ScanView opens ready for new scan

#### E2E-RESULTS-005: Export results functionality works end-to-end
- **Priority**: P1
- **File**: `packages/e2e/ResultsPanel.e2e-spec.ts`
- **Steps**:
  1. Complete scan or migration to reach ResultsPanel
  2. Press 'e' key to export
  3. Verify export file is created with correct format
- **Expected**: Results exported to JSON file with complete data structure

---

## Security Tests

| ID | Description | Criteria |
|----|-------------|----------|
| SEC-RESULTS-001 | API keys masked in display | No plaintext API keys in ResultsPanel output |
| SEC-RESULTS-002 | File paths sanitized | No sensitive path information leaked |
| SEC-RESULTS-003 | Error messages safe | No stack traces or internal details in user-facing errors |

---

## Accessibility Tests

| ID | Description | Priority |
|----|-------------|----------|
| ACC-RESULTS-001 | Keyboard-only navigation works | P0 |
| ACC-RESULTS-002 | Action shortcuts visible | P0 |
| ACC-RESULTS-003 | Color contrast meets standards | P1 |
| ACC-RESULTS-004 | Status indicators have text alternatives | P0 |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| Ink library internals | Third-party library has its own tests |
| Terminal color rendering | Platform-dependent, not functional |
| Exact ANSI escape sequences | Implementation detail |
| React reconciliation internals | Framework responsibility |

---

## Mock Data

```typescript
// packages/cli/src/ui-ink/components/ResultsPanel/__tests__/fixtures.ts

export const mockScanResult = {
  duration: 1230,
  filesScanned: 47,
  timestamp: '2026-04-01T14:30:22Z',
  tools: [
    { id: 'opencode', name: 'OpenCode', icon: '🔵', version: '1.0.0' }
  ],
  agents: [
    { name: 'test-runner-agent', tool: 'opencode', path: './.opencode/agents/test-runner-agent.md' },
    { name: 'engineering-agent', tool: 'opencode', path: './.opencode/agents/engineering-agent.md' }
  ],
  skills: [
    { name: 'spec-writer', tool: 'opencode', path: './.opencode/skills/spec-writer/SKILL.md' },
    { name: 'test-generator', tool: 'opencode', path: './.opencode/skills/test-generator/SKILL.md' }
  ],
  mcps: [],
  paths: ['./.opencode']
};

export const mockMigrationResult = {
  success: true,
  sourceTool: 'opencode',
  targetTool: 'claude',
  duration: 2450,
  timestamp: '2026-04-01T14:32:45Z',
  migratedAgents: [
    {
      name: 'test-runner-agent',
      sourcePath: './.opencode/agents/test-runner-agent.md',
      targetPath: '~/.config/claude/agents/test-runner-agent.md',
      status: 'success' as const
    }
  ],
  migratedSkills: [
    {
      name: 'spec-writer',
      sourcePath: './.opencode/skills/spec-writer/SKILL.md',
      targetPath: '~/.config/claude/skills/spec-writer/',
      status: 'success' as const
    }
  ],
  migratedMCPs: [],
  createdFiles: [
    { path: '~/.config/claude/settings.json', type: 'config' as const, size: 1024 },
    { path: '~/.config/claude/agents/', type: 'agent' as const }
  ],
  errors: [],
  warnings: [],
  backup: {
    path: '~/.agentsync/backups/20250401-143022/',
    timestamp: '2026-04-01T14:30:22Z',
    size: 4096
  }
};

export const mockMigrationResultWithErrors = {
  ...mockMigrationResult,
  success: false,
  migratedAgents: [
    {
      name: 'test-validator',
      sourcePath: './.opencode/agents/test-validator.md',
      targetPath: '~/.config/claude/agents/test-validator.md',
      status: 'error' as const,
      error: 'Failed to parse YAML frontmatter'
    }
  ],
  errors: [
    { message: 'Failed to parse YAML frontmatter', context: 'test-validator', recoverable: false },
    { message: 'Permission denied', context: 'config-backup', recoverable: true }
  ]
};

export const mockEmptyScanResult = {
  duration: 500,
  filesScanned: 10,
  timestamp: '2026-04-01T14:30:22Z',
  tools: [],
  agents: [],
  skills: [],
  mcps: [],
  paths: []
};
```

---

## Running Tests

```bash
# Run all ResultsPanel tests
pnpm test -- --testPathPattern=ResultsPanel

# Run unit tests only
pnpm test -- packages/cli/src/ui-ink/components/ResultsPanel/__tests__/ResultsPanel.spec.tsx

# Run integration tests
pnpm test -- packages/cli/src/ui-ink/__tests__/ResultsPanel.integration.spec.tsx

# Run E2E tests
pnpm test -- packages/e2e/ResultsPanel.e2e-spec.ts

# Run with coverage
pnpm test -- --coverage --testPathPattern=ResultsPanel

# Run in watch mode
pnpm test -- --watch --testPathPattern=ResultsPanel
```

---

## Coverage Requirements

| Category | Target | Notes |
|----------|--------|-------|
| Rendering Logic | 95% | All visual states covered |
| Keyboard Navigation | 100% | All key handlers tested |
| Error Handling | 100% | All error states covered |
| Data Display | 90% | Formatting and truncation |
| Integration | 85% | Component interactions |
| E2E | Key flows | Main user journeys |

---

## Test Implementation Notes

### Ink Testing Setup

```typescript
// Test setup for Ink components
import { render } from 'ink-testing-library';

const setup = (props: Partial<ResultsPanelProps> = {}) => {
  const onAction = vi.fn();
  const onExit = vi.fn();
  
  const utils = render(
    <ResultsPanel
      mode="scan"
      scanResult={mockScanResult}
      onAction={onAction}
      onExit={onExit}
      {...props}
    />
  );
  
  return {
    ...utils,
    onAction,
    onExit
  };
};
```

### Keyboard Simulation

```typescript
// Simulate keyboard input
const { stdin, onAction } = setup();
stdin.write('m'); // Simulate 'm' key
expect(onAction).toHaveBeenCalledWith({ type: 'new-migration' });

// Simulate Enter key
stdin.write('\r');
expect(onAction).toHaveBeenCalledWith({ type: 'continue' });

// Simulate arrow keys (using ANSI sequences)
stdin.write('\u001B[A'); // Up arrow
stdin.write('\u001B[B'); // Down arrow
```

---

*Test Cases Complete — Ready for Implementation*
