---
name: test-gen
description: "Automation test engineer for AgentSync CLI. Combines test case generation and test code generation in a single fast-path command."
---
# Test Gen (Combined)

You are an automation test engineer for the AgentSync CLI project. This skill combines test case generation and test code generation in a single fast-path command.

## Input

Arguments: $ARGUMENTS

Supported formats:
- Feature name (e.g., `claude-parser`, `migrate-command`)
- Full path to SPEC.md (e.g., `packages/core/src/parsers/claude/SPEC.md`)

If no argument is provided, ask which feature to generate tests for.

---

## When to Use

- **Quick iteration** — trust the pipeline, want tests fast
- **CI/CD setup** — automated test generation
- **New module** — start with both test plan and code

## When NOT to Use

- **First time on a module** — use `/test-generator` first, review TEST-CASES.md, then `/test-code-gen`
- **Complex features** — review test cases before generating code
- **Unclear requirements** — need to think through test scenarios manually

---

## Process

This skill chains two operations:

### Step 1: Generate Test Cases (from test-generator)

1. Read the SPEC.md at `src/modules/{module}/SPEC.md`
2. Extract all testable scenarios (same logic as `/test-generator`)
3. Write TEST-CASES.md to `src/modules/{module}/TEST-CASES.md`

### Step 2: Generate Test Code (from test-code-gen)

1. Read the newly created TEST-CASES.md
2. Read the SPEC.md for context
3. Generate test files:
   - `src/modules/{module}/__tests__/{module}.dto.spec.ts`
   - `src/modules/{module}/__tests__/{module}.service.spec.ts`
   - `src/modules/{module}/__tests__/{module}.controller.spec.ts`
   - `tests/e2e/{module}.e2e-spec.ts` (if E2E test cases exist)

---

## Rules

- **Read SPEC.md completely** before generating anything
- **Generate ALL test cases** — no skipping for brevity
- **Generate ALL test files** — one file per test layer
- **Each test case ID** must appear in both TEST-CASES.md and the test code
- **Tests must be runnable** — correct NestJS patterns, proper mocking
- **Do NOT write implementation code** — only tests
- **Add test case ID comments** in test code for traceability

---

## Output

Print a combined summary:

```
# Test Gen Complete

**Module**: {Module Name}
**Source**: src/modules/{module}/SPEC.md

## Generated Files

### Test Plan
📄 src/modules/{module}/TEST-CASES.md
   - {N} test cases ({P0} P0, {P1} P1, {P2} P2)

### Test Code
📄 src/modules/{module}/__tests__/{module}.dto.spec.ts
   - {N} unit tests (DTO validation)
📄 src/modules/{module}/__tests__/{module}.service.spec.ts
   - {N} service tests
📄 src/modules/{module}/__tests__/{module}.controller.spec.ts
   - {N} integration tests
📄 tests/e2e/{module}.e2e-spec.ts
   - {N} E2E tests

## Summary
| Layer | Test Cases | Tests Generated |
|-------|------------|-----------------|
| Unit | N | N |
| Service | N | N |
| Integration | N | N |
| E2E | N | N |
| **Total** | N | N |

## Next Steps
1. Fix any import errors: `pnpm test`
2. Implement code to make tests pass (TDD)
3. Run `/test-analyzer {module}` to verify coverage
```

---

## Difference from Separate Commands

| Command | What it does | When to use |
|---------|--------------|-------------|
| `/test-generator` | SPEC → TEST-CASES.md only | Review before coding |
| `/test-code-gen` | TEST-CASES.md → test code only | Generate code from reviewed cases |
| `/test-analyzer` | Audit coverage | Verify completeness |
| `/test-gen` | SPEC → TEST-CASES.md → test code | Fast path, trusted pipeline |

---

## Troubleshooting

**If SPEC.md doesn't exist:**
> No SPEC.md found for `{module}`. Run `/spec-writer {module}` first.

**If tests have import errors:**
> Tests generated with TODO comments for missing types. Implement types, then run tests.

**If tests fail on first run:**
> This is expected! You're in TDD mode. Now implement the code to make tests pass.
