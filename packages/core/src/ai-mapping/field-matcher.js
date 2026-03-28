import { SimilarityCalculator } from './similarity-calculator.js';
/**
 * FieldMatcher
 *
 * Handles field matching algorithms between source and target configurations.
 */
export class FieldMatcher {
    calculator;
    options;
    constructor(options) {
        this.calculator = new SimilarityCalculator();
        this.options = {
            similarityThreshold: 60,
            ...options
        };
    }
    /**
     * Match fields between source and target
     */
    matchFields(sourceFields, targetFields) {
        const matches = [];
        const threshold = this.options.similarityThreshold ?? 60;
        for (const sourceField of sourceFields) {
            const bestMatch = this.findBestMatch(sourceField, targetFields);
            if (bestMatch.score >= threshold) {
                matches.push({
                    sourceField,
                    targetField: bestMatch.field,
                    score: bestMatch.score
                });
            }
        }
        return matches;
    }
    /**
     * Find the best match for a field from candidates
     */
    findBestMatch(field, candidates) {
        if (candidates.length === 0) {
            return { field: '', score: 0 };
        }
        let bestField = candidates[0];
        let bestScore = this.calculator.calculateSimilarity(field, candidates[0]);
        for (let i = 1; i < candidates.length; i++) {
            const score = this.calculator.calculateSimilarity(field, candidates[i]);
            if (score > bestScore) {
                bestScore = score;
                bestField = candidates[i];
            }
        }
        return { field: bestField, score: bestScore };
    }
    /**
     * Extract all field paths from a nested field structure
     */
    extractFieldPaths(fields) {
        // For now, just return the fields as-is
        // In a full implementation, this would flatten nested structures
        return fields;
    }
}
//# sourceMappingURL=field-matcher.js.map