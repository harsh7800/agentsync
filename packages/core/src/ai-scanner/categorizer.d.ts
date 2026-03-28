import type { DetectedAgent, CategorizedAgents } from './types.js';
/**
 * Categorizer
 *
 * Categorizes detected agents as local (project-specific) or system (user-wide)
 */
export declare class Categorizer {
    private homeDir;
    constructor();
    /**
     * Categorize agents as local or system
     *
     * @param agents Array of detected agents
     * @returns Categorized agents
     */
    categorize(agents: DetectedAgent[]): CategorizedAgents;
    /**
     * Determine category from file path
     *
     * @param filePath File path
     * @returns 'local' or 'system'
     */
    getCategoryFromPath(filePath: string): 'local' | 'system';
    /**
     * Check if a path is a system path
     *
     * @param filePath File path
     * @returns true if system path
     */
    isSystemPath(filePath: string): boolean;
    /**
     * Check if a path is a local path
     *
     * @param filePath File path
     * @returns true if local path
     */
    isLocalPath(filePath: string): boolean;
}
//# sourceMappingURL=categorizer.d.ts.map