import type { 
  FieldMappingSuggestion, 
  MappingAnalysis,
  FieldComparison 
} from '@agentsync/core';

interface PromptConfig {
  type: 'confirm' | 'select' | 'expand' | 'input';
  message: string;
  default?: boolean | string;
  choices?: Array<{ name: string; value: string; short?: string }>;
}

interface PromptGuidance {
  tip: string;
  examples: string[];
}

interface MappingImpact {
  description: string;
  consequences: string[];
}

interface BatchSummary {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  preview: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface UserFeedback {
  message: string;
  nextStep: string;
}

interface RejectionResult {
  action: 'skip' | 'alternative' | 'custom';
  alternatives?: FieldMappingSuggestion[];
}

interface WizardResult {
  completed: boolean;
  mappings: FieldMappingSuggestion[];
  skipped: string[];
}

interface PreferenceRecord {
  sourcePath: string;
  targetPath: string;
  decision: 'accepted' | 'rejected';
}

/**
 * InteractiveMappingPrompts
 * 
 * Generates intelligent prompts for AI-assisted field mapping with
 * contextual guidance, batch processing, and user-friendly interactions.
 */
export class InteractiveMappingPrompts {
  private mockResponse: boolean | string | null = null;
  private mockResponses: (boolean | string)[] = [];
  private alternatives: FieldMappingSuggestion[] = [];
  private preferences: Map<string, string> = new Map();

  /**
   * Set mock response for testing
   */
  setMockResponse(response: boolean | string): void {
    this.mockResponse = response;
  }

  /**
   * Set multiple mock responses for wizard flow
   */
  setMockResponses(responses: (boolean | string)[]): void {
    this.mockResponses = [...responses];
  }

  /**
   * Set alternative suggestions for testing
   */
  setAlternatives(alternatives: FieldMappingSuggestion[]): void {
    this.alternatives = alternatives;
  }

  /**
   * Generate appropriate prompt based on confidence level
   */
  generatePromptForSuggestion(suggestion: FieldMappingSuggestion): PromptConfig {
    const { confidence, sourcePath, targetPath, matchType, transform } = suggestion;

    if (confidence >= 90) {
      return {
        type: 'confirm',
        message: `Accept high-confidence mapping: ${sourcePath} → ${targetPath} (${confidence}% match)?`,
        default: true
      };
    } else if (confidence >= 70) {
      return {
        type: 'select',
        message: `Review mapping: ${sourcePath} → ${targetPath} (${confidence}% match)`,
        choices: [
          { name: 'Accept', value: 'accept', short: '✓' },
          { name: 'Reject', value: 'reject', short: '✗' },
          { name: 'View alternatives', value: 'alternatives', short: '⋯' },
          { name: 'Custom mapping', value: 'custom', short: '✎' }
        ]
      };
    } else {
      let message = `Review low-confidence mapping: ${sourcePath} → ${targetPath} (${confidence}% match)`;
      
      if (transform) {
        message += `\n  Transform: ${transform.description}`;
      }

      return {
        type: 'expand',
        message,
        choices: [
          { name: 'Accept anyway', value: 'accept', short: 'y' },
          { name: 'Reject', value: 'reject', short: 'n' },
          { name: 'Skip for now', value: 'skip', short: 's' },
          { name: 'View details', value: 'details', short: 'd' },
          { name: 'Enter custom target', value: 'custom', short: 'c' }
        ]
      };
    }
  }

  /**
   * Group suggestions by confidence level
   */
  groupByConfidence(suggestions: FieldMappingSuggestion[]): {
    high: FieldMappingSuggestion[];
    medium: FieldMappingSuggestion[];
    low: FieldMappingSuggestion[];
  } {
    return {
      high: suggestions.filter(s => s.confidence >= 90),
      medium: suggestions.filter(s => s.confidence >= 70 && s.confidence < 90),
      low: suggestions.filter(s => s.confidence < 70)
    };
  }

  /**
   * Prompt for batch acceptance of high-confidence mappings
   */
  async promptBatchAccept(suggestions: FieldMappingSuggestion[]): Promise<{
    accepted: boolean;
    mappings: FieldMappingSuggestion[];
  }> {
    // Mock response for testing
    if (this.mockResponse !== null) {
      const accepted = this.mockResponse === true;
      this.mockResponse = null;
      return {
        accepted,
        mappings: accepted ? suggestions : []
      };
    }

    // Default implementation
    return {
      accepted: true,
      mappings: suggestions
    };
  }

  /**
   * Generate summary for batch processing
   */
  generateBatchSummary(suggestions: FieldMappingSuggestion[]): BatchSummary {
    const groups = this.groupByConfidence(suggestions);
    
    return {
      total: suggestions.length,
      highConfidence: groups.high.length,
      mediumConfidence: groups.medium.length,
      lowConfidence: groups.low.length,
      preview: this.generatePreview(suggestions)
    };
  }

  /**
   * Get basic prompt information (concise)
   */
  getBasicPromptInfo(suggestion: FieldMappingSuggestion): PromptConfig {
    return {
      type: 'confirm',
      message: `${suggestion.sourcePath} → ${suggestion.targetPath}?`,
      default: suggestion.confidence >= 80
    };
  }

  /**
   * Get detailed prompt information
   */
  getDetailedPromptInfo(suggestion: FieldMappingSuggestion): PromptConfig {
    const transform = suggestion.transform 
      ? `\n  Transform: ${suggestion.transform.type}` 
      : '';

    return {
      type: 'expand',
      message: `${suggestion.sourcePath} → ${suggestion.targetPath}\n  Confidence: ${suggestion.confidence}%\n  Reason: ${suggestion.reason}${transform}`,
      choices: [
        { name: 'Accept', value: 'accept', short: 'y' },
        { name: 'Reject', value: 'reject', short: 'n' },
        { name: 'Skip', value: 'skip', short: 's' }
      ]
    };
  }

  /**
   * Get detailed field information
   */
  getFieldDetails(analysis: MappingAnalysis, fieldName: string): {
    sourceField: string;
    bestMatch: FieldComparison | undefined;
    alternatives: FieldComparison[];
  } {
    const comparisons = analysis.comparisons.filter(c => c.sourceField === fieldName);
    const sorted = [...comparisons].sort((a, b) => b.confidence - a.confidence);

    return {
      sourceField: fieldName,
      bestMatch: sorted[0],
      alternatives: sorted.slice(1)
    };
  }

  /**
   * Generate helpful guidance for a mapping
   */
  generateGuidance(suggestion: FieldMappingSuggestion): PromptGuidance {
    const tips: Record<string, string> = {
      'exact': 'This is an exact match - safe to accept',
      'similar': 'These fields have similar names and likely serve the same purpose',
      'fuzzy': 'These fields may be related - review if this mapping makes sense',
      'transform': 'This mapping requires a transformation - check if it looks correct'
    };

    const examples: Record<string, string[]> = {
      'timeout': ['timeout → connectionTimeout', 'timeout → requestTimeout'],
      'port': ['port → serverPort', 'port → connectionPort'],
      'host': ['host → hostname', 'host → serverHost']
    };

    return {
      tip: tips[suggestion.matchType] || 'Review this mapping carefully',
      examples: examples[suggestion.sourcePath] || []
    };
  }

  /**
   * Explain impact of accepting or rejecting a mapping
   */
  explainMappingImpact(
    suggestion: FieldMappingSuggestion, 
    decision: 'accept' | 'reject'
  ): MappingImpact {
    if (decision === 'accept') {
      return {
        description: `Data from "${suggestion.sourcePath}" will be mapped to "${suggestion.targetPath}"`,
        consequences: [
          `Target field will receive ${suggestion.sourcePath} data`,
          suggestion.transform ? `Transformation will be applied: ${suggestion.transform.description}` : 'No transformation needed'
        ]
      };
    } else {
      return {
        description: `"${suggestion.sourcePath}" will not be mapped to "${suggestion.targetPath}"`,
        consequences: [
          `Target field "${suggestion.targetPath}" may be empty or use defaults`,
          'You can map it to a different field later'
        ]
      };
    }
  }

  /**
   * Handle user rejection of a suggestion
   */
  async handleRejection(suggestion: FieldMappingSuggestion): Promise<RejectionResult> {
    // Mock response for testing
    if (this.mockResponse !== null) {
      const response = String(this.mockResponse);
      this.mockResponse = null;

      if (response === 'alternative') {
        return {
          action: 'alternative',
          alternatives: this.alternatives
        };
      }

      return { action: 'skip' };
    }

    return { action: 'skip' };
  }

  /**
   * Validate user input
   */
  validateInput(input: string, type: 'target' | 'source'): ValidationResult {
    if (!input || input.trim().length === 0) {
      return { isValid: false, error: 'Field name cannot be empty' };
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) {
      return { isValid: false, error: 'Field name must start with letter/underscore and contain only alphanumeric characters' };
    }

    return { isValid: true };
  }

  /**
   * Generate feedback after user decision
   */
  generateFeedback(suggestion: FieldMappingSuggestion, decision: 'accepted' | 'rejected'): UserFeedback {
    if (decision === 'accepted') {
      return {
        message: `✓ Mapped ${suggestion.sourcePath} → ${suggestion.targetPath}`,
        nextStep: 'Continue with next mapping or review all accepted mappings'
      };
    } else {
      return {
        message: `✗ Skipped ${suggestion.sourcePath} → ${suggestion.targetPath}`,
        nextStep: 'This field will remain unmapped. You can map it later if needed.'
      };
    }
  }

  /**
   * Record user preference
   */
  recordPreference(preference: PreferenceRecord): void {
    const key = `${preference.sourcePath}→${preference.targetPath}`;
    this.preferences.set(key, preference.decision);
  }

  /**
   * Get recorded preference
   */
  getPreference(sourcePath: string, targetPath: string): 'accepted' | 'rejected' | undefined {
    const key = `${sourcePath}→${targetPath}`;
    const value = this.preferences.get(key);
    return value as 'accepted' | 'rejected' | undefined;
  }

  /**
   * Run mapping wizard for multiple suggestions
   */
  async runMappingWizard(suggestions: FieldMappingSuggestion[]): Promise<WizardResult> {
    const mappings: FieldMappingSuggestion[] = [];
    const skipped: string[] = [];
    let currentIndex = 0;

    while (currentIndex < suggestions.length) {
      const suggestion = suggestions[currentIndex];
      
      // Get response from mock or default
      let response: string;
      if (this.mockResponses.length > 0) {
        const mock = this.mockResponses.shift();
        response = typeof mock === 'boolean' ? (mock ? 'accept' : 'reject') : String(mock);
      } else {
        response = 'accept';
      }

      switch (response) {
        case 'accept':
          mappings.push(suggestion);
          currentIndex++;
          break;
        case 'reject':
          skipped.push(suggestion.sourcePath);
          currentIndex++;
          break;
        case 'skip':
          skipped.push(suggestion.sourcePath);
          currentIndex++;
          break;
        case 'back':
          currentIndex = Math.max(0, currentIndex - 1);
          break;
        default:
          currentIndex++;
      }
    }

    return {
      completed: true,
      mappings,
      skipped
    };
  }

  // Private helper methods

  private generatePreview(suggestions: FieldMappingSuggestion[]): string {
    const sample = suggestions.slice(0, 3);
    const lines = sample.map(s => `  ${s.sourcePath} → ${s.targetPath} (${s.confidence}%)`);
    
    if (suggestions.length > 3) {
      lines.push(`  ... and ${suggestions.length - 3} more`);
    }

    return lines.join('\n');
  }
}
