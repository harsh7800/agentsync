# Migration Flow — AgentSync CLI

## 1. CLI Migration Flow

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

## 2. Detailed Pipeline

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

## 3. Dry Run Mode

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

```
```
