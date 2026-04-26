# AgentSync UI Flow Documentation

## Overview

This document describes the complete user interface flow for AgentSync CLI, including the current inquirer-based implementation and the planned Ink-based Terminal UI (TUI).

---

## Current Implementation (Inquirer-Based)

The current CLI uses **inquirer** for interactive prompts combined with custom UI components for scan progress and results display.

### Entry Points

```bash
# Agent Mode (default when no args provided)
agentsync

# Or explicitly
agentsync interactive

# Direct commands
agentsync scan
agentsync migrate --from claude --to opencode

# Verify tool structure
agentsync verify
agentsync verify --tool opencode
agentsync verify --verbose
```

### 1. Welcome Flow

**On startup**, the user sees:

```
     _                    _   ____
    / \   __ _  ___ _ __ | |_/ ___| _   _ _ __   ___
   / _ \ / _` |/ _ \ '_ \| __\___ \| | | | '_ \ / __|
  / ___ \ (_| |  __/ | | | |_ ___) | |_| | | | | (__
 /_/   \_\__, |\___|_| |_|\__|____/ \__, |_| |_|\___|
         |___/                      |___/
AI Agent Environment Migration Tool

? Welcome to AgentSync! How would you like to proceed?
> 🚀 Start with guided commands (recommended)
  ⌨️  Start typing commands manually
  ❓ Show me what's available
```

**Options:**
- **Guided Commands** (default): Opens command selector on "/"
- **Manual Mode**: Traditional REPL with typed commands
- **Help**: Shows available commands

### 1.5 Structure Verification (Optional)

Before migrating, users can verify their tool structure is correct:

```bash
agentsync verify
```

**Output:**
```
🔍 Verifying AI Tool Structure

Claude Code
──────────────────────────────────────────────────
  ✗ Structure has issues
    • No configuration found (checked global and project-level)
  Claude Code stores configuration in ~/.config/claude/settings.json

OpenCode
──────────────────────────────────────────────────
  ✓ Structure valid
  OpenCode uses .opencode/ directory with agents/, skills/, and opencode.json
    C:\Users\...\.opencode

──────────────────────────────────────────────────
Verification Summary
──────────────────────────────────────────────────

⚠️  Found 1 issue(s) in 2 tool(s)

Please review the issues above and fix them before migrating.
Use --verbose for more details about expected structure.
```

**Options:**
- `--tool <tool>` - Verify specific tool only
- `--verbose` - Show detailed structure information

**Purpose:**
- Validate tool configuration before migration
- Detect missing files or directories
- Show expected structure for each tool
- Help users fix configuration issues

### 2. Command Selection

**Typing "/"** triggers the command dropdown:

```
? Select a command:
> /scan         Scan for agents and tools
  /status       Show current session state
  /help         Show available commands
  /exit         Exit Agent Mode
  ──────────────
  Cancel
```

**Keyboard Navigation:**
- `↑` `↓` - Navigate options
- `Enter` - Select
- `Esc` - Cancel

### 3. Scan Flow

#### 3.1 Scope Selection

```
? Where would you like to scan?
> 📁 Current directory
  🏠 Home directory (global config)
  🌍 Entire system (current + home)
  📂 Custom path
```

**Scope Options:**
- **Current**: Scan `./.opencode/` for project-level configs
- **Home**: Scan `~/.config/opencode/` for global configs
- **System**: Scan both current and home directories
- **Custom**: Opens file browser for path selection

#### 3.2 Custom Path Browser

When "Custom path" is selected:

```
Current: C:\Users\shivm\OneDrive\Desktop\agentsync
? Select directory:
  🟢 Select this directory
  ──────────────
  📁 .. (parent directory)
  📁 .git
  📁 .opencode
  📁 docs
  📁 packages
```

**Navigation:**
- `↑` `↓` - Navigate entries
- `Enter` - Enter directory or select
- Select ".." to go up
- Select "🟢 Select this directory" to confirm

#### 3.3 Real-Time Scan Progress

During scanning:

```
- Scanning current directory...
  ✓ Found agent: test-runner-agent (....opencode\agents\test-runner-agent.md)
  ✓ Found agent: engineering-agent (....opencode\agents\engineering-agent.md)
  ✓ Found skill: test-code-gen (...nc\.opencode\skills\test-code-gen\SKILL.md)
  ✓ Found skill: spec-writer (...nc\.opencode\skills\spec-writer\SKILL.md)
  ℹ Detected tool: opencode
✔ Scan complete!
```

#### 3.4 Scan Results Summary

```
═══════════════════════════════════════════
           SCAN COMPLETE
═══════════════════════════════════════════

Tools Detected:
  ✔ opencode

Agents Found: 2
  • test-runner-agent
  • engineering-agent

Skills Found: 11
  • test-code-gen
  • spec-writer
  • test-analyzer
  • phase-check
  • (7 more...)

MCP Servers:
  None found

Locations:
  C:\Users\shivm\OneDrive\Desktop\agentsync\.opencode\agents\
  C:\Users\shivm\OneDrive\Desktop\agentsync\.opencode\skills\test-code-gen\
  ... (13 more paths)

Duration: 0.6s
═══════════════════════════════════════════
```

### 4. Post-Scan Action Menu

After scan completes:

```
? What would you like to do next?
> 🔄 Start Migration
  👁️  View Detected Entities
  🔍 Scan Another Location
  💾 Save Results to File
  ──────────────
  ❌ Exit
```

**Actions:**
- **Start Migration**: Select target adapter and begin migration
- **View Detected Entities**: Show detailed categorized list
- **Scan Another Location**: Scan different directory
- **Save Results**: Export to JSON file
- **Exit**: Return to command prompt

### 5. Migration Flow

#### 5.1 Target Adapter Selection

Only **supported adapters** are shown (currently Claude and OpenCode). Other adapters will be added as they are implemented.

```
? Select the target adapter to migrate to:
  🟣 Claude
  🔵 Opencode
  ──────────────
  Cancel
```

**Note:** The adapter list only shows fully supported adapters. Gemini CLI, Cursor, and Copilot CLI are planned for future releases.

#### 5.2 Migration Path Selection

**New Feature** (Not yet implemented): Ask where to save migrated files:

```
? Where would you like to save the migrated files?
> 📁 Current directory (./migrated/)
  🏠 Home directory (~/.config/[adapter]/)
  📂 Custom path
```

#### 5.3 Migration Progress

```
Starting migration: opencode → claude...

Migration Summary:
  Source: opencode
  Target: claude
  Agents: 2
  Skills: 11
  MCP Servers: 0

? Proceed with migration? (Y/n)
```

#### 5.4 Migration Results

**Current Implementation:**
```
✓ Migration completed successfully!
Migration from opencode to claude completed.
```

**Planned Enhancement** (Show exact file paths):
```
═══════════════════════════════════════════
         ✓ MIGRATION COMPLETE
═══════════════════════════════════════════

Migrated Files:
  ✓ ~/.config/claude/settings.json
  ✓ ~/.config/claude/agents/
    ├── test-runner-agent.md
    └── engineering-agent.md
  ✓ ~/.config/claude/skills/
    ├── test-code-gen/SKILL.md
    └── (10 more skills)

Total: 2 agents, 11 skills migrated
Duration: 1.2s

? What would you like to do next?
> 👁️  View Migrated Files
  🔄 Migrate to Another Adapter
  💾 Save Migration Report
  🏠 Return to Main Menu
  ❌ Exit
```

### 6. View Detected Entities

```
═══════════════════════════════════════════
         DETECTED ENTITIES
═══════════════════════════════════════════

Agents (2):
  1. test-runner-agent
     Use to run the test suite and generate HTML test reports...
  2. engineering-agent
     Use for implementing features (TDD), fixing bugs...

Skills (12):
  1. test-code-gen
  2. test-generator
  3. test-analyzer
  4. spec-writer
  5. phase-check
  6. project-status
  7. new-feature
  8. gen-test-report
  9. git-commit-agentsync
  10. fix-bug
  11. doc-audit
  12. execute-next

═══════════════════════════════════════════

? Press Enter to continue...
```

### 7. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Open command selector |
| `↑` `↓` | Navigate lists |
| `Enter` | Select/Confirm |
| `Esc` | Cancel/Go back |
| `q` | Exit (in future) |

---

## Planned Implementation (Ink-Based TUI)

### Overview

The Ink-based TUI will provide a modern, Cloud/OpenCode-style interface using React components in the terminal.

**Library:** [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
**Used by:** Claude Code, Gemini CLI, Copilot CLI, Wrangler

### Key Improvements

1. **Full-Screen Interface**: No more scrolling prompts
2. **Visual Layout**: Sidebar + main content area
3. **Component-Based**: Reusable React components
4. **Real-Time Updates**: Live progress without re-rendering entire screen
5. **Better Navigation**: Visual indicators and keyboard shortcuts

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AgentSync                          [Scan] [Migrate]     │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  NAVIGATION  │           MAIN CONTENT AREA                  │
│              │                                               │
│  [Scan]      │  ┌─────────────────────────────────────────┐ │
│  [Migrate]   │  │  Scan Results                           │ │
│  [Status]    │  │  ─────────────────────────────────────  │ │
│  [Help]      │  │                                         │ │
│  ──────────  │  │  Tools:                                 │ │
│  [Exit]      │  │    ✓ opencode                           │ │
│              │  │                                         │ │
│              │  │  Agents (2):                            │ │
│              │  │    ✓ test-runner-agent                  │ │
│              │  │    ✓ engineering-agent                  │ │
│              │  │                                         │ │
│              │  │  Skills (12):                           │ │
│              │  │    ✓ test-generator                     │ │
│              │  │    ✓ test-code-gen                      │ │
│              │  │    ✓ spec-writer                       │ │
│              │  │    ...                                  │ │
│              │  │                                         │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                               │
├──────────────┴──────────────────────────────────────────────┤
│  Status: Ready    │  Path: ./.opencode    │  Press ? for help│
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme

Dark, minimal, terminal-friendly:

```typescript
const theme = {
  primary: '#3B82F6',      // Blue - actions, buttons
  success: '#10B981',      // Green - success states
  warning: '#F59E0B',      // Orange - warnings
  error: '#EF4444',        // Red - errors
  background: '#0F172A',   // Dark slate - main bg
  surface: '#1E293B',      // Lighter slate - cards, panels
  text: '#F1F5F9',         // White - primary text
  textMuted: '#94A3B8',    // Gray - secondary text
  border: '#334155'        // Border color
};
```

### Component Architecture

```
packages/cli/src/ui-ink/
├── index.tsx                 # Entry point - renders App
├── App.tsx                   # Main app with routing
├── theme.ts                  # Color scheme
├── components/
│   ├── Layout.tsx            # Main layout (sidebar + content)
│   ├── Header.tsx            # Top header with logo
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── StatusBar.tsx         # Bottom status bar
│   ├── ScanView.tsx          # Scan interface
│   ├── MigrationView.tsx     # Migration interface
│   ├── FileBrowser.tsx       # Path selection
│   ├── ResultsPanel.tsx      # Results display
│   ├── AdapterCard.tsx       # Adapter selection card
│   └── ProgressBar.tsx       # Progress indicator
├── hooks/
│   ├── useScan.ts            # Scan logic
│   ├── useMigration.ts       # Migration logic
│   └── useNavigation.ts      # Navigation state
└── types.ts                  # TypeScript types
```

### Scan View (Ink)

```tsx
<Box flexDirection="column" padding={1}>
  <Text bold>Scan Configuration</Text>
  
  <Box marginTop={1} gap={2}>
    <Button 
      label="📁 Current" 
      selected={scope === 'current'}
      onPress={() => setScope('current')}
    />
    <Button 
      label="🏠 Home" 
      selected={scope === 'home'}
      onPress={() => setScope('home')}
    />
    <Button 
      label="🌍 System" 
      selected={scope === 'system'}
      onPress={() => setScope('system')}
    />
    <Button 
      label="📂 Custom" 
      selected={scope === 'custom'}
      onPress={() => setScope('custom')}
    />
  </Box>
  
  <Box marginTop={2}>
    <Button label="Start Scan" primary onPress={startScan} />
  </Box>
</Box>
```

### Migration View (Ink)

```tsx
<Box flexDirection="column" padding={1}>
  <Text bold>Migrate to Another Adapter</Text>
  
  <Box marginTop={1} gap={1} flexWrap="wrap">
    {adapters.map(adapter => (
      <AdapterCard
        key={adapter.id}
        icon={adapter.icon}
        name={adapter.name}
        selected={selectedAdapter === adapter.id}
        onSelect={() => setSelectedAdapter(adapter.id)}
      />
    ))}
  </Box>
  
  <Box marginTop={2}>
    <Text>Output Location:</Text>
    <TextInput 
      value={outputPath}
      onChange={setOutputPath}
      placeholder="Select path..."
    />
    <Button label="Browse" onPress={openFileBrowser} />
  </Box>
  
  <Box marginTop={2}>
    <Button 
      label="Start Migration" 
      primary 
      onPress={startMigration}
      disabled={!selectedAdapter}
    />
  </Box>
</Box>
```

### Keyboard Navigation (Ink)

| Key | Action |
|-----|--------|
| `/` | Toggle command palette |
| `Tab` | Navigate between focusable elements |
| `↑` `↓` `←` `→` | Navigate within lists/grids |
| `Enter` | Select/Activate focused element |
| `Esc` | Cancel/Go back |
| `q` | Exit application |
| `?` | Show keyboard shortcuts help |

### Migration Results (Ink)

```
┌─────────────────────────────────────────────────────────────┐
│         ✓ MIGRATION COMPLETE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Migrated to: Claude                                        │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  Files Created:                                             │
│  ✓ ~/.config/claude/settings.json                          │
│  ✓ ~/.config/claude/agents/                                │
│    ├── test-runner-agent.md                                │
│    └── engineering-agent.md                                │
│  ✓ ~/.config/claude/skills/                                │
│    ├── test-generator/SKILL.md                             │
│    ├── test-code-gen/SKILL.md                              │
│    └── (10 more skills)                                    │
│                                                             │
│  Total: 2 agents, 12 skills, 1 config file                  │
│  Duration: 1.2s                                             │
│                                                             │
│  [View Files] [Migrate Again] [Main Menu] [Exit]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Comparison: Inquirer vs Ink

| Feature | Inquirer (Current) | Ink (Planned) |
|---------|-------------------|---------------|
| **Appearance** | Terminal prompts | Full-screen UI |
| **Layout** | Sequential prompts | Visual layout |
| **Navigation** | Arrow keys in lists | Tab + arrow keys |
| **Components** | None (prompt-based) | React components |
| **Updates** | Re-render entire screen | Incremental updates |
| **Learning Curve** | Low | Medium (React knowledge) |
| **Bundle Size** | Small (~50KB) | Larger (~250KB) |
| **Fallback** | N/A | Keep inquirer for CI/SSH |

---

## Implementation Timeline

### Phase 1: Core CLI (Complete ✅)
- Inquirer-based prompts
- Scan, Migration, Status commands
- Session state management

### Phase 2: AI Scanner (Complete ✅)
- AIDirectoryScanner with glob patterns
- AI cross-validation
- OpenCode structure detection
- Real-time UI updates

### Phase 3: Ink TUI (Week 6 - Planned)
- Setup Ink and React
- Build component library
- Implement views (Scan, Migration, Results)
- Keyboard navigation
- Integration with fallback

### Phase 4: Tool Adapters (Week 7-8)
- Gemini CLI adapter
- Cursor adapter
- GitHub Copilot adapter
- Cross-tool testing

---

## Fallback Strategy

The Ink TUI will have an automatic fallback to inquirer when:

1. **TTY not available** (CI/CD, piped input)
2. **Terminal doesn't support Unicode** (basic terminals)
3. **User explicitly requests** (`--simple-mode` flag)
4. **SSH connections** with limited terminal support

**Fallback Detection:**
```typescript
function shouldUseFallback(): boolean {
  return !process.stdin.isTTY ||
         process.env.CI === 'true' ||
         process.env.AGENTSYNC_SIMPLE === 'true';
}
```

---

## Summary

**Current State:**
- ✅ Inquirer-based interactive mode functional
- ✅ Scan with scope selection working
- ✅ File browser for custom paths
- ✅ Post-scan action menu
- ✅ Migration with adapter selection

**Next Steps:**
1. Add migration path selection (where to save)
2. Show exact migrated file paths in results
3. Implement Ink-based TUI (Week 6)
4. Add keyboard shortcuts (`q`, `?`)
5. Keep inquirer as fallback

**Design Principles:**
- Dark, minimal aesthetic
- Keyboard-first navigation
- Clear visual hierarchy
- Immediate feedback
- Progressive disclosure (show details on demand)
