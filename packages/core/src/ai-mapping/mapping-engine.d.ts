import type { MappingEngineOptions, ToolConfig, MappingAnalysis, FieldMappingSuggestion } from './types.js';
/**
 * MappingEngine
 *
 * Core engine for AI-assisted field mapping between tool configurations.
 */
export declare class MappingEngine {
    private options;
    private matcher;
    private calculator;
    private resolver;
    constructor(options?: MappingEngineOptions);
    /**
     * Analyze mapping between source and target configurations
     */
    analyze(source: ToolConfig, target: ToolConfig): Promise<MappingAnalysis>;
    /**
     * Generate mapping suggestions from analysis
     */
    suggestMappings(analysis: MappingAnalysis): FieldMappingSuggestion[];
    /**
     * Calculate similarity between two field names
     */
    calculateSimilarity(sourceField: string, targetField: string): number;
    /**
     * Extract all field paths including nested fields
     */
    private extractAllFields;
    /**
     * Create tool info from config
     */
    private createToolInfo;
    /**
     * Calculate overall confidence from comparisons
     */
    private calculateOverallConfidence;
    /**
     * Determine match type based on similarity score
     */
    private determineMatchType;
    /**
     * Determine if transformation is needed
     */
    private determineTransform;
    /**
     * Generate reason for suggestion
     */
    private generateReason;
}
//# sourceMappingURL=mapping-engine.d.ts.map