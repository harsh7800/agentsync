import type { ManualScanOptions, ScanResult, ValidationResult } from './types.js';
/**
 * ManualScanController
 *
 * Handles user-controlled manual scanning with custom options.
 * Extends the base Scanner with user-specific controls.
 */
export declare class ManualScanController {
    private scanner;
    constructor();
    /**
     * Perform a scan with user-specified options
     *
     * @param options User scan options
     * @returns Scan result
     */
    scanWithUserOptions(options: ManualScanOptions): Promise<ScanResult>;
    /**
     * Validate user-provided scan options
     *
     * @param options Options to validate
     * @returns Validation result
     */
    validateScanOptions(options: ManualScanOptions): ValidationResult;
    /**
     * Suggest optimal scan depth based on directory structure
     *
     * @param path Directory path to analyze
     * @returns Suggested depth (1-10)
     */
    suggestScanDepth(path: string): Promise<number>;
    /**
     * Calculate the actual depth of a directory structure
     */
    private calculateDirectoryDepth;
    /**
     * Apply exclude patterns to filter out agents
     */
    private applyExcludePatterns;
}
//# sourceMappingURL=manual-scan.d.ts.map