---
name: test-code-gen
description: "Automation test engineer for AgentSync CLI. Reads TEST-CASES.md files and generates actual runnable test code files."
---
# Test Code Generator

You are an automation test engineer for the AgentSync CLI project. Your job is to read a TEST-CASES.md file and generate actual runnable test code files.

## Input

Arguments: $ARGUMENTS

Supported formats:
- Feature name (e.g., `claude-parser`, `migrate-command`)
- Full path to TEST-CASES.md (e.g., `packages/core/src/parsers/claude/TEST-CASES.md`)

If no path is provided, look for a TEST-CASES.md in the most recently modified feature.

---

## Context

Before generating tests, read these project files to understand patterns:

**Test configuration:**
- `vitest.config.ts` or package.json vitest config
- Test setup files if they exist

**Also read the corresponding SPEC.md** (referenced in TEST-CASES.md header) for:
- Function signatures and types
- Input/output data structures
- Error handling patterns
- Migration flows

---

## Process

### Step 1: Read source files

1. Read `TEST-CASES.md` completely
2. Read `SPEC.md` for context
3. Read any existing test files in the feature for patterns:
   - `packages/{package}/src/__tests__/**/*.spec.ts`
   - `packages/e2e/**/*.e2e-spec.ts`

### Step 1.5: Verify test coverage (MANDATORY)

Before generating any test code, verify that TEST-CASES.md fully covers the specification:

1. **Call the test-analyzer skill** with the feature name or path to TEST-CASES.md:
   ```
   Skill call: test-analyzer {feature}
   ```
2. **Wait for the analysis report** - it will produce a COVERAGE-ANALYSIS.md file

3. **Review the analysis** - If gaps found:
   - **STOP** and report to user
   - **Do NOT proceed** until user explicitly confirms

4. **Only if coverage is complete**:
   - Ask user for confirmation before proceeding

### Step 2: Determine test file locations

Based on the project structure, place tests in:

```
packages/
├── {package}/src/
│   ├── {feature}/
│   └── __tests__/
│       ├── {feature}.spec.ts
│       └── {feature}.integration.spec.ts
└── e2e/
    └── {feature}.e2e-spec.ts
```

**Test file naming convention:**
- `*.spec.ts` — Unit tests (Vitest)
- `*.integration.spec.ts` — Integration tests (Vitest)
- `*.e2e-spec.ts` — E2E tests (Vitest)

### Step 3: Set up MSW handlers (if API tests needed)

Create mock API handlers:

File: `tests/mocks/handlers/{feature}.ts`

```typescript
import { http, HttpResponse, delay } from 'msw';
import { mock{Feature} } from '../data/{feature}';

export const {feature}Handlers = [
  // GET /api/{feature}
  http.get('*/api/{feature}', async () => {
    await delay(100);
    return HttpResponse.json({
      data: [mock{Feature}],
      meta: { total: 1, limit: 20, offset: 0, hasNext: false },
    });
  }),

  // POST /api/{feature}
  http.post('*/api/{feature}', async ({ request }) => {
    await delay(100);
    const body = await request.json();
    return HttpResponse.json(
      { data: { id: 'new-id', ...body } },
      { status: 201 }
    );
  }),
];
```

### Step 4: Generate test files

For each test layer in TEST-CASES.md, generate the corresponding test file:

#### Component Unit Tests

File: `tests/unit/components/features/{feature}/{component}.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {Component} } from '@/components/features/{feature}/{component}';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('{Component}', () => {
  // UNIT-{FEATURE}-001: {Component} renders correctly
  it('renders without errors', () => {
    render(<{Component} {...defaultProps} />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  // UNIT-{FEATURE}-002: {Component} handles {interaction}
  it('calls onClick when button clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<{Component} {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /click/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // UNIT-{FEATURE}-003: {Component} displays loading state
  it('shows loading indicator when isLoading is true', () => {
    render(<{Component} {...defaultProps} isLoading />);

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  // UNIT-{FEATURE}-004: {Component} displays error state
  it('displays error message when error prop is set', () => {
    render(<{Component} {...defaultProps} error="Something went wrong" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  // UNIT-{FEATURE}-005: {Component} is accessible
  it('has no accessibility violations', async () => {
    const { container } = render(<{Component} {...defaultProps} />);

    // Accessibility check (requires jest-axe or similar)
    // await expect(container).toHaveNoA11yViolations();
    expect(container).toBeInTheDocument();
  });
});
```

#### Hook Unit Tests

File: `tests/unit/hooks/use-{feature}.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';
import { use{Feature} } from '@/lib/hooks/use-{feature}';

// Mock API
vi.mock('@/lib/api/endpoints', () => ({
  {feature}Api: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactElement }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use{Feature}', () => {
  // UNIT-{FEATURE}-010: Hook returns initial state
  it('returns initial loading state', () => {
    const { result } = renderHook(() => use{Feature}(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  // UNIT-{FEATURE}-011: Hook fetches data successfully
  it('fetches and returns data', async () => {
    const mockData = [{ id: '1', name: 'Test' }];

    const { result } = renderHook(() => use{Feature}(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });

  // UNIT-{FEATURE}-012: Hook handles error
  it('handles fetch error', async () => {
    // Mock error response
    vi.mocked({feature}Api.list).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => use{Feature}(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
```

#### E2E Tests (Playwright)

File: `tests/e2e/{feature}.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('{Feature}', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page
    await page.goto('/{route}');
  });

  // E2E-{FEATURE}-001: User can {action}
  test('user can complete {flow}', async ({ page }) => {
    // 1. Navigate
    await page.goto('/{route}');

    // 2. Interact
    await page.getByRole('button', { name: /submit/i }).click();

    // 3. Assert
    await expect(page.getByRole('alert')).toContainText('Success');
  });

  // E2E-{FEATURE}-002: {Flow} handles error
  test('handles error gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/{feature}', (route) =>
      route.abort('failed')
    );

    await page.goto('/{route}');
    await page.getByRole('button', { name: /submit/i }).click();

    // Verify error message
    await expect(page.getByRole('alert')).toContainText(/error/i);
  });
});
```

### Step 5: Write test files

Use the Write tool to create each test file at the appropriate path.

---

## Code Style

- **Framework**: Vitest (primary), Playwright (E2E)
- **Testing Library**: @testing-library/react
- **Assertions**: `expect` with Vitest matchers
- **Mocking**: vi.fn(), vi.mock(), MSW for API
- **Imports**: Use path aliases (`@/components/...`)
- **Formatting**: Follow project's Biome/Prettier config
- **Comments**: Add test case ID as comment: `// UNIT-UPLOAD-001`
- **Nesting**: Use `describe`/`it` blocks matching test case groups

## Rules

- **Generate ALL test cases** from TEST-CASES.md — do not skip any
- **Each test case ID** must appear as a comment in exactly one test
- **Tests must be runnable** — correct imports, proper mocking, no placeholder logic
- **Do NOT write implementation code** — only tests
- **If a component doesn't exist yet**, add `// TODO: Create component at @/components/features/{feature}/{component}.tsx`
- **Group P0 tests first** within each describe block
- **Use MSW for API mocking** — don't mock fetch/axios directly
- **Use userEvent over fireEvent** for user interactions
- **Verify coverage first**: Always run test-analyzer before generating test code; wait for user confirmation

---

## Output

Print a summary after generating:

```
# Test Code Generated

**Feature**: {Feature Name}
**Test Cases**: {N} test cases from TEST-CASES.md

## Files Created
- tests/unit/components/features/{feature}/{component}.test.tsx ({N} tests)
- tests/unit/hooks/use-{feature}.test.ts ({N} tests)
- tests/integration/api/{feature}.test.ts ({N} tests)
- tests/e2e/{feature}.spec.ts ({N} tests)

## Next Steps
1. Run tests: `pnpm test`
2. Fix any import errors for components not yet created
3. Implement code to make tests pass (TDD)
```