import type { FieldMatch, BestMatch } from './types.js';
interface MatcherOptions {
    similarityThreshold?: number;
}
/**
 * FieldMatcher
 *
 * Handles field matching algorithms between source and target configurations.
 */
export declare class FieldMatcher {
    private calculator;
    private options;
    constructor(options?: MatcherOptions);
    /**
     * Match fields between source and target
     */
    matchFields(sourceFields: string[], targetFields: string[]): FieldMatch[];
    /**
     * Find the best match for a field from candidates
     */
    findBestMatch(field: string, candidates: string[]): BestMatch;
    /**
     * Extract all field paths from a nested field structure
     */
    extractFieldPaths(fields: string[]): string[];
}
export {};
//# sourceMappingURL=field-matcher.d.ts.map