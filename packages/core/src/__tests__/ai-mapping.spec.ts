import { describe, it, expect, beforeEach } from 'vitest';
import { MappingEngine } from '../ai-mapping/mapping-engine.js';
import { FieldMatcher } from '../ai-mapping/field-matcher.js';
import { SimilarityCalculator } from '../ai-mapping/similarity-calculator.js';
import { ConflictResolver } from '../ai-mapping/conflict-resolver.js';
import type { ToolConfig, ConfigField, MappingEngineOptions } from '../ai-mapping/types.js';

describe('S3-07: AI Mapping Engine Core Logic', () => {
  let engine: MappingEngine;
  let matcher: FieldMatcher;
  let calculator: SimilarityCalculator;
  let resolver: ConflictResolver;

  beforeEach(() => {
    engine = new MappingEngine();
    matcher = new FieldMatcher();
    calculator = new SimilarityCalculator();
    resolver = new ConflictResolver();
  });

  describe('Similarity Calculator', () => {
    it('S3-07-001: Exact string matches return 100', () => {
      // Act
      const score = calculator.calculateSimilarity('mcpServers', 'mcpServers');

      // Assert
      expect(score).toBe(100);
    });

    it('S3-07-002: Similar strings with typos score above threshold', () => {
      // Act
      const score = calculator.calculateSimilarity('mcpServers', 'mcpServer');

      // Assert
      expect(score).toBeGreaterThan(80);
    });

    it('S3-07-003: Different strings score appropriately', () => {
      // Act
      const score = calculator.calculateSimilarity('agents', 'skills');

      // Assert
      expect(score).toBeLessThan(50);
    });

    it('S3-07-004: Levenshtein distance calculation', () => {
      // Act
      const distance = calculator.levenshteinDistance('kitten', 'sitting');

      // Assert
      expect(distance).toBe(3);
    });

    it('S3-07-005: Jaro-Winkler similarity for close matches', () => {
      // Act
      const similarity = calculator.jaroWinklerSimilarity('mcpServers', 'mcpServer');

      // Assert
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('S3-07-006: Combined similarity with weighted algorithms', () => {
      // Arrange
      const weightedCalc = new SimilarityCalculator({ stringWeight: 0.7, semanticWeight: 0.3 });

      // Act
      const score = weightedCalc.combinedSimilarity('mcpServers', 'mcpServer');

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Field Matcher', () => {
    it('S3-07-007: Match fields with exact names', () => {
      // Arrange
      const sourceFields = ['name', 'description'];
      const targetFields = ['name', 'description'];

      // Act
      const matches = matcher.matchFields(sourceFields, targetFields);

      // Assert
      expect(matches).toHaveLength(2);
      expect(matches[0].score).toBe(100);
      expect(matches[1].score).toBe(100);
    });

    it('S3-07-008: Match fields with similar names', () => {
      // Arrange
      const sourceFields = ['mcpServers'];
      const targetFields = ['mcpServer'];

      // Act
      const matches = matcher.matchFields(sourceFields, targetFields);

      // Assert
      expect(matches).toHaveLength(1);
      expect(matches[0].score).toBeGreaterThan(80);
    });

    it('S3-07-009: Handle nested field paths', () => {
      // Arrange
      const sourceFields = ['config.mcpServers.name'];
      const targetFields = ['config.mcpServer.name'];

      // Act
      const matches = matcher.matchFields(sourceFields, targetFields);

      // Assert
      expect(matches).toHaveLength(1);
      expect(matches[0].sourceField).toBe('config.mcpServers.name');
      expect(matches[0].targetField).toBe('config.mcpServer.name');
    });

    it('S3-07-010: Find best match from candidates', () => {
      // Arrange
      const field = 'agents';
      const candidates = ['skills', 'agents', 'tools'];

      // Act
      const bestMatch = matcher.findBestMatch(field, candidates);

      // Assert
      expect(bestMatch.field).toBe('agents');
      expect(bestMatch.score).toBe(100);
    });

    it('S3-07-011: Respect similarity threshold', () => {
      // Arrange
      const matcherWithThreshold = new FieldMatcher({ similarityThreshold: 70 });
      const sourceFields = ['test'];
      const targetFields = ['tst', 'different'];

      // Act
      const matches = matcherWithThreshold.matchFields(sourceFields, targetFields);

      // Assert
      expect(matches.every(m => m.score >= 70)).toBe(true);
    });

    it('S3-07-012: Handle empty field lists', () => {
      // Act
      const matches1 = matcher.matchFields([], ['field']);
      const matches2 = matcher.matchFields(['field'], []);

      // Assert
      expect(matches1).toHaveLength(0);
      expect(matches2).toHaveLength(0);
    });
  });

  describe('Mapping Engine', () => {
    const createMockConfig = (tool: string, fields: ConfigField[]): ToolConfig => ({
      tool,
      version: '1.0.0',
      fields,
      raw: {}
    });

    it('S3-07-013: Analyze simple flat configurations', async () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string', required: false }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string', required: false }
      ]);

      // Act
      const analysis = await engine.analyze(source, target);

      // Assert - cross-product gives 4 comparisons (2 source × 2 target)
      expect(analysis.comparisons.length).toBeGreaterThan(0);
      expect(analysis.overallConfidence).toBeGreaterThan(0);
    });

    it('S3-07-014: Analyze nested configurations', async () => {
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
          name: 'config', 
          type: 'object', 
          required: true,
          nested: [
            { name: 'mcpServer', type: 'object', required: true }
          ]
        }
      ]);

      // Act
      const analysis = await engine.analyze(source, target);

      // Assert
      expect(analysis.comparisons.length).toBeGreaterThan(0);
      expect(analysis.source.fieldCount).toBe(1);
    });

    it('S3-07-015: Handle empty configurations', async () => {
      // Arrange
      const source = createMockConfig('claude', []);
      const target = createMockConfig('opencode', []);

      // Act
      const analysis = await engine.analyze(source, target);

      // Assert
      expect(analysis.comparisons).toHaveLength(0);
      expect(analysis.overallConfidence).toBe(0);
    });

    it('S3-07-016: Calculate overall confidence score', async () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string', required: false }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'name', type: 'string', required: true },
        { name: 'desc', type: 'string', required: false }
      ]);

      // Act
      const analysis = await engine.analyze(source, target);

      // Assert
      expect(analysis.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(analysis.overallConfidence).toBeLessThanOrEqual(100);
    });

    it('S3-07-017: Generate mapping suggestions with confidence', async () => {
      // Arrange
      const source = createMockConfig('claude', [
        { name: 'mcpServers', type: 'object', required: true }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'mcpServer', type: 'object', required: true }
      ]);

      // Act
      const analysis = await engine.analyze(source, target);
      const suggestions = engine.suggestMappings(analysis);

      // Assert
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeLessThanOrEqual(100);
    });

    it('S3-07-018: Include transformation recommendations', async () => {
      // Arrange - use fields with high similarity (>80%) but different names
      const source = createMockConfig('claude', [
        { name: 'mcpServers', type: 'object', required: false }
      ]);
      const target = createMockConfig('opencode', [
        { name: 'mcpServer', type: 'object', required: false }
      ]);

      // Act
      const analysis = await engine.analyze(source, target);
      const suggestions = engine.suggestMappings(analysis);

      // Assert
      const transformSuggestion = suggestions.find(s => s.transform);
      expect(transformSuggestion).toBeDefined();
      expect(transformSuggestion?.transform?.type).toBe('rename');
    });

    it('S3-07-019: Engine configuration options', () => {
      // Arrange
      const options: MappingEngineOptions = {
        similarityThreshold: 75,
        stringWeight: 0.8,
        semanticWeight: 0.2
      };

      // Act
      const configuredEngine = new MappingEngine(options);

      // Assert
      expect(configuredEngine).toBeDefined();
    });
  });

  describe('Conflict Resolver', () => {
    const createMockField = (name: string, type: string): ConfigField => ({
      name,
      type: type as 'string' | 'number' | 'boolean' | 'object' | 'array',
      required: false
    });

    it('S3-07-020: Detect one-to-many mapping conflicts', () => {
      // Arrange
      const mappings = [
        { source: createMockField('field1', 'string'), target: createMockField('target1', 'string'), confidence: 90 },
        { source: createMockField('field1', 'string'), target: createMockField('target2', 'string'), confidence: 85 }
      ];

      // Act
      const conflicts = resolver.detectConflicts(mappings);

      // Assert
      expect(conflicts.some(c => c.type === 'one-to-many')).toBe(true);
    });

    it('S3-07-021: Detect many-to-one mapping conflicts', () => {
      // Arrange
      const mappings = [
        { source: createMockField('field1', 'string'), target: createMockField('target1', 'string'), confidence: 90 },
        { source: createMockField('field2', 'string'), target: createMockField('target1', 'string'), confidence: 85 }
      ];

      // Act
      const conflicts = resolver.detectConflicts(mappings);

      // Assert
      expect(conflicts.some(c => c.type === 'many-to-one')).toBe(true);
    });

    it('S3-07-022: Detect type mismatch conflicts', () => {
      // Arrange
      const mappings = [
        { source: createMockField('field1', 'string'), target: createMockField('target1', 'number'), confidence: 90 }
      ];

      // Act
      const conflicts = resolver.detectConflicts(mappings);

      // Assert
      expect(conflicts.some(c => c.type === 'type-mismatch')).toBe(true);
    });

    it('S3-07-023: Detect missing required fields', () => {
      // Arrange
      const targetFields = [
        createMockField('requiredField', 'string')
      ];
      targetFields[0].required = true;

      const mappings = [
        { source: createMockField('otherField', 'string'), target: createMockField('otherTarget', 'string'), confidence: 90 }
      ];

      // Act
      const conflicts = resolver.detectConflicts(mappings, targetFields);

      // Assert
      expect(conflicts.some(c => c.type === 'required-missing')).toBe(true);
    });

    it('S3-07-024: Resolve conflicts with strict strategy', () => {
      // Arrange
      const mappings = [
        { source: createMockField('field1', 'string'), target: createMockField('target1', 'string'), confidence: 90 },
        { source: createMockField('field1', 'string'), target: createMockField('target2', 'string'), confidence: 85 }
      ];

      // Act
      const resolution = resolver.resolveConflicts(mappings, 'strict');

      // Assert
      expect(resolution.strategy).toBe('strict');
      expect(resolution.mappings.length).toBeLessThan(mappings.length);
    });

    it('S3-07-025: Provide resolution suggestions', () => {
      // Arrange
      const mappings = [
        { source: createMockField('field1', 'string'), target: createMockField('target1', 'string'), confidence: 90 },
        { source: createMockField('field2', 'string'), target: createMockField('target1', 'string'), confidence: 85 }
      ];

      // Act - use 'prompt-user' strategy to keep conflicts for manual review
      const resolution = resolver.resolveConflicts(mappings, 'prompt-user');

      // Assert
      expect(resolution.unresolvedConflicts.length).toBeGreaterThan(0);
      expect(resolution.unresolvedConflicts[0].suggestion).toBeDefined();
    });
  });
});
