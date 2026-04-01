# Testing Strategy — AgentSync CLI

## 1. Overview

AgentSync CLI follows a comprehensive testing strategy with **Test-Driven Development (TDD)** as the core methodology. All features follow:

```
Red → Green → Refactor
```

No production code is written without corresponding tests.

### Current Test Statistics
- **Total Tests**: 782 tests
- **Pass Rate**: 97.6%
- **Skipped**: 19 tests
- **Coverage**: Core 95%+, Schemas 88%+, CLI 91%+, E2E 100%

---

## 2. Test Architecture

### 2.1 Test Organization

```
agentsync/
├── packages/
│   ├── core/src/__tests__/          # Core package unit & integration tests
│   ├── cli/src/__tests__/            # CLI package tests
│   ├── cli/src/ui-ink/components/__tests__/  # Ink UI component tests
│   └── e2e/src/                      # End-to-end tests
├── tests/                            # Additional test utilities
└── test-reports/                     # Coverage reports
```

### 2.2 Test Types by Package

#### Core Package (`packages/core/src/__tests__/")
| File | Purpose | Test Count |
|------|---------|------------|
| `opencode.parser.spec.ts` | OpenCode parser validation | 12 tests |
| `claude.parser.spec.ts` | Claude parser validation | 7 tests |
| `cursor.parser.spec.ts` | Cursor parser validation | 33 tests |
| `gemini.parser.spec.ts` | Gemini parser validation | 29 tests |
| `opencode-to-claude.translator.spec.ts` | Translation logic | 12 tests |
| `claude-to-opencode.translator.spec.ts` | Reverse translation | 11 tests |
| `cursor-to-opencode.translator.spec.ts` | Cursor translation | 11 tests |
| `cursor-to-claude.translator.spec.ts` | Cursor to Claude | 11 tests |
| `gemini.translators.spec.ts` | Gemini translations | 16 tests |
| `opencode-to-claude-migration.spec.ts` | Migration workflow | 7 tests |
| `cross-tool-matrix.spec.ts` | Multi-tool validation | 8 tests |
| `api-key-masker.spec.ts` | Security masking | 11 tests |
| `ai-mapping.spec.ts` | AI mapping engine | 25 tests |
| `ai-scanner.spec.ts` | Scanner patterns | 17 tests |
| `ai-assisted-scanner.spec.ts` | AI-assisted detection | 17 tests |
| `ai-directory-scanner.spec.ts` | Directory scanning | 30 tests |
| `ai-cross-validator.spec.ts` | Cross-validation logic | 21 tests |
| `file-operations.integration.spec.ts` | File system operations | 13 tests |
| `field-suggestion.spec.ts` | Field suggestions | 17 tests |
| `manual-scan.spec.ts` | Manual scanning | 16 tests |
| `fixtures.spec.ts` | Test fixtures | 7 tests |

#### CLI Package (`packages/cli/src/__tests__/")
| File | Purpose | Test Count |
|------|---------|------------|
| `migrate.command.spec.ts` | Migration command | 9 tests |
| `scan.command.spec.ts` | Scan command | 13 tests |
| `scanner-ui.spec.ts` | Scanner UI | 16 tests |
| `interactive.command.spec.ts` | Interactive mode | 3 tests |
| `agent-loop.spec.ts` | Agent loop | 36 tests |
| `session-state.spec.ts` | Session management | 15 tests |
| `command-registry.spec.ts` | Command registration | 18 tests |
| `conflict-resolution.spec.ts` | Conflict handling | 17 tests |
| `mapping-prompts.spec.ts` | Mapping prompts | 17 tests |

#### CLI UI Components (`packages/cli/src/ui-ink/__tests__/")
| File | Purpose | Test Count |
|------|---------|------------|
| `components.spec.tsx` | Ink components | 45 tests |
| `ResultsPanel.integration.spec.tsx` | Results panel | 23 tests |

#### Commands (`packages/cli/src/__tests__/commands/`)
| File | Purpose | Test Count |
|------|---------|------------|
| `scan.command.spec.ts` | /scan command | 15 tests |
| `help.command.spec.ts` | /help command | 9 tests |
| `exit.command.spec.ts` | /exit command | 6 tests |
| `status.command.spec.ts` | /status command | 8 tests |

#### E2E Tests (`packages/e2e/src/`)
| File | Purpose | Test Count |
|------|---------|------------|
| `migration.e2e.spec.ts` | Migration workflows | 12 tests |
| `ai-assisted-migration.e2e.spec.ts` | AI-assisted migration | 20 tests |
| `ai-scanner.e2e.spec.ts` | AI scanner | 20 tests |
| `smart-scanner.e2e.spec.ts` | Smart scanning | 25 tests |
| `manual-scan.e2e.spec.ts` | Manual scan | 20 tests |
| `agent-mode.e2e.spec.ts` | Agent mode | 16 tests |

---

## 3. Test Categories

### 3.1 Unit Tests

Unit tests validate individual components in isolation:

- **Parsers**: Validate parsing logic for each tool format
- **Translators**: Test bidirectional transformations
- **Adapters**: Verify tool-specific adaptations
- **AI Mapping**: Test field matching and similarity calculation
- **Masking**: Ensure API keys are properly masked

**Naming Convention**: `{module}.spec.ts`

### 3.2 Integration Tests

Integration tests verify component interactions:

- **File Operations**: Atomic writes, backups, permissions
- **Migration Service**: End-to-end migration workflows
- **CLI Commands**: Command execution and output
- **Scanner Integration**: Multi-tool detection

**Naming Convention**: `{module}.integration.spec.ts`

### 3.3 E2E Tests

End-to-end tests validate complete user workflows:

- **Migration Flows**: Full tool-to-tool migrations
- **Agent Mode**: Interactive CLI workflows
- **Scanner Detection**: Real file system scanning
- **Error Handling**: Edge cases and recovery

**Naming Convention**: `{feature}.e2e.spec.ts`

---

## 4. Coverage Targets

| Package | Target | Current |
|---------|--------|---------|
| Core | 95%+ | 95%+ |
| CLI | 90%+ | 91% |
| Schemas | 85%+ | 88% |
| E2E | Critical paths | 100% |

### Coverage Exclusions
- Auto-generated files (`.d.ts`)
- Test utilities and mocks
- Type definitions

---

## 5. Running Tests

### 5.1 All Tests
```bash
pnpm test
```

### 5.2 Watch Mode
```bash
pnpm test -- --watch
```

### 5.3 Coverage Report
```bash
pnpm test:coverage
```

### 5.4 Specific Package
```bash
pnpm --filter @agent-sync/core test
pnpm --filter @agent-sync/cli test
```

### 5.5 Specific Test File
```bash
pnpm test packages/core/src/__tests__/opencode.parser.spec.ts
```

### 5.6 UI Mode
```bash
pnpm test:ui
```

---

## 6. TDD Workflow

### 6.1 Feature Development

1. **Write Test First (Red)**
2. **Implement Feature (Green)**
3. **Refactor** (maintain coverage)

### 6.2 Regression Testing

When fixing bugs:
1. Write regression test first
2. Verify test fails (reproduces bug)
3. Fix the bug
4. Verify test passes
5. Add tests at all affected layers

---

## 7. CI/CD Integration

Tests run automatically on:
- Every push to any branch
- Pull request creation/update
- Merge to main/master

### CI Pipeline
```yaml
- Lint (ESLint)
- Type Check (TypeScript)
- Unit Tests (Vitest)
- Integration Tests
- E2E Tests
- Coverage Report
```

---

*Last Updated: April 2026*
*Total Tests: 782 | Pass Rate: 97.6%*
