# Test Cases: Smart Agent Scanner

Generated from: `packages/core/src/ai-scanner/SPEC.md`
Generated on: 2025-03-28

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit (Scanner) | 12 | 8 | 3 | 1 |
| Unit (Categorizer) | 4 | 3 | 1 | 0 |
| Unit (Content Analysis) | 5 | 3 | 2 | 0 |
| Integration | 3 | 2 | 1 | 0 |
| **Total** | **24** | **16** | **7** | **1** |

---

## Unit Tests: Scanner

### UNIT-SCANNER-001: Basic scan finds agents in current directory
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Current directory contains `.opencode/agents/test.agent.md`
- **When**: Scanner.scan({ scope: 'local', depth: 3 }) is called
- **Then**: Returns agent with correct path and tool type

### UNIT-SCANNER-002: Scan respects depth limit
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Agents exist at depth 1 and depth 5
- **When**: Scanner.scan({ depth: 2 }) is called
- **Then**: Only returns agents within 2 directory levels

### UNIT-SCANNER-003: Scan with custom patterns
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Custom pattern `**/*.custom.json` provided
- **When**: Scanner.scan({ patterns: ['**/*.custom.json'] }) is called
- **Then**: Only matches files with custom pattern

### UNIT-SCANNER-004: Scan filters by tool type
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Agents for claude and opencode exist
- **When**: Scanner.scan({ tools: ['opencode'] }) is called
- **Then**: Only returns opencode agents

### UNIT-SCANNER-005: Scan returns duration and statistics
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Directory with 5 agents
- **When**: Scanner.scan() completes
- **Then**: Returns duration > 0 and filesScanned count

### UNIT-SCANNER-006: Scan handles permission errors gracefully
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Directory with permission denied subdirectory
- **When**: Scanner.scan() is called
- **Then**: Continues scanning, logs warning, returns other agents

### UNIT-SCANNER-007: Detect agents for specific tool
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Multiple paths to search
- **When**: detectAgents('opencode', paths) is called
- **Then**: Returns only opencode agents from those paths

### UNIT-SCANNER-008: Empty directory returns empty result
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Empty directory
- **When**: Scanner.scan() is called
- **Then**: Returns empty agents array, zero duration

### UNIT-SCANNER-009: Scan with invalid tool name throws error
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Invalid tool name 'invalid-tool'
- **When**: Scanner.scan({ tools: ['invalid-tool'] }) is called
- **Then**: Throws ValidationError

### UNIT-SCANNER-010: Scan with invalid pattern syntax throws error
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Malformed glob pattern `[invalid`
- **When**: Scanner.scan({ patterns: ['[invalid'] }) is called
- **Then**: Throws PatternError with details

### UNIT-SCANNER-011: Scan handles broken symlinks
- **Priority**: P2
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: Directory with broken symlink
- **When**: Scanner.scan() is called
- **Then**: Skips broken symlink, continues scanning

### UNIT-SCANNER-012: Scan respects .gitignore patterns
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/scanner.spec.ts`
- **Given**: node_modules/ contains agent files
- **When**: Scanner.scan() is called
- **Then**: Excludes node_modules/ from scan

---

## Unit Tests: Categorizer

### UNIT-CAT-001: Categorize local agents correctly
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/categorizer.spec.ts`
- **Given**: Agents in ./agents/ directory
- **When**: categorize(agents) is called
- **Then**: All agents marked as 'local'

### UNIT-CAT-002: Categorize system agents correctly
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/categorizer.spec.ts`
- **Given**: Agents in ~/.config/opencode/
- **When**: categorize(agents) is called
- **Then**: All agents marked as 'system'

### UNIT-CAT-003: Mixed local and system agents
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/categorizer.spec.ts`
- **Given**: Mix of local and system paths
- **When**: categorize(agents) is called
- **Then**: Correctly separates into local and system arrays

### UNIT-CAT-004: Handle agents with ambiguous paths
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/categorizer.spec.ts`
- **Given**: Agent path outside both local and system patterns
- **When**: categorize(agents) is called
- **Then**: Defaults to 'local' with warning

---

## Unit Tests: Content Analysis

### UNIT-ANALYZE-001: Analyze agent file content
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/analyzer.spec.ts`
- **Given**: Valid opencode agent markdown file
- **When**: analyzeContent(filePath) is called
- **Then**: Returns AgentInfo with correct type and metadata

### UNIT-ANALYZE-002: Analyze JSON config file
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/analyzer.spec.ts`
- **Given**: Claude settings.json file
- **When**: analyzeContent(filePath) is called
- **Then**: Returns AgentInfo with config type

### UNIT-ANALYZE-003: Invalid agent file returns null
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner/analyzer.spec.ts`
- **Given**: Random text file (not agent)
- **When**: analyzeContent(filePath) is called
- **Then**: Returns null

### UNIT-ANALYZE-004: Handle file read errors
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/analyzer.spec.ts`
- **Given**: File that cannot be read
- **When**: analyzeContent(filePath) is called
- **Then**: Returns null, logs warning

### UNIT-ANALYZE-005: Analyze supports all tool formats
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner/analyzer.spec.ts`
- **Given**: Files from all 5 tools (claude, opencode, gemini, cursor, copilot)
- **When**: analyzeContent() called for each
- **Then**: Correctly identifies each tool type

---

## Integration Tests

### INT-SCANNER-001: Full scan with categorization
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner.integration.spec.ts`
- **Given**: Test directory with local and system agents
- **When**: Full scan() workflow executed
- **Then**: All agents found, correctly categorized, proper statistics

### INT-SCANNER-002: Scanner with file operations integration
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-scanner.integration.spec.ts`
- **Given**: Directory with nested agent files
- **When**: Scanner uses FileOperations to read
- **Then**: Successfully finds and analyzes all agents

### INT-SCANNER-003: End-to-end scan and detect workflow
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-scanner.integration.spec.ts`
- **Given**: Complex directory structure with multiple tools
- **When**: scan() → detectAgents() → categorize() workflow
- **Then**: Complete pipeline produces valid ScanResult

---

## Performance Tests

### PERF-SCANNER-001: Scan large directory efficiently
- **Priority**: P2
- **File**: `packages/core/src/__tests__/ai-scanner.perf.spec.ts`
- **Given**: Directory with 1000+ files
- **When**: Scanner.scan() called
- **Then**: Completes in < 5 seconds

### PERF-SCANNER-002: Scan with deep nesting
- **Priority**: P2
- **File**: `packages/core/src/__tests__/ai-scanner.perf.spec.ts`
- **Given**: Directory with 10 levels of nesting
- **When**: Scanner.scan({ depth: 10 }) called
- **Then**: Completes without stack overflow

---

## Security Tests

| ID | Description | Criteria |
|----|-------------|----------|
| SEC-SCANNER-001 | No path traversal | Cannot escape base directory |
| SEC-SCANNER-002 | Safe symlink handling | Broken symlinks don't crash |
| SEC-SCANNER-003 | No sensitive file access | Respects file permissions |

---

## Test Fixtures

```typescript
// packages/core/src/__tests__/fixtures/ai-scanner.ts

export const mockDetectedAgents = {
  local: [
    {
      id: 'local-001',
      name: 'Test Agent',
      tool: 'opencode',
      path: './agents/test.agent.md',
      type: 'agent',
      category: 'local',
      size: 1024,
      lastModified: new Date('2025-03-28')
    }
  ],
  system: [
    {
      id: 'system-001',
      name: 'Global Config',
      tool: 'claude',
      path: '~/.config/claude/settings.json',
      type: 'config',
      category: 'system',
      size: 2048,
      lastModified: new Date('2025-03-28')
    }
  ]
};

export const mockScanOptions = {
  scope: 'both' as const,
  depth: 3,
  tools: ['opencode', 'claude']
};

export const mockScanResult = {
  agents: mockDetectedAgents,
  duration: 150, // ms
  filesScanned: 42,
  errors: []
};
```

---

## Running Tests

```bash
# Run all scanner tests
pnpm test -- --testPathPattern=ai-scanner

# Run unit tests only
pnpm test -- packages/core/src/__tests__/ai-scanner/scanner.spec.ts

# Run integration tests
pnpm test -- packages/core/src/__tests__/ai-scanner.integration.spec.ts

# Run with coverage
pnpm test -- --coverage --testPathPattern=ai-scanner
```

---

## Coverage Requirements

| Component | Target |
|-----------|--------|
| Scanner | 100% |
| Categorizer | 100% |
| Content Analyzer | 100% |
| Integration | 90% |
| Overall | 95% |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| File system internals | OS-level operations |
| Glob library internals | Third-party library has own tests |
| Specific file permissions | Platform-dependent behavior |
