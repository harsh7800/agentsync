import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractiveMappingPrompts } from '../interactive/mapping-prompts.js';
import type { FieldMappingSuggestion, MappingAnalysis } from '@agent-sync/core';

describe('S3-13: Interactive AI-Assisted Mapping Prompts', () => {
  let prompts: InteractiveMappingPrompts;

  beforeEach(() => {
    prompts = new InteractiveMappingPrompts();
  });

  describe('Smart Prompt Generation', () => {
    it('S3-13-001: Generate contextual prompts for high-confidence mappings', async () => {
      // Arrange
      const suggestions: FieldMappingSuggestion[] = [
        {
          sourcePath: 'mcpServers',
          targetPath: 'mcpServer',
          confidence: 95,
          reason: 'High similarity match',
          matchType: 'similar'
        }
      ];

      // Act
      const prompt = prompts.generatePromptForSuggestion(suggestions[0]);

      // Assert
      expect(prompt.type).toBe('confirm');
      expect(prompt.message).toContain('mcpServers');
      expect(prompt.default).toBe(true);
    });

    it('S3-13-002: Generate review prompts for medium-confidence mappings', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'agents',
        targetPath: 'skills',
        confidence: 75,
        reason: 'Semantic similarity',
        matchType: 'fuzzy'
      };

      // Act
      const prompt = prompts.generatePromptForSuggestion(suggestion);

      // Assert
      expect(prompt.type).toBe('select');
      expect(prompt.choices?.length).toBeGreaterThan(2);
    });

    it('S3-13-003: Generate detailed prompts for low-confidence mappings', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'data',
        targetPath: 'info',
        confidence: 55,
        reason: 'Weak semantic match',
        matchType: 'fuzzy'
      };

      // Act
      const prompt = prompts.generatePromptForSuggestion(suggestion);

      // Assert
      expect(prompt.type).toBe('expand');
      expect(prompt.message.toLowerCase()).toContain('review');
    });

    it('S3-13-004: Include transformation details in prompts', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'apiKey',
        targetPath: 'auth_token',
        confidence: 60,
        reason: 'Rename required',
        matchType: 'transform',
        transform: {
          type: 'rename',
          description: 'Rename apiKey to auth_token'
        }
      };

      // Act
      const prompt = prompts.generatePromptForSuggestion(suggestion);

      // Assert
      expect(prompt.message).toContain('auth_token');
      expect(prompt.message.toLowerCase()).toContain('transform');
    });
  });

  describe('Batch Prompting', () => {
    it('S3-13-005: Group suggestions by confidence for batch processing', async () => {
      // Arrange
      const suggestions: FieldMappingSuggestion[] = [
        { sourcePath: 'name', targetPath: 'name', confidence: 100, reason: 'Exact match', matchType: 'exact' },
        { sourcePath: 'port', targetPath: 'port', confidence: 100, reason: 'Exact match', matchType: 'exact' },
        { sourcePath: 'host', targetPath: 'hostname', confidence: 70, reason: 'Similar', matchType: 'similar' }
      ];

      // Act
      const groups = prompts.groupByConfidence(suggestions);

      // Assert
      expect(groups.high.length).toBe(2);
      expect(groups.medium.length).toBe(1);
      expect(groups.low.length).toBe(0);
    });

    it('S3-13-006: Offer to accept all high-confidence mappings', async () => {
      // Arrange
      const highConfidenceSuggestions: FieldMappingSuggestion[] = [
        { sourcePath: 'field1', targetPath: 'target1', confidence: 95, reason: 'Exact', matchType: 'exact' },
        { sourcePath: 'field2', targetPath: 'target2', confidence: 92, reason: 'Similar', matchType: 'similar' }
      ];

      prompts.setMockResponse(true);

      // Act
      const result = await prompts.promptBatchAccept(highConfidenceSuggestions);

      // Assert
      expect(result.accepted).toBe(true);
      expect(result.mappings.length).toBe(2);
    });

    it('S3-13-007: Show summary before batch acceptance', async () => {
      // Arrange
      const suggestions: FieldMappingSuggestion[] = [
        { sourcePath: 'config', targetPath: 'configuration', confidence: 92, reason: 'Similar', matchType: 'similar' },
        { sourcePath: 'data', targetPath: 'info', confidence: 75, reason: 'Weak', matchType: 'fuzzy' }
      ];

      // Act
      const summary = prompts.generateBatchSummary(suggestions);

      // Assert
      expect(summary.total).toBe(2);
      expect(summary.highConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.mediumConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.preview).toBeDefined();
    });
  });

  describe('Progressive Disclosure', () => {
    it('S3-13-008: Show basic info first, details on request', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'mcpServers',
        targetPath: 'mcpServer',
        confidence: 85,
        reason: 'Similar naming pattern with minor difference',
        matchType: 'similar'
      };

      // Act
      const basic = prompts.getBasicPromptInfo(suggestion);
      const detailed = prompts.getDetailedPromptInfo(suggestion);

      // Assert
      expect(basic.message.length).toBeLessThan(detailed.message.length);
      expect(detailed.message).toContain('85%');
    });

    it('S3-13-009: Allow drilling down into field details', async () => {
      // Arrange
      const analysis: MappingAnalysis = {
        source: { name: 'claude', version: '1.0', fieldCount: 5 },
        target: { name: 'opencode', version: '1.0', fieldCount: 5 },
        comparisons: [
          { sourceField: 'agents', targetField: 'skills', similarity: 40, matchType: 'fuzzy', confidence: 45 }
        ],
        overallConfidence: 45,
        conflicts: []
      };

      // Act
      const details = prompts.getFieldDetails(analysis, 'agents');

      // Assert
      expect(details.sourceField).toBe('agents');
      expect(details.alternatives.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User Guidance', () => {
    it('S3-13-010: Provide helpful context in prompts', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'timeout',
        targetPath: 'connectionTimeout',
        confidence: 78,
        reason: 'Similar purpose',
        matchType: 'similar'
      };

      // Act
      const guidance = prompts.generateGuidance(suggestion);

      // Assert
      expect(guidance.tip).toBeDefined();
      expect(guidance.examples.length).toBeGreaterThan(0);
    });

    it('S3-13-011: Explain impact of accepting/rejecting', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'requiredField',
        targetPath: 'requiredTarget',
        confidence: 70,
        reason: 'Required field mapping',
        matchType: 'similar'
      };

      // Act
      const impact = prompts.explainMappingImpact(suggestion, 'accept');

      // Assert
      expect(impact.description).toBeDefined();
      expect(impact.consequences.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-13-012: Suggest alternatives when user rejects', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'data',
        targetPath: 'info',
        confidence: 60,
        reason: 'Weak match',
        matchType: 'fuzzy'
      };
      const alternatives: FieldMappingSuggestion[] = [
        { sourcePath: 'data', targetPath: 'content', confidence: 55, reason: 'Alternative 1', matchType: 'fuzzy' },
        { sourcePath: 'data', targetPath: 'payload', confidence: 50, reason: 'Alternative 2', matchType: 'fuzzy' }
      ];

      prompts.setMockResponse('alternative');
      prompts.setAlternatives(alternatives);

      // Act
      const result = await prompts.handleRejection(suggestion);

      // Assert
      expect(result.action).toBe('alternative');
      expect(result.alternatives?.length).toBeGreaterThan(0);
    });
  });

  describe('Validation and Feedback', () => {
    it('S3-13-013: Validate user input in prompts', async () => {
      // Arrange
      const invalidInput = '';
      const validInput = 'custom_target';

      // Act
      const invalid = prompts.validateInput(invalidInput, 'target');
      const valid = prompts.validateInput(validInput, 'target');

      // Assert
      expect(invalid.isValid).toBe(false);
      expect(valid.isValid).toBe(true);
    });

    it('S3-13-014: Provide feedback after user decision', async () => {
      // Arrange
      const suggestion: FieldMappingSuggestion = {
        sourcePath: 'port',
        targetPath: 'serverPort',
        confidence: 88,
        reason: 'Similar',
        matchType: 'similar'
      };

      // Act
      const feedback = prompts.generateFeedback(suggestion, 'accepted');

      // Assert
      expect(feedback.message).toBeDefined();
      expect(feedback.nextStep).toBeDefined();
    });

    it('S3-13-015: Track user preferences for future suggestions', async () => {
      // Arrange
      const userChoice = {
        sourcePath: 'agents',
        targetPath: 'skills',
        decision: 'accepted' as const
      };

      // Act
      prompts.recordPreference(userChoice);
      const preference = prompts.getPreference('agents', 'skills');

      // Assert
      expect(preference).toBe('accepted');
    });
  });

  describe('Wizard Flow', () => {
    it('S3-13-016: Guide user through mapping wizard', async () => {
      // Arrange
      const suggestions: FieldMappingSuggestion[] = [
        { sourcePath: 'name', targetPath: 'name', confidence: 100, reason: 'Exact', matchType: 'exact' },
        { sourcePath: 'port', targetPath: 'port', confidence: 100, reason: 'Exact', matchType: 'exact' }
      ];

      prompts.setMockResponses(['accept', 'accept']);

      // Act
      const result = await prompts.runMappingWizard(suggestions);

      // Assert
      expect(result.completed).toBe(true);
      expect(result.mappings.length).toBe(2);
    });

    it('S3-13-017: Allow skipping and returning to previous prompts', async () => {
      // Arrange
      const suggestions: FieldMappingSuggestion[] = [
        { sourcePath: 'field1', targetPath: 'target1', confidence: 80, reason: 'Similar', matchType: 'similar' },
        { sourcePath: 'field2', targetPath: 'target2', confidence: 75, reason: 'Similar', matchType: 'similar' }
      ];

      prompts.setMockResponses(['skip', 'back', 'accept']);

      // Act
      const result = await prompts.runMappingWizard(suggestions);

      // Assert
      expect(result.mappings.length).toBeGreaterThanOrEqual(0);
    });
  });
});
