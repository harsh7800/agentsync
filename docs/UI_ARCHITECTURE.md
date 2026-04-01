# AgentSync UI Architecture

## Overview

AgentSync uses a modern Terminal User Interface (TUI) built with **Ink** (React for CLI). The UI follows a wizard-style workflow with consistent layouts across all screens.

---

## Layout System

All screens follow a standard 5-section layout:

```
┌──────────────────────────────────────────────────────────────┐
│ AgentSync                                                    │
├──────────────────────────────────────────────────────────────┤
│ Breadcrumb: AgentSync → Screen → Step                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Main Content Area                                            │
│ • Sections with titles                                       │
│ • Summary tables                                             │
│ • Lists and grouped content                                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Actions                                                      │
│ ▸ Action 1 [shortcut]                                        │
│   Action 2 [shortcut]                                        │
│   Action 3 [shortcut]                                        │
├──────────────────────────────────────────────────────────────┤
│ Status Bar: shortcuts and info                               │
└──────────────────────────────────────────────────────────────┘
```

### Components

#### Layout.tsx
Base layout component providing:
- **Header**: "AgentSync" title with subtitle
- **Breadcrumb**: Navigation path (e.g., "AgentSync → Migrate → Confirm")
- **Content Area**: Flexible main content
- **Actions Panel**: Vertical action list
- **Status Bar**: Keyboard shortcuts and info

#### UIComponents.tsx
Reusable UI components:
- **ActionsList**: Vertical action menu with selection highlighting
- **ProgressBar**: Visual progress indicator with percentage
- **WizardSteps**: Step indicator with dots (● ○ ○ ○ ○ ○)
- **SummaryTable**: Key-value pairs for displaying data
- **List**: Bullet point lists
- **GroupedList**: Grouped items by category
- **LogsPanel**: Scrollable activity log display

---

## Screen Architecture

Screens are organized in `packages/cli/src/ui-ink/screens/`:

```
screens/
├── DashboardScreen.tsx          # Main entry point
├── ScanResultsScreen.tsx        # Display scan results
├── ConfirmMigrationScreen.tsx   # Migration confirmation
├── MigrationProgressScreen.tsx  # Progress with logs
├── MigrationCompleteScreen.tsx  # Success screen
└── index.ts                     # Exports
```

### Screen Flow

```
Dashboard
    ↓
Scan Location Selection
    ↓
Scanning (with progress)
    ↓
Scan Results
    ↓
Migration Wizard:
    ├── Select Source Tool (Step 1)
    ├── Select Target Tool (Step 2)
    ├── Select Output Location (Step 3)
    │   └── File Browser (if Custom Path)
    ├── Confirm Migration (Step 4)
    ├── Migration Progress (Step 5)
    └── Migration Complete (Step 6)
```

---

## Keyboard Shortcuts

### Global Shortcuts
| Key | Action |
|-----|--------|
| `q` | Quit application |
| `Ctrl+C` | Force exit |

### Navigation
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down in lists |
| `←` / `→` | Navigate left/right (actions) |
| `Enter` | Select/Confirm |
| `Esc` | Go back |
| `Tab` | Select current (file browser) |

### Screen-Specific Shortcuts

#### Scan Results
| Key | Action |
|-----|--------|
| `m` | Migrate agents |
| `y` | Sync changes |
| `s` | New scan |
| `d` | Toggle details |

#### Migration Wizard
| Key | Action |
|-----|--------|
| `s` | Start migration (on confirm) |
| `b` | Back |
| `c` | Cancel |

#### File Browser
| Key | Action |
|-----|--------|
| `h` | Jump to Home directory |
| `r` | Jump to Root |
| `c` | Jump to Current directory |

---

## Visual Design

### Colors
- **Cyan**: Section titles, selected items
- **Green**: Success, selected actions
- **Yellow**: Warnings, sync action
- **Blue**: Info, scan action
- **Red**: Errors, cancel action
- **Gray**: Secondary text, separators
- **White**: Primary content

### Icons
- 🔵 OpenCode
- 🟠 Claude Code
- 🟢 Cursor
- 🟣 Gemini CLI
- ⚪ GitHub Copilot

### Separators
Horizontal lines using `─` character separate sections.

---

## File Structure

```
packages/cli/src/ui-ink/
├── components/
│   ├── Layout.tsx              # Base layout
│   ├── UIComponents.tsx        # Shared components
│   ├── ScanView.tsx            # Scan workflow
│   ├── MigrationView.tsx       # Migration wizard
│   ├── FileBrowser.tsx         # Directory browser
│   └── ResultsPanel/           # Results display
│       ├── ResultsPanel.tsx
│       ├── index.ts
│       └── __tests__/
├── screens/                    # Screen components
│   ├── DashboardScreen.tsx
│   ├── ScanResultsScreen.tsx
│   ├── ConfirmMigrationScreen.tsx
│   ├── MigrationProgressScreen.tsx
│   ├── MigrationCompleteScreen.tsx
│   └── index.ts
├── App.tsx                     # Main app router
└── index.ts                    # Entry point
```

---

## Best Practices

1. **Consistent Layout**: All screens use Layout component
2. **Vertical Actions**: Actions always displayed as vertical list
3. **Breadcrumbs**: Always show navigation path
4. **Status Bar**: Always show available shortcuts
5. **Sections**: Group related content with Section component
6. **Wizard Flow**: Show step indicator for multi-step processes
7. **Progress**: Show progress bar for long operations
8. **Logs**: Display activity logs during migrations

---

## Migration Flow Example

### Step 1: Select Source
```
AgentSync → Migrate → Source
────────────────────────────────────────
Migration Wizard
Step 1 of 6
Select the source tool to migrate from

● ○ ○ ○ ○ ○

Available Tools
────────────────────────────────────────
🔵 OpenCode     2 agents
🟠 Claude       2 agents

────────────────────────────────────────
Actions
────────────────────────────────────────
▸ 🔵 OpenCode
  🟠 Claude

────────────────────────────────────────
↑↓ Navigate • Enter Select • q Quit
```

### Step 4: Confirm Migration
```
AgentSync → Migrate → Confirm
────────────────────────────────────────
Migration Wizard
Step 4 of 6
Migration: 🔵 OpenCode → 🟠 Claude

● ● ● ● ○ ○

Migration Details
────────────────────────────────────────
Source Tool   🔵 OpenCode
Target Tool   🟠 Claude Code
Output Path   C:\agentsync

Agents to Migrate (2)
────────────────────────────────────────
• test-runner-agent
• engineering-agent

⚠ This will create files in the output directory.

────────────────────────────────────────
Actions
────────────────────────────────────────
▸ Start Migration [s]
  Back [b]
  Cancel [c]
```

---

**Last Updated**: 2026-04-01
