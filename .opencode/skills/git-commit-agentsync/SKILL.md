---
name: git-commit-agentsync
description: "Create standardized, semantic git commits for AgentSync CLI using Conventional Commits specification."
---
# Git Commit with Conventional Commits

Create standardized, semantic git commits for the AgentSync CLI project using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
|------------|--------------------------------|
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## AudioForge Scopes

Common scopes for this project:

| Scope       | Description                    |
|-------------|--------------------------------|
| `jobs`      | Job management module          |
| `files`     | File upload module             |
| `audio`     | Audio processing module        |
| `workers`   | BullMQ workers/pipeline        |
| `schema`    | Database schema changes        |
| `api`       | API endpoint changes           |
| `config`    | Configuration changes          |
| `deps`      | Dependency updates             |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated TTS endpoint

# BREAKING CHANGE footer
feat: add new job status 'archived'

BREAKING CHANGE: status enum now includes 'archived'
```

---

## Workflow

### 1. Analyze Diff

```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, use working tree diff
git diff

# Also check status
git status --porcelain
```

### 2. Stage Files (if needed)

If nothing is staged or you want to group changes differently:

```bash
# Stage specific files
git add src/modules/jobs/jobs.service.ts src/modules/jobs/__tests__/jobs.service.spec.ts

# Stage by pattern
git add src/modules/**/*.spec.ts

# Interactive staging
git add -p
```

**Never commit secrets** (`.env`, credentials, private keys, API keys).

### 3. Generate Commit Message

Analyze the diff to determine:

| Element | How to determine |
|---------|------------------|
| **Type** | What kind of change? (feat, fix, test, etc.) |
| **Scope** | What module/area is affected? (jobs, audio, workers, etc.) |
| **Description** | One-line summary, present tense, imperative, <72 chars |

### 4. Execute Commit

```bash
# Single line
git commit -m "feat(jobs): add job priority queue support"

# Multi-line with body
git commit -m "$(cat <<'EOF'
fix(audio): handle TTS timeout gracefully

Add retry logic with exponential backoff when TTS provider times out.
Default max retries: 3, initial delay: 1000ms.

Closes #42
EOF
)"
```

---

## AudioForge-Specific Patterns

### Job-related changes
```
feat(jobs): add job cancellation endpoint
fix(jobs): prevent duplicate job creation
test(jobs): add unit tests for job status validation
```

### Audio/TTS-related changes
```
feat(audio): add ElevenLabs voice selection
fix(audio): handle empty text chunk in TTS
perf(audio): parallelize chunk processing
```

### Worker/pipeline changes
```
feat(workers): add summarization pipeline step
fix(workers): handle failed upload retry
refactor(workers): extract text cleaning to utility
```

### Database changes
```
feat(schema): add voice preference to jobs table
fix(schema): add missing index on job_steps
chore(schema): regenerate migrations
```

### Documentation changes
```
docs: update API routes for job endpoints
docs(api): add webhook documentation
docs(readme): update setup instructions
```

---

## Best Practices

- **One logical change per commit** — Don't mix unrelated changes
- **Present tense**: "add" not "added"
- **Imperative mood**: "fix bug" not "fixes bug"
- **Reference issues**: `Closes #123`, `Refs #456`
- **Keep description under 72 characters**
- **Body explains WHY, not WHAT** (the diff shows what)

---

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master
- NEVER commit `.env`, credentials, or secrets
- If commit fails due to hooks, fix and create NEW commit (don't amend)

---

## Output

After successful commit:

```
## Committed

**Commit**: {short hash}
**Message**: {type}({scope}): {description}

**Files changed**:
- {file1}
- {file2}

**Stats**: {N} files changed, {N} insertions(+), {N} deletions(-)

**Next**: {suggestion based on implementation plan}
```
