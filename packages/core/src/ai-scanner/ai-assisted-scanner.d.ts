import type { AIAssistedScanOptions, AIAssistedScanResult } from './types.js';
/**
 * AIAssistedScanner
 *
 * Provides autonomous AI-powered agent detection with intelligent analysis,
 * pattern recognition, and migration suggestions.
 */
export declare class AIAssistedScanner {
    private scanner;
    private categorizer;
    private analyzer;
    private cache;
    constructor();
    /**
     * Perform AI-assisted autonomous scan
     *
     * @param options AI-assisted scan options
     * @returns Enhanced scan result with AI analysis
     */
    scan(options: AIAssistedScanOptions): Promise<AIAssistedScanResult>;
    /**
     * Enhance agent with content analysis
     */
    private enhanceWithContentAnalysis;
    /**
     * Calculate complexity score for an agent
     */
    private calculateComplexity;
    /**
     * Calculate relevance score for prioritization
     */
    private calculateRelevanceScore;
    /**
     * Learn patterns from detected agents
     */
    private learnPatterns;
    /**
     * Generate migration suggestions
     */
    private generateMigrationSuggestions;
    /**
     * Build compatibility matrix
     */
    private buildCompatibilityMatrix;
    /**
     * Group related agents
     */
    private groupAgents;
    /**
     * Estimate migration effort
     */
    private estimateMigrationEffort;
    /**
     * Recommend target tools
     */
    private recommendTargets;
    /**
     * Detect potential conflicts
     */
    private detectConflicts;
    /**
     * Calculate overall confidence score
     */
    private calculateConfidence;
    /**
     * Detect outdated configurations
     */
    private detectOutdatedConfigs;
    /**
     * Generate cache key from options
     */
    private generateCacheKey;
}
//# sourceMappingURL=ai-assisted-scanner.d.ts.map