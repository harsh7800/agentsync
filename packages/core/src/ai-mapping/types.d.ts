/**
 * Types for AI Mapping Engine
 */
export interface MappingEngineOptions {
    /** Minimum similarity threshold (0-100, default: 60) */
    similarityThreshold?: number;
    /** Weight for string similarity (0-1, default: 0.6) */
    stringWeight?: number;
    /** Weight for semantic similarity (0-1, default: 0.4) */
    semanticWeight?: number;
    /** Enable fuzzy matching (default: true) */
    fuzzyMatching?: boolean;
}
export interface ToolConfig {
    /** Tool identifier */
    tool: string;
    /** Schema version */
    version: string;
    /** Configuration fields */
    fields: ConfigField[];
    /** Raw configuration data */
    raw: Record<string, unknown>;
}
export interface ConfigField {
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
export interface MappingAnalysis {
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
export interface ToolInfo {
    name: string;
    version: string;
    fieldCount: number;
}
export interface FieldComparison {
    sourceField: string;
    targetField: string;
    similarity: number;
    matchType: 'exact' | 'similar' | 'fuzzy' | 'none';
    confidence: number;
}
export interface FieldMappingSuggestion {
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
export interface FieldMapping {
    source: ConfigField;
    target: ConfigField;
    confidence: number;
    transform?: FieldTransform;
}
export interface FieldTransform {
    /** Transform type */
    type: 'rename' | 'convert' | 'nest' | 'flatten' | 'custom';
    /** Transform description */
    description: string;
    /** Transform function (if custom) */
    transformer?: (value: unknown) => unknown;
}
export interface FieldMatch {
    sourceField: string;
    targetField: string;
    score: number;
}
export interface BestMatch {
    field: string;
    score: number;
}
export interface MappingConflict {
    /** Conflict type */
    type: 'one-to-many' | 'many-to-one' | 'type-mismatch' | 'required-missing';
    /** Description of the conflict */
    description: string;
    /** Affected mappings */
    affectedMappings: string[];
    /** Suggested resolution */
    suggestion: string;
}
export interface ConflictResolution {
    /** Resolved mappings */
    mappings: FieldMapping[];
    /** Conflicts that couldn't be resolved */
    unresolvedConflicts: MappingConflict[];
    /** Resolution strategy used */
    strategy: ResolutionStrategy;
}
export type ResolutionStrategy = 'strict' | 'lenient' | 'prompt-user';
export declare class MappingError extends Error {
    constructor(message: string);
}
export declare class SimilarityCalculationError extends Error {
    constructor(message: string);
}
export declare class ConflictResolutionError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=types.d.ts.map