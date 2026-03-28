import type { FieldMapping, MappingConflict, ConflictResolution, ResolutionStrategy, ConfigField } from './types.js';
/**
 * ConflictResolver
 *
 * Resolves mapping conflicts between source and target configurations.
 */
export declare class ConflictResolver {
    /**
     * Detect conflicts in mappings
     */
    detectConflicts(mappings: FieldMapping[], targetFields?: ConfigField[]): MappingConflict[];
    /**
     * Resolve conflicts using specified strategy
     */
    resolveConflicts(mappings: FieldMapping[], strategy?: ResolutionStrategy, targetFields?: ConfigField[]): ConflictResolution;
}
//# sourceMappingURL=conflict-resolver.d.ts.map