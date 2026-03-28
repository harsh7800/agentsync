import { SimilarityCalculator } from './similarity-calculator.js';
import type { 
  ToolConfig, 
  ConfigField, 
  MappingAnalysis, 
  FieldComparison,
  FieldMappingSuggestion,
  FieldTransform
} from './types.js';

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
export class SuggestionGenerator {
  private calculator: SimilarityCalculator;
  private calibrationData: Map<string, number> = new Map();

  constructor() {
    this.calculator = new SimilarityCalculator();
  }

  /**
   * Generate suggestions based on naming patterns
   */
  suggestBasedOnPatterns(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of sourceFields) {
      const bestMatch = this.findBestPatternMatch(sourceField, targetFields);
      
      if (bestMatch.score > 0) {
        const transform = this.detectTransform(sourceField, bestMatch.field);
        
        suggestions.push({
          sourcePath: sourceField,
          targetPath: bestMatch.field,
          confidence: bestMatch.score,
          reason: `Pattern match: ${sourceField} → ${bestMatch.field}`,
          matchType: bestMatch.score === 100 ? 'exact' : (transform ? 'transform' : 'similar'),
          transform
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate semantic suggestions based on field meanings
   */
  generateSemanticSuggestions(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of source.fields) {
      for (const targetField of target.fields) {
        const semanticScore = this.calculateSemanticSimilarity(sourceField, targetField);
        
        if (semanticScore >= 50) {
          suggestions.push({
            sourcePath: sourceField.name,
            targetPath: targetField.name,
            confidence: semanticScore,
            reason: `Semantic match: ${sourceField.description || sourceField.name} ↔ ${targetField.description || targetField.name}`,
            matchType: semanticScore > 80 ? 'similar' : 'fuzzy'
          });
        }
      }
    }

    return this.deduplicateSuggestions(suggestions);
  }

  /**
   * Suggest type-compatible mappings
   */
  suggestTypeCompatibleMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of source.fields) {
      for (const targetField of target.fields) {
        if (sourceField.type === targetField.type) {
          const nameScore = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
          
          if (nameScore >= 60) {
            suggestions.push({
              sourcePath: sourceField.name,
              targetPath: targetField.name,
              confidence: nameScore,
              reason: `Type-compatible (${sourceField.type}): ${nameScore}% name match`,
              matchType: nameScore === 100 ? 'exact' : 'similar'
            });
          }
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate similarity based on field descriptions
   */
  calculateDescriptionSimilarity(sourceField: ConfigField, targetField: ConfigField): number {
    if (!sourceField.description || !targetField.description) {
      return this.calculator.calculateSimilarity(sourceField.name, targetField.name);
    }

    // Compare both names and descriptions
    const nameScore = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
    const descScore = this.calculator.calculateSimilarity(sourceField.description, targetField.description);
    
    // Weight description similarity higher when descriptions exist
    return Math.round(nameScore * 0.3 + descScore * 0.7);
  }

  /**
   * Calculate similarity for abbreviations and naming conventions
   */
  calculateAbbreviationSimilarity(field1: string, field2: string): number {
    // Normalize both fields
    const normalized1 = this.normalizeFieldName(field1);
    const normalized2 = this.normalizeFieldName(field2);

    // Direct comparison
    if (normalized1 === normalized2) {
      return 100;
    }

    // Check for camelCase vs snake_case vs kebab-case
    const score = this.calculator.calculateSimilarity(normalized1, normalized2);
    
    // Boost score if they're clearly the same word with different conventions
    if (this.areEquivalentNames(field1, field2)) {
      return Math.max(score, 85);
    }

    return score;
  }

  /**
   * Generate prioritized suggestions (required fields first)
   */
  generatePrioritizedSuggestions(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[] {
    const suggestions = this.suggestTypeCompatibleMappings(source, target);

    // Boost confidence for required field mappings
    const targetRequiredFields = new Set(
      target.fields.filter(f => f.required).map(f => f.name)
    );

    return suggestions.map(s => {
      if (targetRequiredFields.has(s.targetPath)) {
        return {
          ...s,
          confidence: Math.min(100, s.confidence + 10),
          reason: `${s.reason} (required field)`
        };
      }
      return s;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate suggestions with weighted scoring
   */
  suggestWithWeightedScoring(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of sourceFields) {
      for (const targetField of targetFields) {
        let score = 0;

        // Exact match gets maximum score
        if (sourceField === targetField) {
          score = 100;
        } else {
          // Calculate weighted similarity
          const baseScore = this.calculator.calculateSimilarity(sourceField, targetField);
          
          // Boost for prefix/suffix matches
          if (sourceField.startsWith(targetField) || targetField.startsWith(sourceField)) {
            score = Math.min(100, baseScore + 15);
          } else {
            score = baseScore;
          }
        }

        if (score >= 50) {
          suggestions.push({
            sourcePath: sourceField,
            targetPath: targetField,
            confidence: score,
            reason: score === 100 ? 'Exact match' : `Weighted score: ${score}%`,
            matchType: score === 100 ? 'exact' : (score > 80 ? 'similar' : 'fuzzy')
          });
        }
      }
    }

    return this.deduplicateSuggestions(suggestions);
  }

  /**
   * Score by usage frequency
   */
  scoreByUsageFrequency(analysis: MappingAnalysis, frequentlyUsedFields: string[]): MappingAnalysis {
    const boostedComparisons = analysis.comparisons.map(comp => {
      if (frequentlyUsedFields.includes(comp.sourceField)) {
        return {
          ...comp,
          confidence: Math.min(100, comp.confidence + 5)
        };
      }
      return comp;
    });

    return {
      ...analysis,
      comparisons: boostedComparisons
    };
  }

  /**
   * Calculate context similarity
   */
  calculateContextSimilarity(sourceContext: SuggestionContext, targetContext: SuggestionContext): number {
    // Compare the field names
    const fieldScore = this.calculator.calculateSimilarity(sourceContext.field, targetContext.field);

    // Compare sibling fields
    let siblingMatches = 0;
    for (const sourceSibling of sourceContext.siblings) {
      const bestMatch = this.findBestPatternMatch(sourceSibling, targetContext.siblings);
      if (bestMatch.score >= 70) {
        siblingMatches++;
      }
    }

    const siblingScore = targetContext.siblings.length > 0 
      ? (siblingMatches / targetContext.siblings.length) * 100 
      : 0;

    // Weight field similarity 60%, context similarity 40%
    return Math.round(fieldScore * 0.6 + siblingScore * 0.4);
  }

  /**
   * Suggest hierarchical mappings
   */
  suggestHierarchicalMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of source.fields) {
      for (const targetField of target.fields) {
        // Match top-level fields
        const score = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
        
        if (score >= 60) {
          suggestions.push({
            sourcePath: sourceField.name,
            targetPath: targetField.name,
            confidence: score,
            reason: `Hierarchical match: ${sourceField.name} ↔ ${targetField.name}`,
            matchType: score > 80 ? 'similar' : 'fuzzy'
          });
        }

        // Match nested fields if both have them
        if (sourceField.nested && targetField.nested) {
          const nestedSuggestions = this.suggestNestedMappings(
            sourceField.nested, 
            targetField.nested,
            sourceField.name,
            targetField.name
          );
          suggestions.push(...nestedSuggestions);
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest array mappings
   */
  suggestArrayMappings(source: ToolConfig, target: ToolConfig): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    const sourceArrays = source.fields.filter(f => f.type === 'array');
    const targetArrays = target.fields.filter(f => f.type === 'array');

    for (const sourceField of sourceArrays) {
      for (const targetField of targetArrays) {
        const score = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
        
        if (score >= 50) {
          suggestions.push({
            sourcePath: sourceField.name,
            targetPath: targetField.name,
            confidence: score,
            reason: `Array mapping: ${sourceField.name}[] → ${targetField.name}[]`,
            matchType: score > 80 ? 'similar' : 'fuzzy'
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Suggest nested path mappings
   */
  suggestNestedPathMappings(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourcePath of sourceFields) {
      // Get the last part of the path
      const sourceKey = sourcePath.split('.').pop() || sourcePath;
      
      for (const targetPath of targetFields) {
        const targetKey = targetPath.split('.').pop() || targetPath;
        
        const score = this.calculator.calculateSimilarity(sourceKey, targetKey);
        
        if (score >= 60) {
          suggestions.push({
            sourcePath,
            targetPath,
            confidence: score,
            reason: `Nested path: ${sourcePath} ↔ ${targetPath}`,
            matchType: score > 80 ? 'similar' : 'fuzzy'
          });
        }
      }
    }

    return this.deduplicateSuggestions(suggestions);
  }

  /**
   * Generate suggestions with fallbacks
   */
  suggestWithFallbacks(sourceFields: string[], targetFields: string[]): FieldMappingSuggestion[] {
    const primarySuggestions = this.suggestBasedOnPatterns(sourceFields, targetFields);
    
    // Add fallback for fields without good matches
    const matchedSourceFields = new Set(primarySuggestions.map(s => s.sourcePath));
    
    for (const sourceField of sourceFields) {
      if (!matchedSourceFields.has(sourceField)) {
        // Find any match as fallback
        const bestMatch = this.findBestPatternMatch(sourceField, targetFields);
        
        primarySuggestions.push({
          sourcePath: sourceField,
          targetPath: bestMatch.field || targetFields[0] || sourceField,
          confidence: Math.min(40, bestMatch.score),
          reason: `Fallback mapping (low confidence)`,
          matchType: 'fuzzy'
        });
      }
    }

    return primarySuggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Suggest default values for unmapped required fields
   */
  suggestDefaultValues(source: ToolConfig, target: ToolConfig): DefaultValueSuggestion[] {
    const defaults: DefaultValueSuggestion[] = [];
    const sourceFieldNames = new Set(source.fields.map(f => f.name));

    for (const targetField of target.fields) {
      if (targetField.required && !sourceFieldNames.has(targetField.name)) {
        const defaultValue = this.inferDefaultValue(targetField);
        
        defaults.push({
          field: targetField.name,
          suggestedValue: defaultValue,
          reason: `Default for unmapped required ${targetField.type} field`
        });
      }
    }

    return defaults;
  }

  /**
   * Generate multiple alternative suggestions
   */
  generateAlternatives(sourceField: string, targetFields: string[]): FieldMappingSuggestion[] {
    const alternatives: FieldMappingSuggestion[] = [];

    for (const targetField of targetFields) {
      const score = this.calculator.calculateSimilarity(sourceField, targetField);
      
      alternatives.push({
        sourcePath: sourceField,
        targetPath: targetField,
        confidence: score,
        reason: `Alternative: ${score}% match`,
        matchType: score > 80 ? 'similar' : 'fuzzy'
      });
    }

    return alternatives
      .filter(a => a.confidence >= 30)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calibrate confidence based on historical data
   */
  calibrateConfidence(historicalData: HistoricalData[]): void {
    for (const data of historicalData) {
      const current = this.calibrationData.get(data.suggestion) || 0;
      // Adjust confidence based on accuracy
      const adjustment = data.wasCorrect ? 5 : -10;
      this.calibrationData.set(data.suggestion, current + adjustment);
    }
  }

  /**
   * Calculate calibrated confidence
   */
  calculateCalibratedConfidence(source: string, target: string, baseScore: number): number {
    const key = `${source}->${target}`;
    const adjustment = this.calibrationData.get(key) || 0;
    return Math.max(0, Math.min(100, baseScore + adjustment));
  }

  /**
   * Adjust score for ambiguous mappings
   */
  adjustForAmbiguity(source: string, target: string, baseScore: number): number {
    // Reduce confidence for common/generic field names
    const ambiguousTerms = ['data', 'info', 'value', 'item', 'config'];
    const isAmbiguous = ambiguousTerms.some(term => 
      source.toLowerCase().includes(term) || target.toLowerCase().includes(term)
    );

    if (isAmbiguous && baseScore < 80) {
      return Math.max(0, baseScore - 15);
    }

    return baseScore;
  }

  // Helper methods

  private findBestPatternMatch(field: string, candidates: string[]): { field: string; score: number } {
    if (candidates.length === 0) {
      return { field: '', score: 0 };
    }

    let bestField = candidates[0];
    let bestScore = this.calculateAbbreviationSimilarity(field, candidates[0]);

    for (let i = 1; i < candidates.length; i++) {
      const score = this.calculateAbbreviationSimilarity(field, candidates[i]);
      if (score > bestScore) {
        bestScore = score;
        bestField = candidates[i];
      }
    }

    return { field: bestField, score: bestScore };
  }

  private normalizeFieldName(name: string): string {
    // Convert camelCase, snake_case, kebab-case to normalized form
    return name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[-_]+/g, '_');
  }

  private areEquivalentNames(name1: string, name2: string): boolean {
    const normalized1 = this.normalizeFieldName(name1);
    const normalized2 = this.normalizeFieldName(name2);
    return normalized1 === normalized2;
  }

  private calculateSemanticSimilarity(sourceField: ConfigField, targetField: ConfigField): number {
    // Check if field names are semantically similar
    const nameScore = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
    
    // Check descriptions if available
    let descScore = 0;
    if (sourceField.description && targetField.description) {
      descScore = this.calculateDescriptionSimilarity(sourceField, targetField);
    }

    // Use description score if available, otherwise name score
    return descScore > 0 ? descScore : nameScore;
  }

  private deduplicateSuggestions(suggestions: FieldMappingSuggestion[]): FieldMappingSuggestion[] {
    const seen = new Map<string, FieldMappingSuggestion>();
    
    for (const suggestion of suggestions) {
      const key = `${suggestion.sourcePath}->${suggestion.targetPath}`;
      const existing = seen.get(key);
      
      if (!existing || suggestion.confidence > existing.confidence) {
        seen.set(key, suggestion);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private detectTransform(source: string, target: string): FieldTransform | undefined {
    if (source === target) return undefined;

    // Check for naming convention transformation
    if (this.areEquivalentNames(source, target)) {
      return {
        type: 'rename',
        description: `Convert naming convention: ${source} → ${target}`
      };
    }

    return undefined;
  }

  private suggestNestedMappings(
    sourceFields: ConfigField[],
    targetFields: ConfigField[],
    parentSource: string,
    parentTarget: string
  ): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of sourceFields) {
      for (const targetField of targetFields) {
        const score = this.calculator.calculateSimilarity(sourceField.name, targetField.name);
        
        if (score >= 60) {
          suggestions.push({
            sourcePath: `${parentSource}.${sourceField.name}`,
            targetPath: `${parentTarget}.${targetField.name}`,
            confidence: score,
            reason: `Nested field match`,
            matchType: score > 80 ? 'similar' : 'fuzzy'
          });
        }
      }
    }

    return suggestions;
  }

  private inferDefaultValue(field: ConfigField): unknown {
    switch (field.type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }
}
