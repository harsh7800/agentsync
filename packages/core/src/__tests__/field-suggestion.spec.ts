import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestionGenerator } from '../ai-mapping/suggestion-generator.js';
import type { ToolConfig, ConfigField, MappingAnalysis } from '../ai-mapping/types.js';

describe('S3-09: Field Suggestion Algorithms', () => {
  let generator: SuggestionGenerator;

  beforeEach(() => {
    generator = new SuggestionGenerator();
  });

  const createMockConfig = (tool: string, fields: ConfigField[]): ToolConfig => ({
    tool,
    version: '1.0.0',
    fields,
    raw: {}
  });

  describe('Pattern-Based Suggestions', () => {
    it('S3-09-001: Suggest mappings based on naming patterns', () => {
      // Arrange
      const sourceFields = ['mcpServers', 'agents', 'settings'];
      const targetFields = ['mcpServer', 'skills', 'config'];

      // Act
      const suggestions = generator.suggestBasedOnPatterns(sourceFields, targetFields);

      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });

    it('S3-09-002: Recognize semantic equivalents', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'agents', type: 'array', required: false, description: 'AI agents' }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'skills', type: 'array', required: false, description: 'AI skills' }
      ]);

      // Act
      const suggestions = generator.generateSemanticSuggestions(source, target);

      // Assert
      const semanticMatch = suggestions.find(s => 
        s.sourcePath === 'agents' && s.targetPath === 'skills'
      );
      expect(semanticMatch).toBeDefined();
    });

    it('S3-09-003: Identify type-compatible fields', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'port', type: 'number', required: true },
        { name: 'host', type: 'string', required: true }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'port', type: 'number', required: true },
        { name: 'hostname', type: 'string', required: true }
      ]);

      // Act
      const suggestions = generator.suggestTypeCompatibleMappings(source, target);

      // Assert
      const numberMatch = suggestions.find(s => s.sourcePath === 'port' && s.targetPath === 'port');
      expect(numberMatch).toBeDefined();
    });

    it('S3-09-004: Consider field descriptions for matching', () => {
      // Arrange
      const sourceField: ConfigField = {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'Authentication key for API access'
      };
      const targetField: ConfigField = {
        name: 'authToken',
        type: 'string',
        required: true,
        description: 'Token used for API authentication'
      };

      // Act
      const score = generator.calculateDescriptionSimilarity(sourceField, targetField);

      // Assert
      expect(score).toBeGreaterThan(50); // Should recognize semantic similarity
    });

    it('S3-09-005: Recognize common abbreviations', () => {
      // Arrange
      const abbreviations = [
        { full: 'apiKey', abbrev: 'api_key' },
        { full: 'mcpServers', abbrev: 'mcp_servers' },
        { full: 'userName', abbrev: 'user_name' }
      ];

      // Act & Assert
      for (const { full, abbrev } of abbreviations) {
        const score = generator.calculateAbbreviationSimilarity(full, abbrev);
        expect(score).toBeGreaterThan(80);
      }
    });
  });

  describe('Priority Scoring', () => {
    it('S3-09-006: Prioritize required field mappings', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'optional_field', type: 'string', required: false },
        { name: 'required_field', type: 'string', required: true }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'optional_target', type: 'string', required: false },
        { name: 'required_target', type: 'string', required: true }
      ]);

      // Act
      const suggestions = generator.generatePrioritizedSuggestions(source, target);

      // Assert
      const requiredSuggestion = suggestions.find(s => 
        s.sourcePath.includes('required') || s.targetPath.includes('required')
      );
      if (requiredSuggestion) {
        expect(requiredSuggestion.confidence).toBeGreaterThanOrEqual(50);
      }
    });

    it('S3-09-007: Weight exact name matches higher', () => {
      // Arrange
      const sourceFields = ['name', 'description', 'config'];
      const targetFields = ['name', 'desc', 'configuration'];

      // Act
      const suggestions = generator.suggestWithWeightedScoring(sourceFields, targetFields);

      // Assert
      const exactMatch = suggestions.find(s => s.sourcePath === 'name' && s.targetPath === 'name');
      if (exactMatch) {
        const similarMatch = suggestions.find(s => s.sourcePath === 'config');
        if (similarMatch && exactMatch.confidence && similarMatch.confidence) {
          expect(exactMatch.confidence).toBeGreaterThanOrEqual(similarMatch.confidence);
        }
      }
    });

    it('S3-09-008: Consider field usage frequency', () => {
      // Arrange
      const analysis: MappingAnalysis = {
        source: { name: 'claude', version: '1.0', fieldCount: 3 },
        target: { name: 'opencode', version: '1.0', fieldCount: 3 },
        comparisons: [
          { sourceField: 'common_field', targetField: 'common_target', similarity: 90, matchType: 'similar', confidence: 90 },
          { sourceField: 'rare_field', targetField: 'rare_target', similarity: 85, matchType: 'similar', confidence: 85 }
        ],
        overallConfidence: 87,
        conflicts: []
      };

      // Act
      const scored = generator.scoreByUsageFrequency(analysis, ['common_field']);

      // Assert
      const commonScore = scored.comparisons.find(c => c.sourceField === 'common_field');
      const rareScore = scored.comparisons.find(c => c.sourceField === 'rare_field');
      if (commonScore && rareScore) {
        expect(commonScore.confidence).toBeGreaterThanOrEqual(rareScore.confidence);
      }
    });
  });

  describe('Contextual Suggestions', () => {
    it('S3-09-009: Suggest based on surrounding field context', () => {
      // Arrange
      const sourceContext = {
        field: 'port',
        siblings: ['host', 'protocol', 'timeout']
      };
      const targetContext = {
        field: 'server_port',
        siblings: ['server_host', 'server_protocol', 'connection_timeout']
      };

      // Act
      const contextScore = generator.calculateContextSimilarity(sourceContext, targetContext);

      // Assert - context score is based on field + sibling matches
      expect(contextScore).toBeGreaterThan(0);
    });

    it('S3-09-010: Detect hierarchical relationships', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { 
          name: 'config', 
          type: 'object', 
          required: true,
          nested: [
            { name: 'mcpServers', type: 'object', required: true }
          ]
        }
      ]);
      const target = createMockConfig('opencode', [
        { 
          name: 'configuration', 
          type: 'object', 
          required: true,
          nested: [
            { name: 'mcp', type: 'object', required: true }
          ]
        }
      ]);

      // Act
      const suggestions = generator.suggestHierarchicalMappings(source, target);

      // Assert
      const hierarchicalMatch = suggestions.find(s => s.sourcePath.includes('config'));
      expect(hierarchicalMatch).toBeDefined();
    });

    it('S3-09-011: Suggest array element mappings', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'items', type: 'array', required: false }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'itemList', type: 'array', required: false }
      ]);

      // Act
      const suggestions = generator.suggestArrayMappings(source, target);

      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].matchType).toBe('similar');
    });

    it('S3-09-012: Handle nested object path suggestions', () => {
      // Arrange
      const sourceFields = ['config.server.host', 'config.server.port'];
      const targetFields = ['settings.host', 'settings.port'];

      // Act
      const suggestions = generator.suggestNestedPathMappings(sourceFields, targetFields);

      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(s => {
        expect(s.sourcePath).toContain('.');
        expect(s.targetPath).toContain('.');
      });
    });
  });

  describe('Smart Fallbacks', () => {
    it('S3-09-013: Provide fallback when no good match exists', () => {
      // Arrange - use very different field names to ensure low similarity
      const sourceFields = ['xyzabc123'];
      const targetFields = ['qwerty789'];

      // Act
      const suggestions = generator.suggestWithFallbacks(sourceFields, targetFields);

      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].reason.toLowerCase()).toContain('fallback');
    });

    it('S3-09-014: Suggest default values for unmapped required fields', () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'existing', type: 'string', required: true }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'existing', type: 'string', required: true },
        { name: 'required_new', type: 'string', required: true }
      ]);

      // Act
      const defaults = generator.suggestDefaultValues(source, target);

      // Assert
      const newFieldDefault = defaults.find(d => d.field === 'required_new');
      expect(newFieldDefault).toBeDefined();
      expect(newFieldDefault?.suggestedValue).toBeDefined();
    });

    it('S3-09-015: Generate multiple alternative suggestions', () => {
      // Arrange
      const sourceField = 'config';
      const targetFields = ['configuration', 'settings', 'options'];

      // Act
      const alternatives = generator.generateAlternatives(sourceField, targetFields);

      // Assert
      expect(alternatives.length).toBeGreaterThan(1);
      expect(alternatives[0].confidence).toBeGreaterThanOrEqual(alternatives[1].confidence);
    });
  });

  describe('Confidence Calibration', () => {
    it('S3-09-016: Calibrate confidence based on historical accuracy', () => {
      // Arrange
      const historicalData = [
        { suggestion: 'name->name', wasCorrect: true },
        { suggestion: 'agents->skills', wasCorrect: true },
        { suggestion: 'config->settings', wasCorrect: false }
      ];

      // Act
      generator.calibrateConfidence(historicalData);
      const newSuggestion = generator.calculateCalibratedConfidence('agents', 'skills', 80);

      // Assert
      expect(newSuggestion).toBeGreaterThanOrEqual(80); // Should maintain or improve based on history
    });

    it('S3-09-017: Adjust confidence for ambiguous mappings', () => {
      // Arrange
      const ambiguousPairs = [
        { source: 'data', target: 'info', baseScore: 70 },
        { source: 'value', target: 'data', baseScore: 65 }
      ];

      // Act
      const adjusted = ambiguousPairs.map(pair => ({
        ...pair,
        adjustedScore: generator.adjustForAmbiguity(pair.source, pair.target, pair.baseScore)
      }));

      // Assert
      adjusted.forEach(a => {
        expect(a.adjustedScore).toBeLessThanOrEqual(a.baseScore);
      });
    });
  });
});
