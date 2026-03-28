import { FieldMatcher } from './field-matcher.js';
import { SimilarityCalculator } from './similarity-calculator.js';
import { ConflictResolver } from './conflict-resolver.js';
/**
 * MappingEngine
 *
 * Core engine for AI-assisted field mapping between tool configurations.
 */
export class MappingEngine {
    options;
    matcher;
    calculator;
    resolver;
    constructor(options) {
        this.options = {
            similarityThreshold: options?.similarityThreshold ?? 60,
            stringWeight: options?.stringWeight ?? 0.6,
            semanticWeight: options?.semanticWeight ?? 0.4,
            fuzzyMatching: options?.fuzzyMatching ?? true
        };
        this.matcher = new FieldMatcher({ similarityThreshold: this.options.similarityThreshold });
        this.calculator = new SimilarityCalculator({
            stringWeight: this.options.stringWeight,
            semanticWeight: this.options.semanticWeight
        });
        this.resolver = new ConflictResolver();
    }
    /**
     * Analyze mapping between source and target configurations
     */
    async analyze(source, target) {
        const comparisons = [];
        const sourceFields = this.extractAllFields(source.fields);
        const targetFields = this.extractAllFields(target.fields);
        // Compare each source field with each target field
        for (const sourceField of sourceFields) {
            for (const targetField of targetFields) {
                const similarity = this.calculator.calculateSimilarity(sourceField, targetField);
                const matchType = this.determineMatchType(similarity);
                comparisons.push({
                    sourceField,
                    targetField,
                    similarity,
                    matchType,
                    confidence: similarity
                });
            }
        }
        // Calculate overall confidence
        const overallConfidence = this.calculateOverallConfidence(comparisons);
        // Detect conflicts
        const fieldMappings = comparisons
            .filter(c => c.confidence >= this.options.similarityThreshold)
            .map(c => ({
            source: { name: c.sourceField, type: 'string', required: false },
            target: { name: c.targetField, type: 'string', required: false },
            confidence: c.confidence
        }));
        const conflicts = this.resolver.detectConflicts(fieldMappings, target.fields);
        return {
            source: this.createToolInfo(source),
            target: this.createToolInfo(target),
            comparisons,
            overallConfidence,
            conflicts
        };
    }
    /**
     * Generate mapping suggestions from analysis
     */
    suggestMappings(analysis) {
        const suggestions = [];
        const processedTargets = new Set();
        // Sort comparisons by confidence (highest first)
        const sortedComparisons = [...analysis.comparisons]
            .filter(c => c.confidence >= this.options.similarityThreshold)
            .sort((a, b) => b.confidence - a.confidence);
        for (const comparison of sortedComparisons) {
            // Skip if target already has a better mapping
            if (processedTargets.has(comparison.targetField)) {
                continue;
            }
            const transform = this.determineTransform(comparison);
            suggestions.push({
                sourcePath: comparison.sourceField,
                targetPath: comparison.targetField,
                confidence: comparison.confidence,
                reason: this.generateReason(comparison),
                matchType: transform ? 'transform' : (comparison.matchType === 'none' ? 'fuzzy' : comparison.matchType),
                transform
            });
            processedTargets.add(comparison.targetField);
        }
        // Sort by confidence
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Calculate similarity between two field names
     */
    calculateSimilarity(sourceField, targetField) {
        return this.calculator.calculateSimilarity(sourceField, targetField);
    }
    /**
     * Extract all field paths including nested fields
     */
    extractAllFields(fields, prefix = '') {
        const paths = [];
        for (const field of fields) {
            const path = prefix ? `${prefix}.${field.name}` : field.name;
            paths.push(path);
            if (field.nested && field.nested.length > 0) {
                paths.push(...this.extractAllFields(field.nested, path));
            }
        }
        return paths;
    }
    /**
     * Create tool info from config
     */
    createToolInfo(config) {
        return {
            name: config.tool,
            version: config.version,
            fieldCount: config.fields.length
        };
    }
    /**
     * Calculate overall confidence from comparisons
     */
    calculateOverallConfidence(comparisons) {
        if (comparisons.length === 0) {
            return 0;
        }
        // Get best match for each source field
        const bestMatches = new Map();
        for (const comparison of comparisons) {
            const current = bestMatches.get(comparison.sourceField) || 0;
            if (comparison.confidence > current) {
                bestMatches.set(comparison.sourceField, comparison.confidence);
            }
        }
        // Calculate average of best matches
        const scores = Array.from(bestMatches.values());
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return Math.round(average);
    }
    /**
     * Determine match type based on similarity score
     */
    determineMatchType(similarity) {
        if (similarity === 100) {
            return 'exact';
        }
        else if (similarity >= 80) {
            return 'similar';
        }
        else if (similarity >= this.options.similarityThreshold) {
            return 'fuzzy';
        }
        return 'none';
    }
    /**
     * Determine if transformation is needed
     */
    determineTransform(comparison) {
        // Check if field names are different (rename needed)
        if (comparison.sourceField !== comparison.targetField && comparison.similarity >= 80) {
            return {
                type: 'rename',
                description: `Rename "${comparison.sourceField}" to "${comparison.targetField}"`
            };
        }
        return undefined;
    }
    /**
     * Generate reason for suggestion
     */
    generateReason(comparison) {
        if (comparison.matchType === 'exact') {
            return `Exact field name match`;
        }
        else if (comparison.matchType === 'similar') {
            return `Similar field names (${comparison.similarity}% match)`;
        }
        else if (comparison.matchType === 'fuzzy') {
            return `Fuzzy match (${comparison.similarity}% similarity)`;
        }
        return `Low confidence match`;
    }
}
//# sourceMappingURL=mapping-engine.js.map