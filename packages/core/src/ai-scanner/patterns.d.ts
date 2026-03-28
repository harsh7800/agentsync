/**
 * Tool-specific glob patterns for agent detection
 */
export interface ToolPatterns {
    /** Tool identifier */
    tool: string;
    /** Display name */
    name: string;
    /** Glob patterns to match agent files */
    patterns: string[];
    /** File extensions to look for */
    extensions: string[];
    /** Config file names */
    configFiles: string[];
}
/**
 * Default patterns for all supported tools
 */
export declare const DEFAULT_TOOL_PATTERNS: ToolPatterns[];
/**
 * Get patterns for a specific tool
 */
export declare function getToolPatterns(tool: string): ToolPatterns | undefined;
/**
 * Get all supported tool names
 */
export declare function getSupportedTools(): string[];
/**
 * Check if a tool is supported
 */
export declare function isToolSupported(tool: string): boolean;
//# sourceMappingURL=patterns.d.ts.map