---
name: project-status
description: "Project navigator for AgentSync CLI. Gives a quick, clear picture of where the project stands and what to do next."
---
# Project Status

You are a project navigator for AgentSync CLI. Give the user a quick, clear picture of where the project stands and what to do next.

## Process

### Step 1: Read current state

Read these files (in parallel):
- `docs/implementation-plan.md` — the master plan with `[x]`/`[ ]` checkboxes
- `docs/README.md` — project overview
- `package.json` — dependencies and scripts
- Memory file at `.opencode/memory/PROJECT-STATUS.md` (if it exists)

### Step 2: Quick codebase scan

Do a fast scan to verify what actually exists vs what the plan says:
- Glob `packages/core/src/**/*.ts` — core package source files
- Glob `packages/cli/src/**/*.ts` — CLI package source files
- Glob `packages/schemas/src/**/*.json` — schema files
- Glob `packages/**/src/__tests__/**/*.spec.ts` — test files
- Glob `packages/e2e/**/*.e2e-spec.ts` — e2e test files
- Glob `docs/**/*.md` — documentation files

### Step 3: Detect any drift

Compare the plan checkboxes against reality:
- Any `[x]` task whose files don't exist or are stubs? → flag it
- Any `[ ]` task whose files DO exist and are functional? → flag it

### Step 4: Update the summary file

Write/update the file `.opencode/memory/PROJECT-STATUS.md` with the current state. This file persists across sessions so the next `/project-status` can diff against it.

Format of `PROJECT-STATUS.md`:
```
# AudioForge Frontend Project Status
Last updated: {date}

## Completed
- {list of done phases/tasks with 1-line summary each}

## In Progress
- {current phase/task and what's partially done}

## Blocked By
- {anything blocking progress, e.g., "API not running", "Dependencies missing"}

## Next Up
- {next 3-5 concrete tasks in dependency order}
```

### Step 5: Print the briefing

Print a SHORT briefing to the user. Keep it scannable — no walls of text.

## Output Format

```
# Project Status

## Project: AudioForge Frontend (AI Audiobook Generator UI)
{1 sentence — what this project is}

## Done
- {Completed phases/tasks, 1 line each}

## Current Phase: {Phase name}
{2-3 sentences max — what's in progress, what's partially done, any blockers}

## Next Steps (in order)
1. {concrete task with file path}
2. {concrete task with file path}
3. {concrete task with file path}

## Drift Detected
{Only show this section if Step 3 found issues. Otherwise omit entirely.}
- {1 line per issue}
```

## Rules

- **Be short**. The whole point is to avoid information overload. The whole briefing should fit in one screen.
- **Be concrete**. "Implement upload component" is vague. "Create `src/components/features/upload/file-dropzone.tsx` per frontend-docs/component-architecture.md" is actionable.
- **Don't list unbuilt future phases**. Only show what's done, what's current, and the next 3-5 tasks.
- **Don't rehash the tech stack** or architecture. The user knows the project — they just lost track of where they stopped.
- **Update `PROJECT-STATUS.md`** every time this runs so the next session has a baseline to compare against.
- **If drift is found**, mention it briefly but don't turn this into a full audit.
- **Next steps must respect dependency order** from `frontend-docs/implementation-plan.md`. Don't suggest Phase 2 work if Phase 1 isn't done.

## Implementation Plan Reference

The project follows 5 phases:
1. **Phase 1**: Project Setup & Core UI (CURRENT)
2. **Phase 2**: File Upload Flow
3. **Phase 3**: Library & Progress Tracking
4. **Phase 4**: Audio Player & Streaming
5. **Phase 5**: Polish & Testing

## Key Files to Check

| File | Purpose |
|------|---------|
| `frontend-docs/implementation-plan.md` | Master plan with all phases and checkboxes |
| `frontend-docs/api-integration.md` | API endpoint specifications |
| `frontend-docs/project-structure.md` | Expected folder structure |
| `frontend-docs/component-architecture.md` | Component patterns |
| `frontend-docs/state-management.md` | State management patterns |
| `src/app/layout.tsx` | Root layout (should have providers) |
| `src/lib/api/client.ts` | Axios API client |
| `src/lib/providers/query-provider.tsx` | React Query provider |
