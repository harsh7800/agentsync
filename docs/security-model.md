# Security Model — AgentSync CLI

## Security Principles

1. Local-only by default
2. API keys must be masked
3. Backups before overwrite
4. Optional encrypted backups
5. Explicit permission before scanning directories
6. Atomic writes only
7. No plaintext keys written to disk

---

## API Key Masking

Example:

```
sk-123456789abcdef
↓
sk-12******cdef
```

Masking happens before writing files.

---

## Backups

Backups stored in:

```
~/.agentsync/backups/
```

Rollback restores latest backup.

```
```
