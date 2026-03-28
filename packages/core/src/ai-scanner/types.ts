/**
 * Types for AI Agent Scanner
 */

export interface ScanOptions {
  /** Scan scope: local (project), system (user-wide), or both */
  scope: 'local' | 'system' | 'both';
  /** Directory depth limit (default: 3) */
  depth?: number;
  /** Custom glob patterns (optional) */
  patterns?: string[];
  /** Tools to scan for (default: all) */
  tools?: string[];
  /** Current working directory (default: process.cwd()) */
  cwd?: string;
}

export interface ScanResult {
  /** Categorized agents */
  agents: CategorizedAgents;
  /** Scan duration in milliseconds */
  duration: number;
  /** Number of files scanned */
  filesScanned: number;
  /** Any errors encountered during scan */
  errors: string[];
}

export interface DetectedAgent {
  /** Unique identifier */
  id: string;
  /** Agent name */
  name: string;
  /** Tool type (e.g., 'opencode', 'claude') */
  tool: string;
  /** Full file path */
  path: string;
  /** Agent type */
  type: 'agent' | 'skill' | 'mcp' | 'config';
  /** Category: local or system-wide */
  category: 'local' | 'system';
  /** File size in bytes */
  size: number;
  /** Last modified date */
  lastModified: Date;
  /** Complexity level (set during AI analysis) */
  complexity?: 'low' | 'medium' | 'high';
  /** Relevance score for prioritization (0-100, set during AI analysis) */
  relevanceScore?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface CategorizedAgents {
  /** Project-local agents */
  local: DetectedAgent[];
  /** System-wide agents */
  system: DetectedAgent[];
}

export interface AgentInfo {
  /** Agent name */
  name: string;
  /** Agent type */
  type: 'agent' | 'skill' | 'mcp' | 'config';
  /** Tool identifier */
  tool: string;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

export class ScannerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScannerError';
  }
}

export class ValidationError extends ScannerError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PatternError extends ScannerError {
  constructor(message: string) {
    super(message);
    this.name = 'PatternError';
  }
}

/**
 * Manual Scan Mode Types
 */

export interface ManualScanOptions {
  /** Scan scope: current directory, home directory, or custom path */
  scope: 'current' | 'home' | 'custom';
  /** Custom path (required when scope is 'custom') */
  customPath?: string;
  /** Directory depth limit (1-10, default: 3) */
  depth?: number;
  /** Include patterns (glob) */
  includePatterns?: string[];
  /** Exclude patterns (glob) */
  excludePatterns?: string[];
  /** Tools to scan for (default: all) */
  tools?: string[];
  /** Whether to respect .gitignore (default: true) */
  respectGitignore?: boolean;
  /** Current working directory */
  cwd?: string;
}

export interface ValidationResult {
  /** Whether the options are valid */
  isValid: boolean;
  /** Validation errors if any */
  errors: string[];
}

/**
 * AI-Assisted Scan Mode Types
 */

export interface AIAssistedScanOptions {
  /** Scan scope: current directory, home directory, or custom path */
  scope: 'current' | 'home' | 'custom';
  /** Custom path (required when scope is 'custom') */
  customPath?: string;
  /** Enable autonomous agent detection */
  autoDetect?: boolean;
  /** Analyze file content to determine tool type */
  analyzeContent?: boolean;
  /** Suggest migration paths */
  suggestMigrations?: boolean;
  /** Detect cross-tool compatibility */
  detectCompatibility?: boolean;
  /** Prioritize agents by relevance score */
  prioritizeByRelevance?: boolean;
  /** Learn from file structure patterns */
  learnPatterns?: boolean;
  /** Analyze agent complexity */
  analyzeComplexity?: boolean;
  /** Detect deprecated configurations */
  detectOutdated?: boolean;
  /** Automatically group related agents */
  autoGroup?: boolean;
  /** Estimate migration effort */
  estimateEffort?: boolean;
  /** Recommend best target tool */
  recommendTarget?: boolean;
  /** Identify potential conflicts */
  detectConflicts?: boolean;
  /** Generate migration confidence score */
  calculateConfidence?: boolean;
  /** Use cached results */
  useCache?: boolean;
  /** Perform incremental scan */
  incremental?: boolean;
  /** Maximum files to scan */
  maxFiles?: number;
  /** Current working directory */
  cwd?: string;
}

export interface AIAssistedScanResult extends ScanResult {
  /** Whether AI analysis was performed */
  aiAnalysisPerformed: boolean;
  /** Learned patterns from scan */
  learnedPatterns?: string[];
  /** Migration suggestions */
  suggestions?: MigrationSuggestion[];
  /** Cross-tool compatibility matrix */
  compatibilityMatrix?: CompatibilityMatrix;
  /** Agent groups (if auto-grouped) */
  agentGroups?: AgentGroup[];
  /** Migration effort estimate */
  migrationEstimate?: MigrationEstimate;
  /** Recommended target tools */
  recommendedTargets?: string[];
  /** Potential conflicts detected */
  potentialConflicts?: ConflictInfo[];
  /** Overall confidence score (0-100) */
  confidenceScore: number;
  /** Whether incremental scan was used */
  incrementalScan?: boolean;
  /** Additional warnings */
  warnings?: string[];
}

export interface MigrationSuggestion {
  /** Source agent ID */
  sourceId: string;
  /** Suggested target tool */
  targetTool: string;
  /** Confidence in suggestion (0-100) */
  confidence: number;
  /** Reason for suggestion */
  reason: string;
  /** Estimated effort */
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface CompatibilityMatrix {
  /** Source tool */
  sourceTool: string;
  /** Compatible target tools with scores */
  targets: Array<{
    tool: string;
    compatibilityScore: number;
    notes: string;
  }>;
}

export interface AgentGroup {
  /** Group name */
  name: string;
  /** Group category */
  category: string;
  /** Agent IDs in this group */
  agentIds: string[];
  /** Common characteristics */
  characteristics: string[];
}

export interface MigrationEstimate {
  /** Total agents to migrate */
  totalAgents: number;
  /** Estimated time in minutes */
  estimatedTimeMinutes: number;
  /** Complexity level */
  complexity: 'low' | 'medium' | 'high';
  /** Risk level */
  risk: 'low' | 'medium' | 'high';
}

export interface ConflictInfo {
  /** Conflict type */
  type: 'name' | 'config' | 'dependency';
  /** Description */
  description: string;
  /** Affected agents */
  affectedAgents: string[];
  /** Suggested resolution */
  suggestedResolution: string;
}
