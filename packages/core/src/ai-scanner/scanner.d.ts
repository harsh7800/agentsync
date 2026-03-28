import type { ScanOptions, ScanResult, DetectedAgent } from './types.js';
/**
 * Smart Agent Scanner
 *
 * Detects AI agent configurations using glob/grep pattern matching.
 * Supports both manual and AI-assisted scanning modes.
 */
export declare class Scanner {
    private categorizer;
    private analyzer;
    constructor();
    /**
     * Main scan entry point
     *
     * @param options Scan options
     * @returns Scan result with categorized agents
     */
    scan(options: ScanOptions): Promise<ScanResult>;
    /**
     * Detect agents for a specific tool in given paths
     *
     * @param tool Tool identifier
     * @param paths Paths to search
     * @returns Array of detected agents
     */
    detectAgents(tool: string, paths: string[]): Promise<DetectedAgent[]>;
    /**
     * Validate scan options
     */
    private validateOptions;
    /**
     * Get paths to scan based on scope
     */
    private getScanPaths;
    /**
     * Scan a specific path for agents
     */
    private scanPath;
    /**
     * Find files matching patterns in directory
     */
    private findFilesInDir;
    /**
     * Check if a file path matches any of the glob patterns
     */
    private matchesPatterns;
    /**
     * Scan with a custom pattern
     */
    private scanWithPattern;
    /**
     * Create a DetectedAgent from a file
     */
    private createAgentFromFile;
}
export * from './types.js';
//# sourceMappingURL=scanner.d.ts.map