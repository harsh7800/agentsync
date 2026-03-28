# AI Mapping Engine - Specification

## Overview

The AI Mapping Engine provides intelligent field mapping between different AI tool configurations using similarity scoring, pattern recognition, and conflict resolution. It analyzes source and target tool schemas to automatically suggest field mappings with confidence scores, enabling seamless migration of agent configurations between Claude Code, OpenCode, Gemini CLI, Cursor, and GitHub Copilot CLI.

## Files

| File | Purpose |
|------|---------|
| `packages/core/src/ai-mapping/mapping-engine.ts` | Core mapping engine with similarity scoring |
| `packages/core/src/ai-mapping/field-matcher.ts` | Field matching algorithms and similarity calculations |
| `packages/core/src/ai-mapping/suggestion-generator.ts` | Generates intelligent field mapping suggestions |
| `packages/core/src/ai-mapping/conflict-resolver.ts` | Resolves mapping conflicts with strategies |
| `packages/core/src/ai-mapping/similarity-calculator.ts` | String and semantic similarity algorithms |
| `packages/core/src/ai-mapping/types.ts` | TypeScript interfaces for mapping engine |
| `packages/core/src/ai-mapping/index.ts` | Module exports |

## Functions/Methods

### MappingEngine

Main class for AI-assisted field mapping between tool configurations.

#### `constructor(options?: MappingEngineOptions)`
- **Parameters**: `options` - Optional configuration for the engine
- **Description**: Initializes the mapping engine with configurable similarity thresholds

#### `async analyze(source: ToolConfig, target: ToolConfig): Promise<MappingAnalysis>`
- **Parameters**: 
  - `source` - Source tool configuration
  - `target` - Target tool configuration  
- **Returns**: `MappingAnalysis` - Complete analysis of field mappings
- **Description**: Analyzes both configurations and generates field mapping suggestions with confidence scores

#### `suggestMappings(analysis: MappingAnalysis): FieldMappingSuggestion[]`
- **Parameters**: `analysis` - Mapping analysis result
- **Returns**: Array of field mapping suggestions sorted by confidence
- **Description**: Generates intelligent mapping suggestions based on analysis

#### `calculateSimilarity(sourceField: string, targetField: string): number`
- **Parameters**: Field names to compare
- **Returns**: Similarity score (0-100)
- **Description**: Calculates similarity between field names using multiple algorithms

### FieldMatcher

Handles field matching algorithms.

#### `matchFields(sourceFields: string[], targetFields: string[]): FieldMatch[]`
- **Parameters**: Arrays of field names from source and target
- **Returns**: Array of field matches with scores
- **Description**: Matches fields between source and target using fuzzy matching

#### `findBestMatch(field: string, candidates: string[]): BestMatch`
- **Parameters**: Field to match and candidate fields
- **Returns**: Best matching field with score
- **Description**: Finds the best matching field from candidates

### SimilarityCalculator

Provides various similarity algorithms.

#### `levenshteinDistance(str1: string, str2: string): number`
- **Returns**: Edit distance between strings
- **Description**: Calculates Levenshtein edit distance

#### `jaroWinklerSimilarity(str1: string, str2: string): number`
- **Returns**: Similarity score (0-1)
- **Description**: Calculates Jaro-Winkler similarity for string matching

#### `semanticSimilarity(str1: string, str2: string): number`
- **Returns**: Semantic similarity score (0-1)
- **Description**: Calculates semantic similarity using word embeddings

#### `combinedSimilarity(str1: string, str2: string): number`
- **Returns**: Weighted combined score (0-100)
- **Description**: Combines multiple similarity algorithms with weights

### ConflictResolver

Resolves mapping conflicts.

#### `resolveConflicts(mappings: FieldMapping[]): ConflictResolution`
- **Parameters**: Array of field mappings
- **Returns**: Resolution result with resolved mappings and conflicts
- **Description**: Detects and resolves conflicts in field mappings

#### `detectConflicts(mappings: FieldMapping[]): MappingConflict[]`
- **Parameters**: Array of field mappings
- **Returns**: Array of detected conflicts
- **Description**: Identifies conflicts like one-to-many mappings

## Data Types

```typescript
interface MappingEngineOptions {
  /** Minimum similarity threshold (0-100, default: 60) */
  similarityThreshold?: number;
  /** Weight for string similarity (0-1, default: 0.6) */
  stringWeight?: number;
  /** Weight for semantic similarity (0-1, default: 0.4) */
  semanticWeight?: number;
  /** Enable fuzzy matching (default: true) */
  fuzzyMatching?: boolean;
}

interface ToolConfig {
  /** Tool identifier */
  tool: string;
  /** Schema version */
  version: string;
  /** Configuration fields */
  fields: ConfigField[];
  /** Raw configuration data */
  raw: Record<string, unknown>;
}

interface ConfigField {
  /** Field name */
  name: string;
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Whether field is required */
  required: boolean;
  /** Field description */
  description?: string;
  /** Nested fields for objects */
  nested?: ConfigField[];
}

interface MappingAnalysis {
  /** Source tool information */
  source: ToolInfo;
  /** Target tool information */
  target: ToolInfo;
  /** All field comparisons */
  comparisons: FieldComparison[];
  /** Overall mapping confidence (0-100) */
  overallConfidence: number;
  /** Detected conflicts */
  conflicts: MappingConflict[];
}

interface ToolInfo {
  name: string;
  version: string;
  fieldCount: number;
}

interface FieldComparison {
  sourceField: string;
  targetField: string;
  similarity: number;
  matchType: 'exact' | 'similar' | 'fuzzy' | 'none';
  confidence: number;
}

interface FieldMappingSuggestion {
  /** Source field path */
  sourcePath: string;
  /** Suggested target field path */
  targetPath: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Reason for suggestion */
  reason: string;
  /** Match type */
  matchType: 'exact' | 'similar' | 'fuzzy' | 'transform';
  /** Transformation needed */
  transform?: FieldTransform;
}

interface FieldMapping {
  source: ConfigField;
  target: ConfigField;
  confidence: number;
  transform?: FieldTransform;
}

interface FieldTransform {
  /** Transform type */
  type: 'rename' | 'convert' | 'nest' | 'flatten' | 'custom';
  /** Transform description */
  description: string;
  /** Transform function (if custom) */
  transformer?: (value: unknown) => unknown;
}

interface FieldMatch {
  sourceField: string;
  targetField: string;
  score: number;
}

interface BestMatch {
  field: string;
  score: number;
}

interface MappingConflict {
  /** Conflict type */
  type: 'one-to-many' | 'many-to-one' | 'type-mismatch' | 'required-missing';
  /** Description of the conflict */
  description: string;
  /** Affected mappings */
  affectedMappings: string[];
  /** Suggested resolution */
  suggestion: string;
}

interface ConflictResolution {
  /** Resolved mappings */
  mappings: FieldMapping[];
  /** Conflicts that couldn't be resolved */
  unresolvedConflicts: MappingConflict[];
  /** Resolution strategy used */
  strategy: ResolutionStrategy;
}

type ResolutionStrategy = 'strict' | 'lenient' | 'prompt-user';
```

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| `MappingError` | Invalid configuration or mapping failure | Error message with context |
| `SimilarityCalculationError` | Failed to calculate similarity | Fallback to string comparison |
| `ConflictResolutionError` | Unable to resolve conflicts | Return unresolved with suggestions |
| `InvalidFieldError` | Field doesn't exist in config | Skip field with warning |

## Test Scenarios

### Unit Tests (S3-07)

1. **Similarity Calculation**
   - Exact string matches return 100
   - Similar strings (typos) score > 80
   - Different strings score appropriately
   - Semantic similarity for synonyms

2. **Field Matching**
   - Match fields with exact names
   - Match fields with similar names
   - Handle nested field paths
   - Respect similarity thresholds

3. **Mapping Analysis**
   - Analyze simple configs (flat structure)
   - Analyze nested configs
   - Handle empty configs
   - Calculate overall confidence

4. **Conflict Detection**
   - Detect one-to-many mappings
   - Detect many-to-one mappings
   - Detect type mismatches
   - Detect missing required fields

### Integration Tests (S3-08)

1. **End-to-End Mapping**
   - Claude → OpenCode field mapping
   - OpenCode → Claude field mapping
   - Handle complex nested structures
   - Preserve data types

2. **Suggestion Generation**
   - Generate high-confidence suggestions
   - Generate medium-confidence suggestions
   - Include transformation recommendations
   - Sort by confidence score

### E2E Tests (S3-18)

1. **Full Migration Flow**
   - Real-world config migration
   - Interactive conflict resolution
   - Apply suggested mappings
   - Verify migrated output

## Acceptance Criteria

- [ ] Similarity scoring works for exact and fuzzy matches
- [ ] Field mapping suggestions include confidence scores
- [ ] Conflict detection identifies all conflict types
- [ ] Multiple resolution strategies available
- [ ] Transform recommendations provided for non-trivial mappings
- [ ] Semantic similarity for field names with similar meaning
- [ ] Nested field support for complex configurations
- [ ] Performance acceptable for large configs (< 100ms for typical configs)
- [ ] All edge cases handled (empty configs, missing fields, etc.)

## Dependencies

- **S3-05/06**: AI-Assisted Scanner (for detecting tool types)
- **Schema Registry**: For accessing tool schemas
- **Translator modules**: For understanding field equivalences

## Performance Requirements

- Similarity calculation: < 1ms per field pair
- Full analysis: < 100ms for configs with < 100 fields
- Memory usage: < 50MB for typical configs

## Notes

- Uses multiple similarity algorithms combined with weights
- Confidence scores help users decide which mappings to accept
- Conflict resolution strategies can be configured per migration
- Supports both automatic and interactive conflict resolution
