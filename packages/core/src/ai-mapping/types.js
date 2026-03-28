/**
 * Types for AI Mapping Engine
 */
export class MappingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MappingError';
    }
}
export class SimilarityCalculationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SimilarityCalculationError';
    }
}
export class ConflictResolutionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictResolutionError';
    }
}
//# sourceMappingURL=types.js.map