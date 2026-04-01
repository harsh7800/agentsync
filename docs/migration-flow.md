# Migration Flow — AgentSync CLI

## 1. Agent Mode Flow (Interactive REPL)

### 1.1 Entry Flow

```
User: agentsync
    ↓
Show Banner
    ↓
AgentSync Interactive Mode
    ↓
Show Help Hint
    ↓
Start Agent Loop (REPL)
    ↓
Wait for Slash Commands
```

### 1.2 /scan Command Flow

```
User: /scan
    ↓
Prompt: Scan Scope?
    - Current directory
    - Entire system  
    - Custom path
    ↓
User Selection
    ↓
Start Scanner UI (spinner)
    ↓
For each known path:
    - Update spinner text
    - Scan directory
    - Parse configs
    - Show success/fail
    ↓
Display Scan Results Summary
    ↓
Prompt: Migrate now?
    - Yes → Start Migration Flow
    - No → Return to Agent Loop
    ↓
Update Session State
    ↓
Return to Agent Loop
```

### 1.3 /migrate Command Flow

```
User: /migrate
    ↓
Check Session State
    ↓
If session has scanned agents:
    - Use detected agents from session
    Else:
    - Prompt: Run /scan first?
        ↓
Prompt: Select Target Tool
    - Claude Code
    - OpenCode
    - Gemini CLI
    - Cursor
    - Copilot CLI
    ↓
Migration Engine
    ↓
Show Migration Progress
    ↓
Show Migration Summary
    ↓
Return to Agent Loop
```

### 1.4 /status Command Flow

```
User: /status
    ↓
Read Session State
    ↓
Display Session Summary:
    - Scan status
    - Tools detected
    - Agents found (count + names)
    - Skills found
    - MCP servers
    - Scanned paths
    - Target tool (if selected)
    ↓
Return to Agent Loop
```

---

## 2. Traditional CLI Migration Flow

When the user runs a migration command:

```
agentsync migrate
```

The CLI performs the following steps:

1. Detect installed tools
2. Ask user for source tool
3. Ask user for target tool
4. Ask what to migrate (MCP / agents / keys)
5. Show permission prompt
6. Read source configuration files
7. Send configs to migration engine
8. Receive migration result
9. Mask keys
10. Backup target configs
11. Write new configs
12. Generate migration report
13. Show summary to user

---

## 3. Detailed Pipeline

```
Detect Tools
    ↓
User Selection
    ↓
Permission Prompt
    ↓
Read Source Files
    ↓
Migration Engine
    ↓
Migration Result
    ↓
Backup Target Files
    ↓
Write New Files
    ↓
Generate Report
    ↓
Show Summary
```

---

## 4. Dry Run Mode

```
agentsync migrate --dry-run
```

Dry run performs:

* Parsing
* Transformation
* AI mapping
* Adapter conversion
* Shows files that would change
* Does NOT write any files

---

## 5. Session State Lifecycle

### State Creation

```
/scan command
    ↓
Scan completes
    ↓
Session State Created:
    {
      scannedTools: [...],
      detectedAgents: [...],
      detectedSkills: [...],
      detectedMCPs: [...],
      scanPaths: [...],
      selectedTargetTool: null,
      scanTimestamp: "..."
    }
```

### State Updates

```
/migrate command
    ↓
User selects target tool
    ↓
Update State:
    selectedTargetTool = "opencode"
```

### State Persistence

```
Agent Mode Session:
    - State held in memory during session
    - Available to all slash commands
    - Reset on new /scan
    - Lost on /exit (unless save/restore implemented)
```

---

## 6. Comparison: Agent Mode vs Command Mode

| Aspect | Agent Mode | Command Mode |
|--------|------------|--------------|
| Entry | `agentsync` | `agentsync migrate ...` |
| Interface | REPL with slash commands | One-shot command |
| State | Persistent session | Stateless |
| Scan → Migrate | `/scan` then `/migrate` | `migrate --from x --to y` |
| Progress | Live UI with spinner | Static output |
| Use Case | Interactive exploration | Automation/scripts |

---

## 7. Error Handling Flow

### Scan Errors

```
Scanning ~/.claude...
    ↓
Error: Permission denied
    ↓
Show: ⚠ Cannot read ~/.claude/ (permission denied)
    ↓
Continue scanning other paths
```

### Migration Errors

```
Migrating...
    ↓
Error: Target tool not installed
    ↓
Show: ✖ Migration failed: OpenCode not found
    ↓
Return to Agent Loop
```

