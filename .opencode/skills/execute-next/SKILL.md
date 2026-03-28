---
name: execute-next
description: "Task executor for AgentSync CLI. Picks the next task from the implementation plan, ensures specs exist, writes tests first (TDD), implements the code, and updates the plan."
---
# Execute Next

You are the task executor for AgentSync CLI. Your job is to pick the next task from the implementation plan, ensure specs exist, write tests first (TDD), implement the code, and update the plan.

## Input

Arguments: $ARGUMENTS (optional)

Supported formats:
- (empty) — execute the next unchecked task
- `n` — execute the next n tasks (batch mode)
- `task description` — execute a specific task by description

---

## Execution Sequence

**Follow this exact sequence for every task:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTE-NEXT SEQUENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │ 1. PLAN     │ Read docs/implementation-plan.md → find next [ ]          │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 2. VERIFY   │ Check prerequisites (deps met, env configured)             │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐    ┌─────────────┐                                         │
│  │ 3. SPEC     │───▶│ spec-writer │ If SPEC.md missing for feature        │
│  └──────┬──────┘    └─────────────┘                                         │
│         ▼                                                                   │
│  ┌─────────────┐    ┌──────────────┐                                        │
│  │ 4. TEST     │───▶│test-generator│ Generate TEST-CASES.md if missing     │
│  │    CASES    │    └──────────────┘                                        │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐    ┌─────────────┐                                         │
│  │ 5. TEST     │───▶│test-code-gen│ Generate test files                    │
│  │    CODE     │    └─────────────┘                                         │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 6. RED      │ Run tests → expect FAILURES                               │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 7. GREEN    │ Implement code → tests should PASS                        │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 8. REFACTOR │ Clean up → run tests → still PASS                         │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 9. VERIFY   │ pnpm build + pnpm test → both PASS                        │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐    ┌──────────────────┐                                    │
│  │ 10. AUDIT   │───▶│ doc-audit        │ Sync docs with implementation     │
│  └──────┬──────┘    └──────────────────┘                                    │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 11. UPDATE  │ Mark task [x] in docs/implementation-plan.md             │
│  └──────┬──────┘                                                            │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 12. REPORT  │ Summary of what was done + next task                      │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Steps

### Step 1: Read the implementation plan

Read `docs/implementation-plan.md` completely. Identify:
- Current phase and progress percentage
- Next unchecked `[ ]` task in dependency order
- Any dependencies that must be satisfied first

**CRITICAL RULE: NEVER AUTO-START A NEW PHASE**
If no unchecked tasks remain in the current phase, you MUST STOP and ask the user for confirmation before proceeding to the next phase.
- Do NOT automatically proceed to a new phase under any circumstances.
- Even if the user says "continue if you have next steps", DO NOT start a new phase. "Continue" only applies to tasks within the CURRENT phase.

**Output:**
> **Next task**: {task description}
> **Feature**: {feature name if applicable}
> **Phase**: {phase number}
> **Package**: {core/cli/schemas}

### Step 2: Check prerequisites

Before executing a task, verify:

| Prerequisite | Check | Action if missing |
|--------------|-------|-------------------|
| Dependencies met | Earlier tasks in phase are `[x]` | Work on dependency first |
| SPEC.md exists | `packages/{package}/src/{feature}/SPEC.md` | → Step 3 (create spec) |
| Environment set | Node.js 18+, pnpm installed | Report to user |

### Step 3: Create SPEC.md (if missing)

If the task is for a feature and SPEC.md doesn't exist:

```
Skill call: spec-writer {feature}
```

Wait for completion, then continue to Step 4.

### Step 4: Generate TEST-CASES.md (if missing)

If TEST-CASES.md doesn't exist for the feature:

```
Skill call: test-generator {feature}
```

Wait for completion, then continue to Step 5.

### Step 5: Generate test code (if missing)

If test files don't exist or need updating:

```
Skill call: test-code-gen {feature}
```

Alternatively, for fast path:
```
Skill call: test-gen {feature}
```

### Step 6: RED Phase — Run tests (expect failures)

Run tests to confirm they fail (expected — implementation doesn't exist yet):

```bash
pnpm test -- --testPathPattern={feature} --verbose
```

**Expected**: Tests fail because implementation doesn't exist.
**If tests pass**: Something is wrong — check if implementation already exists.

**Output:**
> **RED phase**: {N} tests failing (expected)

### Step 7: GREEN Phase — Implement to make tests pass

Read `docs/implementation-plan.md` task details and implement minimal code:

1. **Core Package** (`packages/core/src/`)
   - `parsers/` — Tool-specific config parsers
   - `translators/` — Common schema translators
   - `masking/` — API key masking logic
   - `ai-mapping/` — AI-assisted mapping engine

2. **CLI Package** (`packages/cli/src/`)
   - `commands/` — CLI command implementations
   - `prompts/` — Interactive prompts
   - `ui/` — Terminal UI components

3. **Schemas Package** (`packages/schemas/src/`)
   - Tool-specific JSON schemas

Run tests again:

```bash
pnpm test -- --testPathPattern={feature} --verbose
```

**Expected**: All tests pass.

**Output:**
> **GREEN phase**: {N} tests passing

### Step 8: REFACTOR Phase — Clean up

Review and improve code:
- Extract duplicate logic to utilities
- Add proper TypeScript types
- Improve error handling
- Improve naming

Run tests again to verify nothing broke:

```bash
pnpm test -- --testPathPattern={feature} --verbose
```

### Step 9: Final verification

```bash
pnpm build        # TypeScript compilation
pnpm test         # All tests pass
```

**All must pass before marking task complete.**

### Step 10: Sync documentation with doc-audit

**MANDATORY** — Run doc-audit to ensure all documentation reflects the implementation:

```
Skill call: doc-audit {feature}
```

This will:
- Update architecture docs if new patterns added
- Update migration flow docs if changed
- Update project structure if new files created
- Flag any drift between code and docs

**If doc-audit finds issues:**
- Review the drifts found
- Apply recommended doc updates
- Do NOT modify source code — only update documentation

**Output:**
> **Docs synced**: {files updated or "no changes needed"}

### Step 11: Update the implementation plan

Mark the task as complete:

```
Edit: docs/implementation-plan.md
- [ ] task description → [x] task description
```

### Step 12: Report results

Print summary:

```
## Task Complete: {task description}

### What was done
{Brief summary}

### Files changed
- packages/{package}/src/{file}.ts — {what}
- packages/{package}/src/__tests__/{file}.spec.ts — {tests added}

### Tests
- {N} test cases
- {N} tests passing

### Docs Updated
- {doc files updated by doc-audit}

### Next task (in order)
1. {next task from plan}
2. {task after that}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Tests fail in GREEN phase | Fix implementation, NOT tests |
| TypeScript compilation fails | Fix type errors, re-run build |
| Missing dependency | `pnpm install` |
| Schema validation fails | Check JSON schema syntax |

---

## Batch Mode

When user says "do 3 tasks" or "batch mode":

1. Read plan
2. Identify 2-4 related tasks (same package, dependent)
3. Execute each following full sequence (Steps 3-11)
4. Run full test suite after batch
5. Update plan for all completed tasks
6. Report batch results

**Batch rules:**
- Max 4 tasks per batch (unless trivial)
- Never cross phase boundaries without approval
- All tests must pass before next task

---

## Rules

- **Never skip RED phase**. Tests first, always.
- **Never modify tests to make them pass**. Fix implementation.
- **Minimal implementation**. Only enough to pass tests.
- **Respect patterns**. Match existing code style (see `docs/folder-structure.md`).
- **Update the plan immediately**. Don't batch plan updates.
- **Verify before marking done**. Build + tests = done.
- **ALWAYS run doc-audit**. Documentation must sync after every implementation. This is mandatory, not optional.
- **NEVER automatically proceed to a new phase**. Always ask user for confirmation before starting a new phase.
- **Pure functions in core**. Core package must have zero I/O, fully testable.
