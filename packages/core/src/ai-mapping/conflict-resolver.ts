import type { 
  FieldMapping, 
  MappingConflict, 
  ConflictResolution, 
  ResolutionStrategy,
  ConfigField 
} from './types.js';

/**
 * ConflictResolver
 * 
 * Resolves mapping conflicts between source and target configurations.
 */
export class ConflictResolver {
  /**
   * Detect conflicts in mappings
   */
  detectConflicts(mappings: FieldMapping[], targetFields?: ConfigField[]): MappingConflict[] {
    const conflicts: MappingConflict[] = [];

    // Check for one-to-many mappings
    const sourceToTargets = new Map<string, FieldMapping[]>();
    for (const mapping of mappings) {
      const key = mapping.source.name;
      const existing = sourceToTargets.get(key) || [];
      existing.push(mapping);
      sourceToTargets.set(key, existing);
    }

    for (const [sourceName, targetMappings] of sourceToTargets) {
      if (targetMappings.length > 1) {
        conflicts.push({
          type: 'one-to-many',
          description: `Source field "${sourceName}" maps to multiple target fields`,
          affectedMappings: targetMappings.map(m => `${m.source.name} -> ${m.target.name}`),
          suggestion: 'Choose the highest confidence mapping or split the data'
        });
      }
    }

    // Check for many-to-one mappings
    const targetToSources = new Map<string, FieldMapping[]>();
    for (const mapping of mappings) {
      const key = mapping.target.name;
      const existing = targetToSources.get(key) || [];
      existing.push(mapping);
      targetToSources.set(key, existing);
    }

    for (const [targetName, sourceMappings] of targetToSources) {
      if (sourceMappings.length > 1) {
        conflicts.push({
          type: 'many-to-one',
          description: `Multiple source fields map to target field "${targetName}"`,
          affectedMappings: sourceMappings.map(m => `${m.source.name} -> ${m.target.name}`),
          suggestion: 'Merge source fields or choose the highest confidence mapping'
        });
      }
    }

    // Check for type mismatches
    for (const mapping of mappings) {
      if (mapping.source.type !== mapping.target.type) {
        conflicts.push({
          type: 'type-mismatch',
          description: `Type mismatch: "${mapping.source.name}" (${mapping.source.type}) -> "${mapping.target.name}" (${mapping.target.type})`,
          affectedMappings: [`${mapping.source.name} -> ${mapping.target.name}`],
          suggestion: 'Add type conversion or choose a different target field'
        });
      }
    }

    // Check for missing required fields
    if (targetFields) {
      const mappedTargetNames = new Set(mappings.map(m => m.target.name));
      
      for (const targetField of targetFields) {
        if (targetField.required && !mappedTargetNames.has(targetField.name)) {
          conflicts.push({
            type: 'required-missing',
            description: `Required target field "${targetField.name}" is not mapped`,
            affectedMappings: [],
            suggestion: `Map a source field to "${targetField.name}" or provide a default value`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using specified strategy
   */
  resolveConflicts(
    mappings: FieldMapping[], 
    strategy: ResolutionStrategy = 'strict',
    targetFields?: ConfigField[]
  ): ConflictResolution {
    const conflicts = this.detectConflicts(mappings, targetFields);
    const resolvedMappings: FieldMapping[] = [];
    const unresolvedConflicts: MappingConflict[] = [];

    if (strategy === 'strict') {
      // In strict mode, only keep non-conflicting mappings
      const sourceToBestTarget = new Map<string, FieldMapping>();
      const targetToBestSource = new Map<string, FieldMapping>();

      // Find best mapping for each source field
      for (const mapping of mappings) {
        const existing = sourceToBestTarget.get(mapping.source.name);
        if (!existing || mapping.confidence > existing.confidence) {
          sourceToBestTarget.set(mapping.source.name, mapping);
        }
      }

      // Find best mapping for each target field
      for (const mapping of mappings) {
        const existing = targetToBestSource.get(mapping.target.name);
        if (!existing || mapping.confidence > existing.confidence) {
          targetToBestSource.set(mapping.target.name, mapping);
        }
      }

      // Keep only mappings that are best for both source and target
      for (const mapping of mappings) {
        const bestForSource = sourceToBestTarget.get(mapping.source.name);
        const bestForTarget = targetToBestSource.get(mapping.target.name);
        
        if (bestForSource === mapping && bestForTarget === mapping) {
          resolvedMappings.push(mapping);
        }
      }

      // Re-detect conflicts with resolved mappings
      const remainingConflicts = this.detectConflicts(resolvedMappings, targetFields);
      unresolvedConflicts.push(...remainingConflicts);
    } else if (strategy === 'lenient') {
      // In lenient mode, keep all mappings but mark conflicts
      resolvedMappings.push(...mappings);
      
      // Re-detect conflicts
      const remainingConflicts = this.detectConflicts(resolvedMappings, targetFields);
      unresolvedConflicts.push(...remainingConflicts);
    } else {
      // 'prompt-user' strategy - return all for user review
      resolvedMappings.push(...mappings);
      unresolvedConflicts.push(...conflicts);
    }

    return {
      mappings: resolvedMappings,
      unresolvedConflicts,
      strategy
    };
  }
}
