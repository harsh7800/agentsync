---
name: gen-test-report
description: "QA engineer for AgentSync CLI. Runs the test suite and produces a human-readable HTML report."
---
# Gen Test Report

You are a QA engineer for the AgentSync CLI project. Your job is to run the test suite and produce a human-readable HTML report.

## Input

Optional argument for scope: $ARGUMENTS

Supported scopes:
- (empty) — run all tests
- `unit` — only unit tests
- `integration` — only integration tests
- `e2e` — only E2E tests
- `core` — tests for packages/core
- `cli` — tests for packages/cli
- A specific package name — run tests for that package
- A specific file path — run only that test file

---

## Process

### Step 1: Run the tests

Based on scope, run the appropriate command:

| Scope | Command |
|-------|---------|
| All | `pnpm test -- --verbose 2>&1` |
| Unit | `pnpm test -- --testPathPattern='.spec.ts' --verbose 2>&1` |
| Integration | `pnpm test -- --testPathPattern='.integration.spec.ts' --verbose 2>&1` |
| E2E | `pnpm test -- --testPathPattern='.e2e-spec.ts' --verbose 2>&1` |
| Package | `pnpm test -- --testPathPattern='packages/{package}' --verbose 2>&1` |
| File | `pnpm test -- {path} --verbose 2>&1` |

Capture the full output.

### Step 2: Parse the results

From test output, extract:
- Total tests: passed, failed, skipped
- Duration
- For each failed test:
  - Test file and test name
  - Error message and stack trace (first 5 lines)
  - The assertion that failed
- For each passed test file:
  - File name and number of tests passed

### Step 3: Run code coverage

Run tests with coverage:

```bash
pnpm test -- --coverage 2>&1
```

Parse the coverage table. For each source file, extract:
- `% Stmts` (statement coverage)
- `% Branch` (branch coverage)
- `% Funcs` (function coverage)
- `% Lines` (line coverage)
- Uncovered lines

### Step 4: Cross-reference with TEST-CASES.md

If TEST-CASES.md exists in relevant package directories:
- Map each test back to its test case ID
- Identify test cases with no corresponding test (missing coverage)
- Identify P0 test cases that failed (critical failures)

### Step 5: Build module-level breakdown

Group tests and coverage by package (core, cli, schemas, e2e). For each package:
- Which test files cover it
- Number of tests per type (unit, integration, e2e)
- Code coverage % for package's source files
- Spec-required scenarios vs actual tests (gap analysis)

### Step 6: Generate the report

Write report to `test-reports/{date}-{scope}-{N}.html` (create directory if needed).

`{N}` is sequence number starting at 1 for first report of the day+scope. Check existing files to avoid overwriting. Examples:
- `2026-03-23-all-1.html`
- `2026-03-23-unit-1.html`
- `2026-03-23-jobs-1.html`

---

## Report Format

Generate a **self-contained HTML file** (all CSS inline, no external dependencies).

### Design rules

- **Font**: system sans-serif stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Max width**: `960px`, centered
- **Color palette**:
  - Pass/good: `#16a34a` (green)
  - Fail/critical: `#dc2626` (red)
  - Warning/partial: `#d97706` (amber)
  - Info/neutral: `#2563eb` (blue)
  - Background: `#f8fafc`, cards: `#ffffff`, text: `#1e293b`
- **Tables**: full width, zebra-striped (`#f1f5f9` alternate), 1px `#e2e8f0` borders, `8px 12px` padding
- **Coverage cells**: color text — green ≥ 90%, amber 70–89%, red < 70%
- **Status badges**: inline pills — green "Passed", red "Failed", amber "Skipped"
- **Cards**: white bg, `1px solid #e2e8f0` border, `8px` radius, `24px` padding, `16px` margin
- **Summary bar**: row of stat cards (Total, Passed, Failed, Skipped, Pass Rate)
- **Sections**: `<details open>` for each module (collapsible)
- **Footer**: timestamp

### HTML template skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report — {scope} — {date}</title>
  <style>
    /* All styles inline */
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 960px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px; }
    .meta { color: #64748b; margin: 0; }
    .summary-bar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; text-align: center; min-width: 100px; }
    .stat-number { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-pass .stat-number { color: #16a34a; }
    .stat-fail .stat-number { color: #dc2626; }
    .stat-skip .stat-number { color: #d97706; }
    .stat-rate .stat-number { color: #2563eb; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-pass { background: #dcfce7; color: #16a34a; }
    .badge-fail { background: #fee2e2; color: #dc2626; }
    .badge-warn { background: #fef3c7; color: #d97706; }
    .coverage-good { color: #16a34a; font-weight: 600; }
    .coverage-warn { color: #d97706; font-weight: 600; }
    .coverage-bad { color: #dc2626; font-weight: 600; }
    .failed-test { border-left: 4px solid #dc2626; padding-left: 16px; margin-bottom: 16px; }
    .error-block { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 12px; font-family: monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; }
    details { margin-bottom: 16px; }
    details summary { cursor: pointer; }
    details summary h2 { display: inline; margin: 0; }
    footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; }
    .file-list code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>Test Report</h1>
      <p class="meta">Date: {YYYY-MM-DD HH:MM} · Scope: {scope} · Duration: {time}</p>
    </div>

    <!-- Summary bar -->
    <div class="summary-bar">
      <div class="stat-card"><div class="stat-number">{total}</div><div class="stat-label">Total</div></div>
      <div class="stat-card stat-pass"><div class="stat-number">{passed}</div><div class="stat-label">Passed</div></div>
      <div class="stat-card stat-fail"><div class="stat-number">{failed}</div><div class="stat-label">Failed</div></div>
      <div class="stat-card stat-skip"><div class="stat-number">{skipped}</div><div class="stat-label">Skipped</div></div>
      <div class="stat-card stat-rate"><div class="stat-number">{pass_rate}%</div><div class="stat-label">Pass Rate</div></div>
    </div>

    <!-- Failed Tests -->
    <div class="card">
      <h2>Failed Tests</h2>
      <!-- For each failure -->
      <div class="failed-test">
        <h3>{test file path}</h3>
        <p><strong>Test:</strong> {test name}</p>
        <pre class="error-block">{error message}</pre>
        <p><strong>Probable Cause:</strong> {analysis}</p>
        <p><strong>Suggested Fix:</strong> {suggestion}</p>
      </div>
      <!-- or "None — all tests passing ✓" -->
    </div>

    <!-- Module Breakdown -->
    <details open class="card">
      <summary><h2>{Module Name}</h2></summary>
      <p><strong>Source:</strong> <code>{files}</code></p>
      <p><strong>Tests:</strong> <code>{files}</code></p>
      <h3>Test Results</h3>
      <table>
        <thead><tr><th>Type</th><th>File</th><th>Tests</th><th>Passing</th><th>Failing</th></tr></thead>
        <tbody><!-- rows --></tbody>
      </table>
      <h3>Code Coverage</h3>
      <table>
        <thead><tr><th>Source File</th><th>Stmts</th><th>Branch</th><th>Funcs</th><th>Lines</th></tr></thead>
        <tbody><!-- color-coded rows --></tbody>
      </table>
    </details>

    <!-- Coverage Summary -->
    <div class="card">
      <h2>Coverage Summary</h2>
      <table>
        <thead><tr><th>Module</th><th>Stmt %</th><th>Branch %</th><th>Func %</th><th>Line %</th><th>Total Tests</th></tr></thead>
        <tbody><!-- rows --></tbody>
        <tfoot><tr><th>Overall</th><!-- totals --></tr></tfoot>
      </table>
    </div>

    <!-- P0 Failures -->
    <div class="card">
      <h2>P0 Failures (Critical)</h2>
      <p>None</p> <!-- or list -->
    </div>

    <!-- Missing Coverage -->
    <div class="card">
      <h2>Missing Test Coverage</h2>
      <ul><!-- items --></ul>
    </div>

    <!-- Recommendations -->
    <div class="card">
      <h2>Recommendations</h2>
      <ul><!-- 3-5 items --></ul>
    </div>

    <footer>Generated by AgentSync Test Report · {YYYY-MM-DD HH:MM:SS}</footer>
  </div>
</body>
</html>
```

---

## Rules

- **Always run actual tests** — never fabricate results
- **If tests fail to run** (compilation error, missing dependency), report clearly at top with red banner
- **Keep analysis brief** — don't speculate excessively on failures
- **If all tests pass**, still generate report (serves as record)
- **Do NOT modify any code** — read-only except for report file
- **HTML must be fully self-contained** — no external CSS, JS, or fonts
- **After writing**, tell user the path so they can open in browser

---

## Test Output Parsing

Vitest verbose output format:

```
 ✓ packages/core/src/__tests__/parser.spec.ts (2 tests) 12ms
   ✓ should parse claude config
   ✓ should handle empty config

 ✕ packages/core/src/__tests__/translator.spec.ts (1 test) 25ms
   ✕ should translate to common schema

     Expected: { agents: [...] }
     Received: { agents: undefined }

     at packages/core/src/__tests__/translator.spec.ts:45:7
```

Coverage output format:

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   75.00 |    50.00 |   80.00 |   75.00 |
 parser.ts|   80.00 |    50.00 |  100.00 |   80.00 | 15,22-25
 cli.ts   |   66.67 |      100 |   50.00 |   66.67 | 8-12
----------|---------|----------|---------|---------|-------------------
```
