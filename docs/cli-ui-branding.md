# CLI UI & Branding — AgentSync CLI

## 1. Purpose

The CLI UI should feel modern, clean, and professional, similar to modern AI CLIs like Claude Code, Gemini CLI, and other developer tools. The CLI should include a banner, colors, formatted output, progress indicators, and clear migration summaries.

---

## 2. CLI Banner

The banner should appear when:

* CLI starts
* Interactive mode starts
* Help command is shown

### Example Banner (ASCII)

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗██╗   ██╗███╗   ██╗ ██████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ███████╗ ╚████╔╝ ██╔██╗ ██║██║     
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║  ╚██╔╝  ██║╚██╗██║██║     
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████║   ██║   ██║ ╚████║╚██████╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝

AgentSync CLI — AI Agent Environment Migration Tool
```

---

## 3. Alternative Minimal Banner

```
AgentSync CLI
AI Agent Environment Migration Tool
```

Or:

```
◆ AgentSync CLI
  Migrate AI agents, MCP servers, and configs between tools
```

---

## 4. Colors & Styling

Use terminal colors consistently across the CLI.

| Element           | Color                                     |
| ----------------- | ----------------------------------------- |
| Banner            | Gradient (Cyan → Purple / Blue → Magenta) |
| Success           | Green                                     |
| Warning           | Yellow                                    |
| Error             | Red                                       |
| Info              | Blue                                      |
| Tool Names        | Cyan                                      |
| Paths             | Gray                                      |
| Migration Summary | Magenta                                   |
| Section Headers   | Bold White                                |
| Prompts           | Cyan                                      |
| AI Messages       | Purple                                    |

---

## 5. Recommended Libraries

Use these Node.js libraries:

| Library         | Purpose         |
| --------------- | --------------- |
| figlet          | ASCII banner    |
| chalk           | Colors          |
| gradient-string | Gradient banner |
| boxen           | Boxes / panels  |
| ora             | Spinner         |
| cli-table3      | Tables          |
| log-symbols     | Icons           |

---

## 6. CLI Startup Screen Example

Example when running:

```
$ agentsync
```

Output:

```
[ Gradient Banner Here ]

AgentSync CLI v1.0

Detected tools:
✔ Claude Code
✔ Cursor
✔ Gemini CLI

Type a command or ask for help:
> 
```

---

## 7. Migration Output Example

```
Starting migration: Claude → Cursor

Reading Claude configuration...
Parsing MCP servers...
Mapping agents...
Masking API keys...
Backing up Cursor configuration...
Writing new configuration...

Migration Complete

Summary:
- MCP servers migrated: 3
- Agents migrated: 5
- Skills migrated: 4
- API keys masked: 2
- Warnings: 1
```

---

## 8. CLI Message Style

Use friendly but professional messages.

Examples:

**During migration**

```
Translating Claude configuration into Cursor format...
```

**Backup**

```
Backing up existing configuration...
```

**Dry run**

```
Dry run complete. No files were changed.
```

**Rollback**

```
Rollback complete. Previous configuration restored.
```

**Error**

```
Migration failed: Cursor configuration directory not found.
```

---

## 9. Spinner Usage

Use spinner for long operations:

* Reading configs
* Parsing configs
* AI mapping
* Writing files
* Backups

Example spinner text:

```
Analyzing source configuration...
Mapping agents...
Generating target configuration...
```

---

## 10. CLI UX Goals

The CLI should feel:

* Professional
* Fast
* Clean
* Modern
* Developer-focused
* Similar quality to modern AI CLIs
* Branded and recognizable
* Easy to read output
* Clear migration summaries

```
```
