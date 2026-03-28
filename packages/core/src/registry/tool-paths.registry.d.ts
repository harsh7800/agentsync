/**
 * Tool Path Registry
 *
 * Defines the directory structure for each supported AI tool.
 * This registry enables AgentSync to locate configuration files
 * regardless of where they are stored on the user's system.
 */
export type ToolName = 'claude' | 'opencode' | 'gemini' | 'cursor' | 'copilot';
/**
 * Tool-specific directory structure definition
 */
export interface ToolDirectoryStructure {
    /** Display name of the tool */
    displayName: string;
    /** Global (system-wide) config root directory */
    globalRoot: string;
    /** Project (local) config root directory */
    projectRoot: string;
    /** Config file names (in order of priority) */
    configFiles: string[];
    /** Directory containing agent definitions */
    agentsDir?: string;
    /** Directory containing skill definitions */
    skillsDir?: string;
    /** Directory containing MCP server configurations */
    mcpDir?: string;
    /** Default file name for agents (inside agent folders) */
    agentFileName?: string;
    /** Default file name for skills (inside skill folders) */
    skillFileName?: string;
    /** Whether the tool uses directory-based structure for agents */
    usesAgentDirectories?: boolean;
    /** Whether the tool uses directory-based structure for skills */
    usesSkillDirectories?: boolean;
}
/**
 * Resolved tool path information
 */
export interface ResolvedToolPath {
    tool: ToolName;
    rootPath: string;
    isGlobal: boolean;
    configFile?: string;
    agentsPath?: string;
    skillsPath?: string;
    mcpPath?: string;
}
/**
 * Registry of all supported tools and their directory structures
 */
export declare const TOOL_PATH_REGISTRY: Record<ToolName, ToolDirectoryStructure>;
/**
 * Tool Path Registry class for resolving tool paths
 */
export declare class ToolPathRegistry {
    private toolStructures;
    constructor();
    /**
     * Get the directory structure for a tool
     */
    getStructure(tool: ToolName): ToolDirectoryStructure;
    /**
     * Get all supported tool names
     */
    getSupportedTools(): ToolName[];
    /**
     * Resolve the actual path for a tool, checking both global and project locations
     */
    resolveToolPath(tool: ToolName, preferGlobal?: boolean): ResolvedToolPath;
    /**
     * Check if a tool is detected (exists) at the given path
     */
    isToolInstalled(tool: ToolName, checkGlobal?: boolean): Promise<boolean>;
    /**
     * Find the actual config file path for a tool
     */
    findConfigFile(tool: ToolName, rootPath: string): Promise<string | undefined>;
    /**
     * Get the default path for a tool (global by default)
     */
    getDefaultPath(tool: ToolName, useGlobal?: boolean): string;
    /**
     * Check if a tool uses directory-based agent/skill structure
     */
    usesDirectoryStructure(tool: ToolName): boolean;
}
export declare const toolPathRegistry: ToolPathRegistry;
//# sourceMappingURL=tool-paths.registry.d.ts.map