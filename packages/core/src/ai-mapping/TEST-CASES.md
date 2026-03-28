# Test Cases: AI Mapping Engine

Generated from: `packages/core/src/ai-mapping/SPEC.md`
Generated on: 2025-03-28

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit (Similarity) | 6 | 4 | 2 | 0 |
| Unit (Field Matching) | 6 | 4 | 2 | 0 |
| Unit (Mapping Engine) | 7 | 5 | 2 | 0 |
| Unit (Conflict Resolution) | 6 | 4 | 2 | 0 |
| Integration | 4 | 3 | 1 | 0 |
| E2E | 2 | 2 | 0 | 0 |
| **Total** | **31** | **22** | **9** | **0** |

---

## Unit Tests: Similarity Calculator

### S3-07-001: Exact string matches return 100
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Two identical field names "mcpServers"
- **When**: Calculating similarity
- **Then**: Returns score of 100

### S3-07-002: Similar strings with typos score above threshold
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: "mcpServers" and "mcpServer"
- **When**: Calculating similarity
- **Then**: Returns score > 80

### S3-07-003: Different strings score appropriately
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: "agents" and "skills"
- **When**: Calculating similarity
- **Then**: Returns low score (< 50)

### S3-07-004: Levenshtein distance calculation
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Strings with known edit distance
- **When**: Calculating Levenshtein distance
- **Then**: Returns correct edit count

### S3-07-005: Jaro-Winkler similarity for close matches
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Similar strings with common prefix
- **When**: Calculating Jaro-Winkler similarity
- **Then**: Returns high similarity score (0.9+)

### S3-07-006: Combined similarity with weighted algorithms
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Configured weights for string and semantic similarity
- **When**: Calculating combined similarity
- **Then**: Returns weighted average score

---

## Unit Tests: Field Matcher

### S3-07-007: Match fields with exact names
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Source fields ["name", "description"] and target fields ["name", "description"]
- **When**: Matching fields
- **Then**: Returns matches with score 100

### S3-07-008: Match fields with similar names
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Source fields ["mcpServers"] and target fields ["mcpServer"]
- **When**: Matching fields
- **Then**: Returns match with high score (> 80)

### S3-07-009: Handle nested field paths
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Nested paths like "config.mcpServers.name"
- **When**: Matching nested fields
- **Then**: Correctly matches nested structure

### S3-07-010: Find best match from candidates
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Field "agents" and candidates ["skills", "agents", "tools"]
- **When**: Finding best match
- **Then**: Returns "agents" with score 100

### S3-07-011: Respect similarity threshold
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Threshold of 70 and matches scoring 60 and 80
- **When**: Filtering matches
- **Then**: Only returns match with score 80

### S3-07-012: Handle empty field lists
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Empty source or target field lists
- **When**: Matching fields
- **Then**: Returns empty matches array

---

## Unit Tests: Mapping Engine

### S3-07-013: Analyze simple flat configurations
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Source and target configs with flat field structures
- **When**: Analyzing mappings
- **Then**: Returns analysis with field comparisons

### S3-07-014: Analyze nested configurations
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Source and target configs with nested objects
- **When**: Analyzing mappings
- **Then**: Correctly analyzes nested field paths

### S3-07-015: Handle empty configurations
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Empty source or target config
- **When**: Analyzing mappings
- **Then**: Returns empty analysis with 0 confidence

### S3-07-016: Calculate overall confidence score
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Multiple field matches with varying scores
- **When**: Calculating overall confidence
- **Then**: Returns weighted average (0-100)

### S3-07-017: Generate mapping suggestions with confidence
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Analyzed configurations
- **When**: Generating suggestions
- **Then**: Returns suggestions sorted by confidence

### S3-07-018: Include transformation recommendations
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Fields requiring transformation (e.g., type conversion)
- **When**: Generating suggestions
- **Then**: Includes transform details in suggestions

### S3-07-019: Engine configuration options
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Custom similarity thresholds and weights
- **When**: Creating engine with options
- **Then**: Uses configured options in analysis

---

## Unit Tests: Conflict Resolver

### S3-07-020: Detect one-to-many mapping conflicts
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: One source field mapped to multiple target fields
- **When**: Detecting conflicts
- **Then**: Identifies one-to-many conflict

### S3-07-021: Detect many-to-one mapping conflicts
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Multiple source fields mapped to one target field
- **When**: Detecting conflicts
- **Then**: Identifies many-to-one conflict

### S3-07-022: Detect type mismatch conflicts
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Source field (string) mapped to target field (number)
- **When**: Detecting conflicts
- **Then**: Identifies type-mismatch conflict

### S3-07-023: Detect missing required fields
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Target has required field not mapped from source
- **When**: Detecting conflicts
- **Then**: Identifies required-missing conflict

### S3-07-024: Resolve conflicts with strict strategy
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Conflicting mappings
- **When**: Resolving with strict strategy
- **Then**: Keeps only non-conflicting mappings

### S3-07-025: Provide resolution suggestions
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.spec.ts`
- **Given**: Unresolvable conflicts
- **When**: Resolving conflicts
- **Then**: Returns suggestions for manual resolution

---

## Integration Tests

### S3-07-026: Claude to OpenCode field mapping
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.integration.spec.ts`
- **Given**: Valid Claude configuration
- **When**: Analyzing mapping to OpenCode
- **Then**: Generates appropriate field mappings with high confidence

### S3-07-027: OpenCode to Claude field mapping
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.integration.spec.ts`
- **Given**: Valid OpenCode configuration
- **When**: Analyzing mapping to Claude
- **Then**: Generates appropriate field mappings with high confidence

### S3-07-028: Handle complex nested structures
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-mapping.integration.spec.ts`
- **Given**: Config with deeply nested objects and arrays
- **When**: Analyzing mappings
- **Then**: Correctly maps nested field paths

### S3-07-029: Preserve data types in mappings
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-mapping.integration.spec.ts`
- **Given**: Fields with specific types (string, number, boolean)
- **When**: Generating mappings
- **Then**: Preserves or transforms types appropriately

---

## E2E Tests

### S3-18-001: Full migration flow with AI mapping
- **Priority**: P0
- **File**: `packages/e2e/ai-mapping.e2e-spec.ts`
- **Steps**:
  1. Create source tool config (Claude)
  2. Run AI mapping analysis
  3. Accept suggested mappings
  4. Execute migration
- **Expected**: Migration succeeds with correctly mapped fields

### S3-18-002: Interactive conflict resolution
- **Priority**: P0
- **File**: `packages/e2e/ai-mapping.e2e-spec.ts`
- **Steps**:
  1. Create configs with conflicting fields
  2. Run AI mapping with conflict detection
  3. Resolve conflicts interactively
  4. Complete migration
- **Expected**: Conflicts detected and resolved, migration succeeds

---

## Security Tests

| ID | Description | Criteria |
|----|-------------|----------|
| SEC-MAP-001 | No sensitive data in mapping analysis | API keys and secrets excluded from analysis |
| SEC-MAP-002 | Mapping results don't expose config values | Only field names and types, not values |

---

## Performance Tests

| ID | Description | Criteria |
|----|-------------|----------|
| PERF-MAP-001 | Similarity calculation performance | < 1ms per field pair |
| PERF-MAP-002 | Full analysis performance | < 100ms for 100 fields |
| PERF-MAP-003 | Memory usage | < 50MB for typical configs |

---

## Mock Data

```typescript
// packages/core/src/__tests__/fixtures/ai-mapping.ts
export const mockClaudeConfig = {
  tool: 'claude',
  version: '1.0.0',
  fields: [
    { name: 'mcpServers', type: 'object', required: true },
    { name: 'agents', type: 'array', required: false },
    { name: 'settings', type: 'object', required: false }
  ],
  raw: {
    mcpServers: {},
    agents: []
  }
};

export const mockOpenCodeConfig = {
  tool: 'opencode',
  version: '1.0.0',
  fields: [
    { name: 'mcpServer', type: 'object', required: true },
    { name: 'skills', type: 'array', required: false },
    { name: 'config', type: 'object', required: false }
  ],
  raw: {
    mcpServer: {},
    skills: []
  }
};

export const mockFieldComparisons = [
  { sourceField: 'mcpServers', targetField: 'mcpServer', similarity: 95, matchType: 'similar', confidence: 90 },
  { sourceField: 'agents', targetField: 'skills', similarity: 40, matchType: 'fuzzy', confidence: 45 }
];
```

---

## Running Tests

```bash
# Run all AI mapping tests
pnpm test -- --testPathPattern=ai-mapping

# Run unit tests only
pnpm test -- packages/core/src/__tests__/ai-mapping.spec.ts

# Run integration tests
pnpm test -- packages/core/src/__tests__/ai-mapping.integration.spec.ts

# Run E2E tests
pnpm test -- packages/e2e/ai-mapping.e2e-spec.ts

# Run with coverage
pnpm test -- --coverage --testPathPattern=ai-mapping
```

---

## Coverage Requirements

| Category | Target |
|----------|--------|
| Similarity Calculator | 100% |
| Field Matcher | 100% |
| Mapping Engine | 100% |
| Conflict Resolver | 100% |
| Integration Tests | 85% |
| E2E Tests | Key flows |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| Third-party semantic analysis libraries | Out of scope, use mocks |
| CLI integration | Tested in CLI module |
| File system operations | Mocked in unit tests |

---

## Related Test Cases

- S3-01 to S3-06: Smart Agent Scanner tests
- S2-01 to S2-04: Translator tests (bidirectional)
- S2-05 to S2-06: File operations tests
