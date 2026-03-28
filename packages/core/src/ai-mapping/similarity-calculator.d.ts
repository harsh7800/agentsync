interface CalculatorOptions {
    stringWeight?: number;
    semanticWeight?: number;
}
/**
 * SimilarityCalculator
 *
 * Provides various string similarity algorithms for field matching.
 */
export declare class SimilarityCalculator {
    private options;
    constructor(options?: CalculatorOptions);
    /**
     * Calculate similarity between two strings (0-100)
     */
    calculateSimilarity(str1: string, str2: string): number;
    /**
     * Calculate Levenshtein edit distance
     */
    levenshteinDistance(str1: string, str2: string): number;
    /**
     * Calculate Jaro-Winkler similarity (0-1)
     */
    jaroWinklerSimilarity(str1: string, str2: string): number;
    /**
     * Calculate Jaro similarity (0-1)
     */
    private jaroSimilarity;
    /**
     * Calculate semantic similarity (placeholder - returns string similarity)
     */
    semanticSimilarity(str1: string, str2: string): number;
    /**
     * Combined similarity with weighted algorithms (0-100)
     */
    combinedSimilarity(str1: string, str2: string): number;
}
export {};
//# sourceMappingURL=similarity-calculator.d.ts.map