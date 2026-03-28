import type { AgentInfo } from './types.js';
/**
 * Content Analyzer
 *
 * Analyzes file content to determine agent type and metadata
 */
export declare class ContentAnalyzer {
    /**
     * Analyze a file to extract agent information
     *
     * @param filePath Path to file
     * @returns AgentInfo if valid agent, null otherwise
     */
    analyze(filePath: string): Promise<AgentInfo | null>;
    /**
     * Detect tool type from content and file path
     */
    private detectToolFromContent;
    /**
     * Extract agent name from content
     */
    private extractName;
    /**
     * Detect agent type from content and file path
     */
    private detectType;
    /**
     * Extract metadata from content
     */
    private extractMetadata;
}
//# sourceMappingURL=analyzer.d.ts.map