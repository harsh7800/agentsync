# ResultsPanel Component Specification

**Task**: S4-34 — Build ResultsPanel for scan/migration display  
**Location**: `packages/cli/src/ui-ink/components/ResultsPanel/ResultsPanel.tsx`  
**Phase**: Sprint 4 Phase 1.6 — Modern Terminal UI with Ink  
**Status**: Pending Implementation

---

## 1. Overview

The **ResultsPanel** is a unified display component that consolidates the presentation of scan results and migration results in the AgentSync Ink-based TUI. It provides a consistent, visually-appealing interface for viewing detailed results with keyboard navigation support.

**Purpose**:
- Unify the separate result displays currently in `ScanView.tsx` (inline results) and `MigrationResults.tsx` (migration results)
- Provide a consistent visual language for all result presentations
- Support keyboard navigation for user actions after viewing results
- Show exact file paths for migrated items with copy-friendly formatting
- Display summary statistics in a scannable format

**Key Features**:
- Dual-mode display (scan results or migration results)
- Consistent styling with other Ink components (Layout, MigrationView, etc.)
- Full keyboard navigation (Enter, m, s, q)
- Scrollable content for long result lists
- Collapsible sections for detailed views
- Color-coded status indicators
- Exact file path display for migrated items

---

## 2. Props Interface

```typescript
import type { Route } from '../../App.js';

export type ResultsMode = 'scan' | 'migration';

export interface ResultsPanelProps {
  /** Display mode - determines what type of results to show */
  mode: ResultsMode;
  
  /** Scan result data (required when mode='scan') */
  scanResult?: ScanResultData;
  
  /** Migration result data (required when mode='migration') */
  migrationResult?: MigrationResultData;
  
  /** Callback when user selects an action */
  onAction: (action: ResultsAction) => void;
  
  /** Callback to exit the application */
  onExit: () => void;
  
  /** Optional title override */
  title?: string;
  
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
}

export type ResultsAction = 
  | { type: 'continue' }
  | { type: 'new-migration' }
  | { type: 'scan-again' }
  | { type: 'view-files'; paths: string[] }
  | { type: 'export'; format: 'json' | 'markdown' };
```

---

## 3. Data Types

### 3.1 Scan Result Data

```typescript
export interface ScanResultData {
  /** Scan operation duration in milliseconds */
  duration: number;
  
  /** Tools detected during scan */
  tools: DetectedTool[];
  
  /** Agents found */
  agents: DetectedAgent[];
  
  /** Skills found */
  skills: DetectedSkill[];
  
  /** MCP servers found */
  mcps: DetectedMCP[];
  
  /** Unique paths scanned */
  paths: string[];
  
  /** Timestamp of scan completion */
  timestamp: string;
  
  /** Total files scanned */
  filesScanned: number;
}

export interface DetectedTool {
  id: string;
  name: string;
  icon: string;
  version?: string;
}

export interface DetectedAgent {
  name: string;
  tool: string;
  path: string;
  description?: string;
}

export interface DetectedSkill {
  name: string;
  tool: string;
  path: string;
  description?: string;
}

export interface DetectedMCP {
  name: string;
  tool: string;
  path: string;
  type: 'local' | 'remote';
}
```

### 3.2 Migration Result Data

```typescript
export interface MigrationResultData {
  /** Migration success status */
  success: boolean;
  
  /** Source tool ID */
  sourceTool: string;
  
  /** Target tool ID */
  targetTool: string;
  
  /** Migration duration in milliseconds */
  duration: number;
  
  /** Individual agent migration results */
  migratedAgents: MigratedAgent[];
  
  /** Individual skill migration results */
  migratedSkills: MigratedSkill[];
  
  /** MCP server migrations */
  migratedMCPs: MigratedMCP[];
  
  /** All created/modified files */
  createdFiles: CreatedFile[];
  
  /** Error messages */
  errors: MigrationError[];
  
  /** Warnings */
  warnings: string[];
  
  /** Backup information */
  backup?: BackupInfo;
  
  /** Timestamp of migration completion */
  timestamp: string;
}

export interface MigratedAgent {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface MigratedSkill {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface MigratedMCP {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
}

export interface CreatedFile {
  path: string;
  type: 'config' | 'agent' | 'skill' | 'mcp' | 'backup';
  size?: number;
}

export interface MigrationError {
  message: string;
  context?: string;
  recoverable: boolean;
}

export interface BackupInfo {
  path: string;
  timestamp: string;
  size: number;
}
```

---

## 4. Visual States

### 4.1 Scan Results View

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Scan Complete                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Duration: 1.23s • Files scanned: 47                        │
│                                                             │
│  ┌─ Tools Detected ─────────────────────────────────────┐  │
│  │  🔵 OpenCode                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Agents Found (2) ───────────────────────────────────┐  │
│  │  • 🟠 test-runner-agent                                │  │
│  │    ./.opencode/agents/test-runner-agent.md            │  │
│  │  • 🔵 engineering-agent                                │  │
│  │    ./.opencode/agents/engineering-agent.md            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Skills Found (12) ───────────────────────────────────┐  │
│  │  • test-generator                                     │  │
│  │  • test-code-gen                                      │  │
│  │  • spec-writer                                        │  │
│  │  • ... and 9 more                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ MCP Servers (0) ─────────────────────────────────────┐  │
│  │  No MCP servers found                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [m] Start Migration  [s] Scan Again  [Enter] Continue      │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Header with success indicator
- Summary statistics (duration, files scanned)
- Collapsible sections for each entity type
- Tool icons from theme
- Full file paths for each item
- "and X more" for truncated lists
- Action bar at bottom

### 4.2 Migration Results View

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Migration Complete                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Migration Summary ──────────────────────────────────┐  │
│  │  From: 🔵 OpenCode                                    │  │
│  │  To:   🟠 Claude Code                                 │  │
│  │                                                       │  │
│  │  ✓ 14 Success  ✗ 1 Failed  ○ 0 Skipped               │  │
│  │  Duration: 2.45s                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Migrated Agents (2) ─────────────────────────────────┐  │
│  │  ✓ test-runner-agent                                  │  │
│  │    Source: ./.opencode/agents/test-runner-agent.md    │  │
│  │    Target: ~/.config/claude/agents/test-runner-agent.md│  │
│  │  ✓ engineering-agent                                  │  │
│  │    Source: ./.opencode/agents/engineering-agent.md    │  │
│  │    Target: ~/.config/claude/agents/engineering-agent.md│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Migrated Skills (12) ────────────────────────────────┐  │
│  │  ✓ test-generator                                     │  │
│  │    Source: ./.opencode/skills/test-generator/SKILL.md │  │
│  │    Target: ~/.config/claude/skills/test-generator/    │  │
│  │  ...                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Created Files ───────────────────────────────────────┐  │
│  │  📄 ~/.config/claude/settings.json                    │  │
│  │  📁 ~/.config/claude/agents/                          │  │
│  │  📁 ~/.config/claude/skills/                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  💾 Backup created: ~/.agentsync/backups/20250401-143022/   │
│                                                             │
│  [Enter] Done  [m] New Migration  [s] Scan Again            │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Source and target tool display with icons
- Success/error/skip counts in summary
- Each migrated item shows source and target paths
- File type icons (📄 file, 📁 directory)
- Backup information with full path
- Error section if any errors occurred

### 4.3 Error State View

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠ Migration Completed with Errors                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Summary ─────────────────────────────────────────────┐  │
│  │  ✓ 12 Success  ✗ 3 Failed  ○ 0 Skipped               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Errors ──────────────────────────────────────────────┐  │
│  │  ✗ test-validator                                     │  │
│  │    Error: Failed to parse YAML frontmatter            │  │
│  │    File: ./.opencode/agents/test-validator.md         │  │
│  │                                                       │  │
│  │  ✗ config-backup                                    │  │
│  │    Error: Permission denied                           │  │
│  │    Path: ~/.config/claude/backups/                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Enter] Continue  [m] Retry Failed  [s] Start Over         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Keyboard Interactions

### 5.1 Navigation Keys

| Key | Action | Context |
|-----|--------|---------|
| `Enter` | Continue / Done | All views |
| `m` | Start New Migration | Scan results, Migration results |
| `s` | Scan Again | All views |
| `q` | Exit Application | All views |
| `↑` / `↓` | Scroll results | When content overflows |
| `Tab` | Focus action buttons | Action bar navigation |
| `e` | Export results | Results view |
| `v` | View full details | Toggle expanded view |

### 5.2 Keyboard Handler Implementation

```typescript
useInput((input, key) => {
  // Exit
  if (input === 'q') {
    onExit();
    return;
  }
  
  // Continue / Done
  if (key.return) {
    onAction({ type: 'continue' });
    return;
  }
  
  // Start new migration
  if (input === 'm') {
    onAction({ type: 'new-migration' });
    return;
  }
  
  // Scan again
  if (input === 's') {
    onAction({ type: 'scan-again' });
    return;
  }
  
  // Export
  if (input === 'e') {
    onAction({ type: 'export', format: 'json' });
    return;
  }
  
  // Toggle view mode
  if (input === 'v') {
    setExpandedView(prev => !prev);
    return;
  }
  
  // Scrolling
  if (key.upArrow && canScrollUp) {
    setScrollOffset(prev => Math.max(0, prev - 1));
  }
  if (key.downArrow && canScrollDown) {
    setScrollOffset(prev => prev + 1);
  }
});
```

---

## 6. Error Handling

### 6.1 Invalid Props

| Error | Handling |
|-------|----------|
| `mode='scan'` but no `scanResult` | Display error message: "No scan results available" |
| `mode='migration'` but no `migrationResult` | Display error message: "No migration results available" |
| Invalid tool ID in results | Display with generic icon, log warning |
| Missing required fields | Use defaults, show "Unknown" for names |

### 6.2 Runtime Errors

```typescript
interface ResultsPanelError {
  type: 'invalid-data' | 'render-error' | 'navigation-error';
  message: string;
  recoverable: boolean;
}

// Error boundary wrapper
<ErrorBoundary
  fallback={({ error }) => (
    <Box padding={2}>
      <Text color="red">Error displaying results: {error.message}</Text>
      <Text color="gray">Press Enter to continue or q to exit</Text>
    </Box>
  )}
>
  <ResultsPanel {...props} />
</ErrorBoundary>
```

### 6.3 Empty States

| Scenario | Display |
|----------|---------|
| Scan found nothing | "No agents, skills, or MCPs found. Try a different scan scope." |
| Migration created no files | "No files were created. All items may have been skipped or failed." |
| All items failed | Show error view with retry option |

---

## 7. Test Scenarios

### 7.1 Unit Tests

```typescript
describe('ResultsPanel', () => {
  describe('rendering', () => {
    it('should render scan results view', () => {
      const { lastFrame } = render(
        <ResultsPanel
          mode="scan"
          scanResult={mockScanResult}
          onAction={vi.fn()}
          onExit={vi.fn()}
        />
      );
      expect(lastFrame()).toContain('Scan Complete');
    });
    
    it('should render migration results view', () => {
      const { lastFrame } = render(
        <ResultsPanel
          mode="migration"
          migrationResult={mockMigrationResult}
          onAction={vi.fn()}
          onExit={vi.fn()}
        />
      );
      expect(lastFrame()).toContain('Migration Complete');
    });
    
    it('should display correct counts', () => {
      // Verify success/error/skip counts
    });
    
    it('should show full file paths', () => {
      // Verify exact paths are displayed
    });
    
    it('should truncate long lists with "and X more"', () => {
      // Verify truncation at 5 items for agents, 3 for others
    });
  });
  
  describe('keyboard navigation', () => {
    it('should call onAction with type=continue on Enter', () => {
      const onAction = vi.fn();
      const { stdin } = render(<ResultsPanel ... />);
      stdin.write('\r'); // Enter
      expect(onAction).toHaveBeenCalledWith({ type: 'continue' });
    });
    
    it('should call onAction with type=new-migration on "m"', () => {
      const onAction = vi.fn();
      const { stdin } = render(<ResultsPanel ... />);
      stdin.write('m');
      expect(onAction).toHaveBeenCalledWith({ type: 'new-migration' });
    });
    
    it('should call onExit on "q"', () => {
      const onExit = vi.fn();
      const { stdin } = render(<ResultsPanel ... />);
      stdin.write('q');
      expect(onExit).toHaveBeenCalled();
    });
    
    it('should support scrolling with arrow keys', () => {
      // Test scroll offset changes
    });
  });
  
  describe('error states', () => {
    it('should show error when mode=scan but no scanResult', () => {
      const { lastFrame } = render(
        <ResultsPanel mode="scan" onAction={vi.fn()} onExit={vi.fn()} />
      );
      expect(lastFrame()).toContain('No scan results available');
    });
    
    it('should display error details in migration error view', () => {
      const resultWithErrors = {
        ...mockMigrationResult,
        errors: [{ message: 'Test error', recoverable: true }],
      };
      const { lastFrame } = render(
        <ResultsPanel mode="migration" migrationResult={resultWithErrors} ... />
      );
      expect(lastFrame()).toContain('Test error');
    });
  });
  
  describe('accessibility', () => {
    it('should have proper color contrast', () => {
      // Verify all text colors meet contrast requirements
    });
    
    it('should show keyboard shortcuts help', () => {
      expect(lastFrame()).toContain('[m]');
      expect(lastFrame()).toContain('[s]');
      expect(lastFrame()).toContain('[Enter]');
    });
  });
});
```

### 7.2 Integration Tests

```typescript
describe('ResultsPanel Integration', () => {
  it('should integrate with ScanView flow', async () => {
    // Test full flow: scan → results → new migration
  });
  
  it('should integrate with MigrationView flow', async () => {
    // Test full flow: migrate → results → scan again
  });
  
  it('should pass correct data to parent callbacks', () => {
    // Verify onAction receives correct action types
  });
  
  it('should handle rapid navigation key presses', () => {
    // Stress test keyboard handling
  });
});
```

### 7.3 E2E Tests

```typescript
describe('ResultsPanel E2E', () => {
  it('should display scan results after successful scan', async () => {
    // E2E: Run scan, verify ResultsPanel displays correctly
  });
  
  it('should display migration results after successful migration', async () => {
    // E2E: Run migration, verify ResultsPanel displays file paths
  });
  
  it('should navigate to new migration from results', async () => {
    // E2E: Press 'm', verify navigation to migration view
  });
  
  it('should navigate to scan from results', async () => {
    // E2E: Press 's', verify navigation to scan view
  });
});
```

---

## 8. Acceptance Criteria

### 8.1 Functional Requirements

- [ ] **AC-1**: ResultsPanel displays scan results with:
  - [ ] Duration and files scanned count
  - [ ] Tools detected with icons
  - [ ] Agents found with names and paths
  - [ ] Skills found with names and paths
  - [ ] MCP servers with names and paths
  - [ ] Collapsible sections for each entity type

- [ ] **AC-2**: ResultsPanel displays migration results with:
  - [ ] Source and target tool names with icons
  - [ ] Success/error/skip counts
  - [ ] Each migrated item with source and target paths
  - [ ] Created files list with full paths
  - [ ] Backup location if applicable
  - [ ] Error details for failed items

- [ ] **AC-3**: Keyboard navigation works:
  - [ ] Enter key triggers continue/done action
  - [ ] 'm' key triggers new migration action
  - [ ] 's' key triggers scan again action
  - [ ] 'q' key exits application
  - [ ] Arrow keys scroll when content overflows

- [ ] **AC-4**: Visual consistency:
  - [ ] Uses theme colors from `theme.ts`
  - [ ] Consistent with Layout, MigrationView styling
  - [ ] Proper spacing and borders
  - [ ] Status icons (✓, ✗, ○) match theme

- [ ] **AC-5**: Error handling:
  - [ ] Gracefully handles missing data
  - [ ] Shows error view for migration failures
  - [ ] Provides retry options where applicable

### 8.2 Non-Functional Requirements

- [ ] **AC-6**: Performance:
  - [ ] Renders within 100ms for up to 100 items
  - [ ] Smooth scrolling for large result sets
  - [ ] No memory leaks on repeated navigation

- [ ] **AC-7**: Accessibility:
  - [ ] Keyboard-only navigation possible
  - [ ] Visual indicators for focused elements
  - [ ] Clear action labels

- [ ] **AC-8**: Code Quality:
  - [ ] TypeScript strict mode compliance
  - [ ] Unit test coverage >90%
  - [ ] Follows existing component patterns
  - [ ] Proper JSDoc comments

### 8.3 Integration Requirements

- [ ] **AC-9**: ScanView Integration:
  - [ ] Replace inline results in ScanView with ResultsPanel
  - [ ] Pass scan results as props
  - [ ] Handle 'new-migration' action

- [ ] **AC-10**: MigrationResults Deprecation:
  - [ ] MigrationResults component functionality merged into ResultsPanel
  - [ ] MigrationView uses ResultsPanel for display
  - [ ] MigrationResults.tsx marked as deprecated

---

## 9. Implementation Notes

### 9.1 Dependencies

```json
{
  "dependencies": {
    "ink": "^5.0.0",
    "react": "^18.2.0"
  }
}
```

### 9.2 File Structure

```
packages/cli/src/ui-ink/components/ResultsPanel/
├── index.ts              # Public exports
├── ResultsPanel.tsx      # Main component
├── ResultsPanel.spec.tsx # Unit tests
├── ScanResults.tsx       # Scan results sub-component
├── MigrationResults.tsx  # Migration results sub-component
├── ResultSection.tsx     # Collapsible section component
├── ActionBar.tsx         # Bottom action buttons
└── types.ts              # Shared types
```

### 9.3 Styling Guidelines

```typescript
// Use theme colors consistently
import { theme } from '../../theme.js';

// Section styling
<Box 
  borderStyle="single" 
  borderColor={theme.colors.border}
  padding={1}
>

// Status colors
const statusColors = {
  success: theme.colors.success,
  error: theme.colors.error,
  skipped: theme.colors.warning,
};

// Tool icons mapping
const toolIcons: Record<string, string> = {
  claude: '🟠',
  opencode: '🔵',
  gemini: '🟣',
  cursor: '🟢',
  copilot: '⚪',
};
```

### 9.4 Performance Considerations

- Use `React.memo` for list items to prevent unnecessary re-renders
- Implement virtual scrolling for lists > 50 items
- Lazy load detailed views until expanded
- Use `useCallback` for event handlers passed to children

---

## 10. Related Components

| Component | Purpose | Relationship |
|-----------|---------|--------------|
| ScanView.tsx | Scan interface | Will use ResultsPanel for results display |
| MigrationView.tsx | Migration interface | Will use ResultsPanel for results display |
| MigrationResults.tsx | Migration results (old) | To be deprecated, replaced by ResultsPanel |
| Layout.tsx | Page layout | ResultsPanel renders within Layout |
| FileBrowser.tsx | Path selection | ResultsPanel shows paths in display |

---

## 11. References

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [UI Flow Documentation](../../../../../docs/ui-flow.md)
- [Project Context](../../../../../docs/project-context.md)
- [Implementation Plan - Phase 1.6](../../../../../docs/implementation-plan.md#phase-16-modern-terminal-ui-with-ink)
- [Theme Configuration](../theme.ts)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | Senior Engineer | Initial specification created |

---

*Specification Complete — Ready for Implementation*
