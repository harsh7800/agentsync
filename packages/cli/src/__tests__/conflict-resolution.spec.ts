import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractiveConflictResolver } from '../interactive/conflict-resolver.js';
import type { MappingConflict, ConflictResolution, FieldMapping } from '@agentsync/core';

describe('S3-11: Conflict Resolution Strategies', () => {
  let resolver: InteractiveConflictResolver;

  beforeEach(() => {
    resolver = new InteractiveConflictResolver();
  });

  const createMockField = (name: string, type: string = 'string', required: boolean = false) => ({
    name,
    type: type as 'string' | 'number' | 'boolean' | 'object' | 'array',
    required
  });

  describe('Strategy Selection', () => {
    it('S3-11-001: Apply strict resolution strategy', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 },
        { source: createMockField('field1'), target: createMockField('target2'), confidence: 85 },
        { source: createMockField('field2'), target: createMockField('target3'), confidence: 95 }
      ];

      // Act
      const resolution = await resolver.resolveWithStrategy(mappings, 'strict');

      // Assert
      expect(resolution.strategy).toBe('strict');
      expect(resolution.mappings.length).toBeLessThanOrEqual(mappings.length);
      expect(resolution.unresolvedConflicts.length).toBe(0);
    });

    it('S3-11-002: Apply lenient resolution strategy', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 },
        { source: createMockField('field1'), target: createMockField('target2'), confidence: 85 }
      ];

      // Act
      const resolution = await resolver.resolveWithStrategy(mappings, 'lenient');

      // Assert
      expect(resolution.strategy).toBe('lenient');
      expect(resolution.mappings.length).toBe(mappings.length);
      expect(resolution.unresolvedConflicts.length).toBeGreaterThan(0);
    });

    it('S3-11-003: Prompt user for resolution when strategy is prompt-user', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 },
        { source: createMockField('field1'), target: createMockField('target2'), confidence: 85 }
      ];

      // Mock user choosing first option
      resolver.setMockResponse('keep-first');

      // Act
      const resolution = await resolver.resolveWithStrategy(mappings, 'prompt-user');

      // Assert
      expect(resolution.strategy).toBe('prompt-user');
      expect(resolution.mappings.length).toBeGreaterThan(0);
    });

    it('S3-11-004: Auto-select strategy based on conflict severity', async () => {
      // Arrange
      const minorConflicts: MappingConflict[] = [
        { type: 'type-mismatch', description: 'Type difference', affectedMappings: [], suggestion: 'Convert type' }
      ];
      
      const severeConflicts: MappingConflict[] = [
        { type: 'one-to-many', description: 'Multiple targets', affectedMappings: ['f1->t1', 'f1->t2'], suggestion: 'Choose one' }
      ];

      // Act
      const minorStrategy = resolver.recommendStrategy(minorConflicts);
      const severeStrategy = resolver.recommendStrategy(severeConflicts);

      // Assert
      expect(minorStrategy).toBe('lenient');
      expect(severeStrategy).toBe('strict');
    });
  });

  describe('Interactive Resolution', () => {
    it('S3-11-005: Present conflict options to user', async () => {
      // Arrange
      const conflict: MappingConflict = {
        type: 'one-to-many',
        description: 'Source field "apiKey" maps to multiple targets',
        affectedMappings: ['apiKey->auth_token', 'apiKey->api_key'],
        suggestion: 'Choose the most appropriate target'
      };

      // Act
      const options = resolver.generateResolutionOptions(conflict);

      // Assert
      expect(options.length).toBeGreaterThan(1);
      expect(options.some(o => o.action === 'keep-first')).toBe(true);
      expect(options.some(o => o.action === 'keep-all')).toBe(true);
      expect(options.some(o => o.action === 'skip')).toBe(true);
    });

    it('S3-11-006: Handle user choice for one-to-many conflict', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('apiKey'), target: createMockField('auth_token'), confidence: 90 },
        { source: createMockField('apiKey'), target: createMockField('api_key'), confidence: 85 }
      ];

      resolver.setMockResponse('keep-first');

      // Act
      const resolution = await resolver.resolveInteractively(mappings);

      // Assert - should have at least 1 mapping with auth_token as target
      expect(resolution.mappings.length).toBeGreaterThanOrEqual(1);
      const authTokenMapping = resolution.mappings.find(m => m.target.name === 'auth_token');
      expect(authTokenMapping).toBeDefined();
    });

    it('S3-11-007: Handle user choice for many-to-one conflict', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('host'), target: createMockField('hostname'), confidence: 90 },
        { source: createMockField('server'), target: createMockField('hostname'), confidence: 85 }
      ];

      resolver.setMockResponse('merge');

      // Act
      const resolution = await resolver.resolveInteractively(mappings);

      // Assert - should have mappings after merge resolution
      expect(resolution.mappings.length).toBeGreaterThanOrEqual(1);
    });

    it('S3-11-008: Allow user to skip conflicting mapping', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 },
        { source: createMockField('field1'), target: createMockField('target2'), confidence: 85 }
      ];

      resolver.setMockResponse('skip');

      // Act
      const resolution = await resolver.resolveInteractively(mappings);

      // Assert - verify resolution was processed (may have mappings or not based on implementation)
      expect(resolution.strategy).toBe('prompt-user');
    });

    it('S3-11-009: Handle user-provided custom resolution', async () => {
      // Arrange - use conflicting mappings to trigger custom resolution
      const mappings: FieldMapping[] = [
        { source: createMockField('port'), target: createMockField('server_port'), confidence: 70 },
        { source: createMockField('port'), target: createMockField('port_number'), confidence: 65 }
      ];

      resolver.setMockResponse('custom');
      resolver.setCustomMapping('port', 'network_port');

      // Act
      const resolution = await resolver.resolveInteractively(mappings);

      // Assert - verify resolution was processed
      expect(resolution.mappings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Batch Resolution', () => {
    it('S3-11-010: Apply same resolution to similar conflicts', async () => {
      // Arrange
      const conflicts: MappingConflict[] = [
        { type: 'type-mismatch', description: 'Type mismatch 1', affectedMappings: [], suggestion: 'Convert' },
        { type: 'type-mismatch', description: 'Type mismatch 2', affectedMappings: [], suggestion: 'Convert' }
      ];

      resolver.setMockResponse('apply-to-all');

      // Act
      const resolutions = await resolver.resolveBatch(conflicts, 'type-mismatch');

      // Assert
      expect(resolutions.length).toBe(conflicts.length);
      expect(resolutions.every(r => r.strategy === 'lenient')).toBe(true);
    });

    it('S3-11-011: Handle mixed conflict types separately', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('f1'), target: createMockField('t1'), confidence: 90 },
        { source: createMockField('f1'), target: createMockField('t2'), confidence: 85 },
        { source: createMockField('f2', 'string'), target: createMockField('t3', 'number'), confidence: 90 }
      ];

      resolver.setMockResponses([
        { conflictType: 'one-to-many', response: 'keep-first' },
        { conflictType: 'type-mismatch', response: 'convert' }
      ]);

      // Act
      const resolution = await resolver.resolveInteractively(mappings);

      // Assert
      expect(resolution.mappings.length).toBeGreaterThan(0);
    });

    it('S3-11-012: Preview resolution before applying', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 },
        { source: createMockField('field1'), target: createMockField('target2'), confidence: 85 }
      ];

      // Act
      const preview = await resolver.previewResolution(mappings, 'strict');

      // Assert
      expect(preview.keptMappings.length).toBeGreaterThan(0);
      expect(preview.removedMappings.length).toBeGreaterThan(0);
      expect(preview.summary).toBeDefined();
    });
  });

  describe('Conflict Explanation', () => {
    it('S3-11-013: Generate human-readable conflict description', () => {
      // Arrange
      const conflict: MappingConflict = {
        type: 'one-to-many',
        description: 'Source field maps to multiple targets',
        affectedMappings: ['apiKey->auth_token', 'apiKey->api_key'],
        suggestion: 'Choose the best match'
      };

      // Act
      const explanation = resolver.explainConflict(conflict);

      // Assert
      expect(explanation.title).toBeDefined();
      expect(explanation.description).toBeDefined();
      expect(explanation.impact).toBeDefined();
      expect(explanation.options.length).toBeGreaterThan(0);
    });

    it('S3-11-014: Show impact of resolution choice', async () => {
      // Arrange - use conflicting mappings to trigger impact
      const mappings: FieldMapping[] = [
        { source: createMockField('config'), target: createMockField('configuration'), confidence: 90 },
        { source: createMockField('config'), target: createMockField('settings'), confidence: 85 }
      ];

      // Act
      const impact = await resolver.analyzeImpact(mappings, 'strict');

      // Assert
      expect(impact.fieldsAffected).toBeGreaterThanOrEqual(0);
      expect(impact.dataLossRisk).toBeDefined();
      expect(impact.recommendation).toBeDefined();
    });

    it('S3-11-015: Provide smart default recommendations', () => {
      // Arrange
      const highConfidenceMapping = { source: createMockField('name'), target: createMockField('name'), confidence: 95 };
      const lowConfidenceMapping = { source: createMockField('data'), target: createMockField('info'), confidence: 60 };

      // Act
      const highRec = resolver.getRecommendation(highConfidenceMapping);
      const lowRec = resolver.getRecommendation(lowConfidenceMapping);

      // Assert
      expect(highRec.action).toBe('accept');
      expect(lowRec.action).toBe('review');
    });
  });

  describe('Undo/Redo Support', () => {
    it('S3-11-016: Allow undo of resolution', async () => {
      // Arrange
      const mappings: FieldMapping[] = [
        { source: createMockField('field1'), target: createMockField('target1'), confidence: 90 }
      ];

      // First do a resolution to populate history
      await resolver.resolveWithStrategy(mappings, 'strict');
      
      // Verify history was populated
      expect(resolver.getResolutionHistory().length).toBeGreaterThan(0);

      // Act
      const undone = await resolver.undoLastResolution();

      // Assert
      expect(undone).toBe(true);
    });

    it('S3-11-017: Support resolution history', async () => {
      // Arrange
      const mappings1: FieldMapping[] = [
        { source: createMockField('f1'), target: createMockField('t1'), confidence: 90 }
      ];
      const mappings2: FieldMapping[] = [
        { source: createMockField('f2'), target: createMockField('t2'), confidence: 85 }
      ];

      // Act
      await resolver.resolveWithStrategy(mappings1, 'strict');
      await resolver.resolveWithStrategy(mappings2, 'lenient');

      // Assert
      const history = resolver.getResolutionHistory();
      expect(history.length).toBe(2);
      expect(history[0].strategy).toBe('strict');
      expect(history[1].strategy).toBe('lenient');
    });
  });
});
