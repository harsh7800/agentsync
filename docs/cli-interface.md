# CLI Interface — AgentSync CLI

## 1. CLI Modes

AgentSync CLI supports two modes:

### Command Mode

```
agentsync migrate --from claude --to cursor
agentsync rollback cursor
agentsync detect
```

### Interactive Mode

```
agentsync
> migrate claude to cursor
> show installed tools
> rollback cursor
> help
```

Interactive mode uses AI to interpret commands.

---

## 2. CLI Commands

| Command        | Description            |
| -------------- | ---------------------- |
| migrate        | Run migration          |
| rollback       | Restore backup         |
| detect         | Detect installed tools |
| update-schemas | Update schema registry |
| report         | Show migration report  |
| doctor         | Diagnose config issues |

---

## 3. CLI Startup Flow

```
agentsync
    ↓
Show banner
    ↓
Detect tools
    ↓
Start interactive prompt
```
