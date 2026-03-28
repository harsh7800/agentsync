/**
 * Types for AI Agent Scanner
 */
export class ScannerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ScannerError';
    }
}
export class ValidationError extends ScannerError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
export class PatternError extends ScannerError {
    constructor(message) {
        super(message);
        this.name = 'PatternError';
    }
}
//# sourceMappingURL=types.js.map