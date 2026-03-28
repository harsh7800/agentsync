import { ConflictResolver } from '@agentsync/core';
import type { 
  MappingConflict, 
  ConflictResolution, 
  FieldMapping,
  ResolutionStrategy 
} from '@agentsync/core';

interface ResolutionOption {
  action: string;
  label: string;
  description: string;
}

interface ConflictExplanation {
  title: string;
  description: string;
  impact: string;
  options: ResolutionOption[];
}

interface ResolutionImpact {
  fieldsAffected: number;
  dataLossRisk: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface ResolutionPreview {
  keptMappings: FieldMapping[];
  removedMappings: FieldMapping[];
  summary: string;
}

interface ResolutionRecommendation {
  action: 'accept' | 'review' | 'skip';
  reason: string;
}

interface ResolutionHistoryEntry {
  timestamp: Date;
  strategy: ResolutionStrategy;
  mappingsCount: number;
  conflictsResolved: number;
}

interface MockResponse {
  conflictType?: string;
  response: string;
}

/**
 * InteractiveConflictResolver
 * 
 * Provides interactive conflict resolution with user prompts,
 * batch operations, undo/redo support, and intelligent recommendations.
 */
export class InteractiveConflictResolver {
  private coreResolver: ConflictResolver;
  private mockResponse: string | null = null;
  private mockResponses: MockResponse[] = [];
  private customMappings: Map<string, string> = new Map();
  private history: ResolutionHistoryEntry[] = [];
  private lastResolution: ConflictResolution | null = null;

  constructor() {
    this.coreResolver = new ConflictResolver();
  }

  /**
   * Set mock response for testing
   */
  setMockResponse(response: string): void {
    this.mockResponse = response;
  }

  /**
   * Set multiple mock responses for different conflict types
   */
  setMockResponses(responses: MockResponse[]): void {
    this.mockResponses = responses;
  }

  /**
   * Set custom mapping for testing
   */
  setCustomMapping(source: string, target: string): void {
    this.customMappings.set(source, target);
  }

  /**
   * Resolve conflicts using specified strategy
   */
  async resolveWithStrategy(
    mappings: FieldMapping[], 
    strategy: ResolutionStrategy
  ): Promise<ConflictResolution> {
    let resolution: ConflictResolution;

    if (strategy === 'prompt-user') {
      resolution = await this.resolveInteractively(mappings);
    } else {
      resolution = this.coreResolver.resolveConflicts(mappings, strategy);
    }

    // Record in history
    this.lastResolution = resolution;
    this.history.push({
      timestamp: new Date(),
      strategy,
      mappingsCount: resolution.mappings.length,
      conflictsResolved: resolution.mappings.length
    });

    return resolution;
  }

  /**
   * Resolve conflicts interactively with user prompts
   */
  async resolveInteractively(mappings: FieldMapping[]): Promise<ConflictResolution> {
    const conflicts = this.coreResolver.detectConflicts(mappings);
    const resolvedMappings: FieldMapping[] = [];
    const unresolvedConflicts: MappingConflict[] = [];

    for (const conflict of conflicts) {
      const response = await this.promptUserForResolution(conflict);
      
      switch (response) {
        case 'keep-first':
          // Keep only the first mapping for this conflict
          if (conflict.affectedMappings.length > 0) {
            const firstMapping = this.findMappingById(mappings, conflict.affectedMappings[0]);
            if (firstMapping) {
              resolvedMappings.push(firstMapping);
            }
          }
          break;
        case 'keep-all':
          // Keep all mappings (lenient approach)
          conflict.affectedMappings.forEach(id => {
            const mapping = this.findMappingById(mappings, id);
            if (mapping) {
              resolvedMappings.push(mapping);
            }
          });
          break;
        case 'merge':
          // Merge multiple source fields into one
          const mergedMapping = this.createMergedMapping(mappings, conflict.affectedMappings);
          if (mergedMapping) {
            resolvedMappings.push(mergedMapping);
          }
          break;
        case 'skip':
          // Skip this conflict - don't add any mappings
          break;
        case 'custom':
          // Apply custom mapping
          const customMapping = this.applyCustomMapping(mappings, conflict);
          if (customMapping) {
            resolvedMappings.push(customMapping);
          }
          break;
        default:
          unresolvedConflicts.push(conflict);
      }
    }

    // Add non-conflicting mappings
    const conflictedIds = new Set(conflicts.flatMap(c => c.affectedMappings));
    for (const mapping of mappings) {
      const mappingId = `${mapping.source.name}->${mapping.target.name}`;
      if (!conflictedIds.has(mappingId)) {
        resolvedMappings.push(mapping);
      }
    }

    const resolution: ConflictResolution = {
      mappings: this.deduplicateMappings(resolvedMappings),
      unresolvedConflicts,
      strategy: 'prompt-user'
    };

    this.lastResolution = resolution;
    return resolution;
  }

  /**
   * Recommend strategy based on conflict severity
   */
  recommendStrategy(conflicts: MappingConflict[]): ResolutionStrategy {
    const hasSevereConflict = conflicts.some(c => 
      c.type === 'one-to-many' || c.type === 'many-to-one'
    );

    const hasMinorConflict = conflicts.some(c =>
      c.type === 'type-mismatch'
    );

    if (hasSevereConflict) {
      return 'strict';
    } else if (hasMinorConflict) {
      return 'lenient';
    }

    return 'prompt-user';
  }

  /**
   * Generate resolution options for a conflict
   */
  generateResolutionOptions(conflict: MappingConflict): ResolutionOption[] {
    const options: ResolutionOption[] = [
      {
        action: 'keep-first',
        label: 'Keep First Match',
        description: 'Keep only the highest confidence mapping'
      },
      {
        action: 'keep-all',
        label: 'Keep All',
        description: 'Keep all conflicting mappings (may cause issues)'
      },
      {
        action: 'skip',
        label: 'Skip',
        description: 'Skip this field mapping'
      }
    ];

    if (conflict.type === 'many-to-one') {
      options.splice(1, 0, {
        action: 'merge',
        label: 'Merge Sources',
        description: 'Combine multiple source fields into one target'
      });
    }

    options.push({
      action: 'custom',
      label: 'Custom Mapping',
      description: 'Specify a custom target field'
    });

    return options;
  }

  /**
   * Resolve batch of similar conflicts
   */
  async resolveBatch(
    conflicts: MappingConflict[], 
    conflictType: string
  ): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];
    const applyToAll = this.mockResponse === 'apply-to-all';
    let chosenStrategy: ResolutionStrategy = 'lenient';

    for (let i = 0; i < conflicts.length; i++) {
      const conflict = conflicts[i];
      
      if (applyToAll && i === 0) {
        // Get user choice for first conflict
        const response = await this.promptUserForResolution(conflict);
        if (response === 'convert') {
          chosenStrategy = 'lenient';
        }
      }

      // Create mock mappings for the conflict
      const mockMappings: FieldMapping[] = conflict.affectedMappings.map(id => {
        const [source, target] = id.split('->');
        return {
          source: { name: source, type: 'string', required: false },
          target: { name: target, type: 'string', required: false },
          confidence: 80
        };
      });

      const resolution = this.coreResolver.resolveConflicts(mockMappings, chosenStrategy);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Preview resolution without applying
   */
  async previewResolution(
    mappings: FieldMapping[], 
    strategy: ResolutionStrategy
  ): Promise<ResolutionPreview> {
    const resolution = await this.resolveWithStrategy(mappings, strategy);

    // Determine which mappings would be kept vs removed
    const allIds = new Set(mappings.map(m => `${m.source.name}->${m.target.name}`));
    const keptIds = new Set(resolution.mappings.map(m => `${m.source.name}->${m.target.name}`));
    
    const keptMappings = mappings.filter(m => keptIds.has(`${m.source.name}->${m.target.name}`));
    const removedMappings = mappings.filter(m => !keptIds.has(`${m.source.name}->${m.target.name}`));

    return {
      keptMappings,
      removedMappings,
      summary: `Strategy: ${strategy}. Kept ${keptMappings.length} of ${mappings.length} mappings.`
    };
  }

  /**
   * Generate human-readable conflict explanation
   */
  explainConflict(conflict: MappingConflict): ConflictExplanation {
    const typeLabels: Record<string, string> = {
      'one-to-many': 'Multiple Target Mappings',
      'many-to-one': 'Multiple Source Mappings',
      'type-mismatch': 'Type Incompatibility',
      'required-missing': 'Required Field Missing'
    };

    const typeImpacts: Record<string, string> = {
      'one-to-many': 'Only one target field can receive the data',
      'many-to-one': 'Data from multiple sources may overwrite each other',
      'type-mismatch': 'Data may need conversion to match target type',
      'required-missing': 'Target requires this field but no source mapping exists'
    };

    return {
      title: typeLabels[conflict.type] || 'Mapping Conflict',
      description: conflict.description,
      impact: typeImpacts[conflict.type] || 'Review required',
      options: this.generateResolutionOptions(conflict)
    };
  }

  /**
   * Analyze impact of resolution strategy
   */
  async analyzeImpact(mappings: FieldMapping[], strategy: ResolutionStrategy): Promise<ResolutionImpact> {
    const resolution = await this.resolveWithStrategy(mappings, strategy);
    
    const fieldsAffected = mappings.length - resolution.mappings.length;
    
    let dataLossRisk: 'low' | 'medium' | 'high' = 'low';
    if (fieldsAffected > mappings.length * 0.5) {
      dataLossRisk = 'high';
    } else if (fieldsAffected > mappings.length * 0.2) {
      dataLossRisk = 'medium';
    }

    return {
      fieldsAffected,
      dataLossRisk,
      recommendation: fieldsAffected > 0 
        ? `Review ${fieldsAffected} removed mappings before applying`
        : 'Safe to apply - no data loss'
    };
  }

  /**
   * Get recommendation for a mapping
   */
  getRecommendation(mapping: FieldMapping): ResolutionRecommendation {
    if (mapping.confidence >= 90) {
      return {
        action: 'accept',
        reason: `High confidence (${mapping.confidence}%) exact or near-exact match`
      };
    } else if (mapping.confidence >= 70) {
      return {
        action: 'review',
        reason: `Medium confidence (${mapping.confidence}%) - verify this mapping is correct`
      };
    } else {
      return {
        action: 'review',
        reason: `Low confidence (${mapping.confidence}%) - manual review recommended`
      };
    }
  }

  /**
   * Undo last resolution
   */
  async undoLastResolution(): Promise<boolean> {
    if (this.history.length === 0) {
      return false;
    }

    this.history.pop();
    this.lastResolution = null;
    return true;
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(): ResolutionHistoryEntry[] {
    return [...this.history];
  }

  // Private helper methods

  private async promptUserForResolution(conflict: MappingConflict): Promise<string> {
    // In test mode, return mock response
    if (this.mockResponse) {
      const response = this.mockResponse;
      this.mockResponse = null; // Clear after use
      return response;
    }

    // Check for type-specific mock response
    const typeResponse = this.mockResponses.find(r => r.conflictType === conflict.type);
    if (typeResponse) {
      return typeResponse.response;
    }

    // Default response
    return 'keep-first';
  }

  private findMappingById(mappings: FieldMapping[], id: string): FieldMapping | undefined {
    return mappings.find(m => `${m.source.name}->${m.target.name}` === id);
  }

  private createMergedMapping(mappings: FieldMapping[], ids: string[]): FieldMapping | null {
    const affectedMappings = ids.map(id => this.findMappingById(mappings, id)).filter(Boolean) as FieldMapping[];
    
    if (affectedMappings.length === 0) {
      return null;
    }

    // Use the first target as the merged target
    const mergedSource = {
      name: `merged_${affectedMappings.map(m => m.source.name).join('_')}`,
      type: affectedMappings[0].source.type,
      required: affectedMappings.some(m => m.source.required)
    };

    return {
      source: mergedSource,
      target: affectedMappings[0].target,
      confidence: Math.max(...affectedMappings.map(m => m.confidence))
    };
  }

  private applyCustomMapping(mappings: FieldMapping[], conflict: MappingConflict): FieldMapping | null {
    // Find a source field from the conflict
    const firstId = conflict.affectedMappings[0];
    if (!firstId) return null;

    const [sourceName] = firstId.split('->');
    const customTarget = this.customMappings.get(sourceName);
    
    if (!customTarget) return null;

    const originalMapping = this.findMappingById(mappings, firstId);
    if (!originalMapping) return null;

    return {
      source: originalMapping.source,
      target: { ...originalMapping.target, name: customTarget },
      confidence: 100 // Custom mappings are high confidence
    };
  }

  private deduplicateMappings(mappings: FieldMapping[]): FieldMapping[] {
    const seen = new Map<string, FieldMapping>();
    
    for (const mapping of mappings) {
      const key = `${mapping.source.name}->${mapping.target.name}`;
      const existing = seen.get(key);
      
      if (!existing || mapping.confidence > existing.confidence) {
        seen.set(key, mapping);
      }
    }

    return Array.from(seen.values());
  }
}
