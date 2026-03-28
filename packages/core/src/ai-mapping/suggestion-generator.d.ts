import type { ToolConfig, ConfigField, MappingAnalysis, FieldMappingSuggestion } from './types.js';
interface SuggestionContext {
    field: string;
    siblings: string[];
}
interface DefaultValueSuggestion {
    field: string;
    suggestedValue: unknown;
    reason: string;
}
interface HistoricalData {
    suggestion: string;
    wasCorrect: boolean;
}
/**
 * SuggestionGenerator
 *
 * Generates intelligent field mapping suggestions using pattern recognition,
 * semantic analysis, and contextual matching.
 */
export declare class SuggestionGenerator {
    private calculator;
    private calibrationData;
    constructor();
    /**
     * Generate suggestions based on naming patterns
     */
    suggestBasedOnPatterns(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[];
    /**
     * Generate semantic suggestions based on field meanings
     */
    generateSemanticSuggestions(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[];
    /**
     * Suggest type-compatible mappings
     */
    suggestTypeCompatibleMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[];
    /**
     * Calculate similarity based on field descriptions
     */
    calculateDescriptionSimilarity(sourceField: ConfigField, targetField: ConfigField): number;
    /**
     * Calculate similarity for abbreviations and naming conventions
     */
    calculateAbbreviationSimilarity(field1: string, field2: string): number;
    /**
     * Generate prioritized suggestions (required fields first)
     */
    generatePrioritizedSuggestions(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[];
    /**
     * Generate suggestions with weighted scoring
     */
    suggestWithWeightedScoring(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[];
    /**
     * Score by usage frequency
     */
    scoreByUsageFrequency(analysis: MappingAnalysis, frequentlyUsedFields: string[]): MappingAnalysis;
    /**
     * Calculate context similarity
     */
    calculateContextSimilarity(sourceContext: SuggestionContext, targetContext: SuggestionContext): number;
    /**
     * Suggest hierarchical mappings
     */
    suggestHierarchicalMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[];
    /**
     * Suggest array mappings
     */
    suggestArrayMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[];
    /**
     * Suggest nested path mappings
     */
    suggestNestedPathMappings(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[];
    /**
     * Generate suggestions with fallbacks
     */
    suggestWithFallbacks(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[];
    /**
     * Suggest default values for unmapped required fields
     */
    suggestDefaultValues(source: ToolConfig, target: ToolConfig): DefaultValueSuggestion[];
    /**
     * Generate multiple alternative suggestions
     */
    generateAlternatives(sourceField: string, targetFields: string[]): FieldMappingSuggestion[];
    /**
     * Calibrate confidence based on historical data
     */
    calibrateConfidence(historicalData: HistoricalData[]): void;
    /**
     * Calculate calibrated confidence
     */
    calculateCalibratedConfidence(source: string, target: string, baseScore: number): number;
    /**
     * Adjust score for ambiguous mappings
     */
    adjustForAmbiguity(source: string, target: string, baseScore: number): number;
    private findBestPatternMatch;
    private normalizeFieldName;
    private areEquivalentNames;
    private calculateSemanticSimilarity;
    private deduplicateSuggestions;
    private detectTransform;
    private suggestNestedMappings;
    private inferDefaultValue;
}
export {};
//# sourceMappingURL=suggestion-generator.d.ts.map