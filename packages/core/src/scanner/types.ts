/**
 * Types for AI Directory Scanner
 * 
 * Provides type definitions for scanning OpenCode configurations
 * using glob patterns for both project-level and global-level scopes.
 */

/**
 * Options for scanning directories
 */
export interface ScanOptions {
  /** Scan scope - project, global, or both */
  scope: 'project' | 'global' | 'both';
  /** Path to project root (default: process.cwd()) */
  projectPath?: string;
  /** Path to global config directory (default: ~/.config/) */
  globalPath?: string;
  /** Include agent files in scan (default: true) */
  includeAgents?: boolean;
  /** Include skill files in scan (default: true) */
  includeSkills?: boolean;
  /** Include config files in scan (default: true) */
  includeConfig?: boolean;
  /** Follow symbolic links (default: false) */
  followSymlinks?: boolean;
  /** Maximum directory depth to scan (default: 10) */
  maxDepth?: number;
}

/**
 * Result of a scan operation
 */
export interface ScanResult {
  /** All detected files */
  files: DetectedFile[];
  /** Only agent files */
  agents: DetectedFile[];
  /** Only skill files */
  skills: DetectedFile[];
  /** Only config files */
  configs: DetectedFile[];
  /** Files categorized as project-level */
  projectLevel: DetectedFile[];
  /** Files categorized as global-level */
  globalLevel: DetectedFile[];
  /** Scan duration in milliseconds */
  duration: number;
  /** Number of files scanned */
  filesScanned: number;
  /** Any errors encountered during scan */
  errors: ScanError[];
}

/**
 * A detected file with metadata
 */
export interface DetectedFile {
  /** Unique identifier for the file */
  id: string;
  /** Full path to the file */
  path: string;
  /** File name */
  name: string;
  /** Type of file */
  type: FileType;
  /** Scope - project or global */
  scope: 'project' | 'global';
  /** Tool name (opencode, claude, cursor, etc.) */
  tool?: string;
  /** File size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** Optional metadata parsed from file */
  metadata?: AgentMetadata | SkillMetadata | ConfigMetadata;
}

/**
 * Type of detected file
 */
export type FileType = 'agent' | 'skill' | 'config';

/**
 * Metadata extracted from agent files
 */
export interface AgentMetadata {
  /** Agent name */
  name: string;
  /** Optional description */
  description?: string;
  /** Model used by agent */
  model?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Available tools */
  tools?: string[];
  /** MCP servers */
  mcpServers?: string[];
}

/**
 * Metadata extracted from skill files
 */
export interface SkillMetadata {
  /** Skill name */
  name: string;
  /** Optional description */
  description?: string;
  /** Skill version */
  version?: string;
  /** Skill author */
  author?: string;
}

/**
 * Metadata extracted from config files
 */
export interface ConfigMetadata {
  /** MCP server configurations */
  mcpServers: MCPServerConfig[];
  /** Default model */
  defaultModel?: string;
  /** Additional settings */
  settings?: Record<string, unknown>;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Command to run */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Scan error information
 */
export interface ScanError {
  /** Path where error occurred */
  path: string;
  /** Error message */
  error: string;
  /** Error code */
  code: 'PERMISSION_DENIED' | 'FILE_NOT_FOUND' | 'PARSE_ERROR' | 'ACCESS_ERROR';
}

/**
 * Options for glob scanning
 */
export interface GlobOptions {
  /** Maximum depth to search */
  maxDepth?: number;
  /** Follow symbolic links */
  followSymlinks?: boolean;
  /** Patterns to ignore */
  ignore?: string[];
  /** Working directory */
  cwd?: string;
}
