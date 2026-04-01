# AI Directory Scanner - Specification

**Feature ID:** S4-18A/B  
**Package:** packages/core  
**Phase:** Sprint 4 Phase 1.5  
**Status:** Design Complete - Ready for Implementation  

---

## 1. Overview

The AI Directory Scanner is a specialized scanning component designed to provide intelligent, pattern-based detection of OpenCode configurations using glob patterns. It addresses false positive issues in the current scanner by specifically targeting OpenCode's actual directory structure and file patterns.

### Purpose
- Scan file systems for OpenCode agent, skill, and configuration files
- Support both project-level (./.opencode/) and global-level (~/.config/opencode/) scopes
- Return structured results with accurate file type detection
- Eliminate false positives through pattern validation

### Key Capabilities
1. **Glob Pattern Scanning**: Uses glob patterns to efficiently find files
2. **Dual Scope Support**: Handles both project and global configurations
3. **Structured Results**: Returns categorized files with metadata
4. **Error Resilience**: Handles permission errors and missing directories gracefully
5. **Testability**: Supports mock file systems for reliable unit testing

---

## 2. Files and Their Purposes

### Core Implementation Files

| File | Path | Purpose |
|------|------|---------|
| `index.ts` | `packages/core/src/scanner/ai-directory-scanner/index.ts` | Main entry point, exports public API |
| `scanner.ts` | `packages/core/src/scanner/ai-directory-scanner/scanner.ts` | Core AIDirectoryScanner class implementation |
| `patterns.ts` | `packages/core/src/scanner/ai-directory-scanner/patterns.ts` | OpenCode-specific glob pattern definitions |
| `validators.ts` | `packages/core/src/scanner/ai-directory-scanner/validators.ts` | File validation logic (YAML frontmatter, JSON) |
| `parsers.ts` | `packages/core/src/scanner/ai-directory-scanner/parsers.ts` | Content parsers for agents, skills, configs |
| `glob-utils.ts` | `packages/core/src/scanner/ai-directory-scanner/glob-utils.ts` | Glob pattern matching utilities |
| `types.ts` | `packages/core/src/scanner/ai-directory-scanner/types.ts` | Module-specific type definitions (extends ../types.ts) |

### Test Files

| File | Path | Purpose |
|------|------|---------|
| `scanner.spec.ts` | `packages/core/src/scanner/ai-directory-scanner/__tests__/scanner.spec.ts` | Unit tests for AIDirectoryScanner class |
| `validators.spec.ts` | `packages/core/src/scanner/ai-directory-scanner/__tests__/validators.spec.ts` | Unit tests for validation logic |
| `parsers.spec.ts` | `packages/core/src/scanner/ai-directory-scanner/__tests__/parsers.spec.ts` | Unit tests for content parsers |
| `glob-utils.spec.ts` | `packages/core/src/scanner/ai-directory-scanner/__tests__/glob-utils.spec.ts` | Unit tests for glob utilities |
| `integration.spec.ts` | `packages/core/src/scanner/ai-directory-scanner/__tests__/integration.spec.ts` | Integration tests with mock filesystem |

---

## 3. Functions/Methods

### 3.1 AIDirectoryScanner Class

Main scanner class that orchestrates the detection process.

#### `constructor(options?: ScannerConstructorOptions)`

Creates a new scanner instance with optional configuration.

**Parameters:**
```typescript
interface ScannerConstructorOptions {
  /** Glob implementation to use (for dependency injection) */
  globImpl?: GlobImplementation;
  /** File system implementation (for testing) */
  fsImpl?: FileSystemImplementation;
  /** Enable debug logging */
  debug?: boolean;
}
```

#### `scan(options: ScanOptions): Promise<ScanResult>`

Main entry point for directory scanning. Performs comprehensive scan based on options.

**Parameters:**
```typescript
interface ScanOptions {
  /** Scan scope - project, global, or both */
  scope: 'project' | 'global' | 'both';
  /** Path to project root (default: process.cwd()) */
  projectPath?: string;
  /** Path to global config directory (default: ~/.config/opencode/) */
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
  /** Patterns to ignore during scan */
  ignorePatterns?: string[];
}
```

**Returns:** `Promise<ScanResult>` - Complete scan results with all detected files

**Example:**
```typescript
const scanner = new AIDirectoryScanner();
const result = await scanner.scan({
  scope: 'both',
  projectPath: './my-project',
  includeAgents: true,
  includeSkills: true,
  maxDepth: 5
});
```

#### `scanProjectLevel(projectPath: string, options?: Partial<ScanOptions>): Promise<DetectedFile[]>`

Scans project-level OpenCode configurations at the specified path.

**Patterns Used:**
- Agents: `**/.opencode/agents/*.md`
- Skills: `**/.opencode/skills/**/SKILL.md`
- Config: `**/.opencode/opencode.json`

**Parameters:**
- `projectPath`: Root path of the project to scan
- `options`: Partial scan options (maxDepth, followSymlinks, etc.)

**Returns:** `Promise<DetectedFile[]>` - Array of detected files with metadata

#### `scanGlobalLevel(globalPath?: string, options?: Partial<ScanOptions>): Promise<DetectedFile[]>`

Scans global/user-level OpenCode configurations.

**Patterns Used:**
- Agents: `**/.config/opencode/agents/*.md`
- Skills: `**/.config/opencode/skills/**/SKILL.md`
- Config: `**/.config/opencode/opencode.json`

**Parameters:**
- `globalPath`: Path to global config directory (default: `~/.config/opencode/`)
- `options`: Partial scan options

**Returns:** `Promise<DetectedFile[]>` - Array of detected global files

#### `detectAgents(searchPath: string, scope: 'project' | 'global', options?: Partial<ScanOptions>): Promise<DetectedFile[]>`

Detects agent files using glob pattern matching and validation.

**Parameters:**
- `searchPath`: Base directory to search
- `scope`: Scope categorization for results ('project' or 'global')
- `options`: Scan options

**Returns:** `Promise<DetectedFile[]>` - Validated agent files

#### `detectSkills(searchPath: string, scope: 'project' | 'global', options?: Partial<ScanOptions>): Promise<DetectedFile[]>`

Detects skill directories using glob pattern matching.

**Parameters:**
- `searchPath`: Base directory to search
- `scope`: Scope categorization for results
- `options`: Scan options

**Returns:** `Promise<DetectedFile[]>` - Validated skill files

#### `detectConfig(searchPath: string, scope: 'project' | 'global'): Promise<DetectedFile | null>`

Detects and parses opencode.json configuration files.

**Parameters:**
- `searchPath`: Base directory to search
- `scope`: Scope categorization

**Returns:** `Promise<DetectedFile | null>` - Config file or null if not found

#### `validateFile(filePath: string, expectedType: FileType): Promise<ValidationResult>`

Validates that a file is a legitimate OpenCode configuration.

**Parameters:**
- `filePath`: Path to file to validate
- `expectedType`: Expected file type (agent, skill, config)

**Returns:** `Promise<ValidationResult>`
```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: AgentMetadata | SkillMetadata | ConfigMetadata;
}
```

#### `categorizeByScope(filePath: string): 'project' | 'global'`

Determines if a file is project-level or global-level based on its path.

**Parameters:**
- `filePath`: Absolute path to the detected file

**Returns:** `'project' | 'global'` - Scope category

**Logic:**
- Contains `/.opencode/` or ends with `/opencode.json` in project path → 'project'
- Contains `/.config/opencode/` → 'global'

---

### 3.2 Pattern Definitions (patterns.ts)

#### `AGENT_PATTERNS`

Glob patterns for agent file detection.

```typescript
export const AGENT_PATTERNS = {
  project: '**/.opencode/agents/*.md',
  global: '**/.config/opencode/agents/*.md',
} as const;
```

#### `SKILL_PATTERNS`

Glob patterns for skill file detection.

```typescript
export const SKILL_PATTERNS = {
  project: '**/.opencode/skills/**/SKILL.md',
  global: '**/.config/opencode/skills/**/SKILL.md',
} as const;
```

#### `CONFIG_PATTERNS`

Glob patterns for configuration file detection.

```typescript
export const CONFIG_PATTERNS = {
  project: '**/.opencode/opencode.json',
  global: '**/.config/opencode/opencode.json',
} as const;
```

#### `DEFAULT_IGNORE_PATTERNS`

Patterns to ignore during scanning.

```typescript
export const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.cache/**',
];
```

---

### 3.3 Validation Functions (validators.ts)

#### `validateAgentFile(filePath: string, content?: string): Promise<AgentValidationResult>`

Validates an agent markdown file has proper YAML frontmatter.

**Returns:**
```typescript
interface AgentValidationResult {
  valid: boolean;
  error?: string;
  metadata?: AgentMetadata;
}
```

**Validation Rules:**
1. File must exist and be readable
2. Content must have YAML frontmatter (--- delimiters)
3. Frontmatter must contain required fields: `name`, `description`
4. Frontmatter must be valid YAML

#### `validateSkillFile(filePath: string, content?: string): Promise<SkillValidationResult>`

Validates a skill SKILL.md file.

**Returns:**
```typescript
interface SkillValidationResult {
  valid: boolean;
  error?: string;
  metadata?: SkillMetadata;
}
```

**Validation Rules:**
1. File must exist and be readable
2. File must have .md extension
3. Content should have skill structure (has heading, description section)

#### `validateConfigFile(filePath: string, content?: string): Promise<ConfigValidationResult>`

Validates an opencode.json configuration file.

**Returns:**
```typescript
interface ConfigValidationResult {
  valid: boolean;
  error?: string;
  metadata?: ConfigMetadata;
}
```

**Validation Rules:**
1. File must exist and be readable
2. Content must be valid JSON
3. JSON must have valid structure (optional: validate against schema)

---

### 3.4 Parser Functions (parsers.ts)

#### `parseAgentFile(filePath: string): Promise<AgentMetadata | null>`

Parses an agent Markdown file to extract metadata from YAML frontmatter.

**Extracted Fields:**
- `name` (required): Agent identifier
- `description` (optional): What the agent does
- `model` (optional): Model used by agent
- `systemPrompt` (optional): System prompt content
- `tools` (optional): Array of available tools
- `mcpServers` (optional): Array of MCP server names
- `maxTurns` (optional): Maximum conversation turns
- `skills` (optional): Array of skill names this agent can use

**Returns:** `AgentMetadata` object or `null` if parsing fails

#### `parseSkillFile(filePath: string): Promise<SkillMetadata | null>`

Parses a skill SKILL.md file to extract metadata.

**Extracted Fields:**
- `name`: Skill name (from directory or first heading)
- `description` (optional): Skill description
- `version` (optional): Skill version
- `author` (optional): Skill author
- `tools` (optional): Required tools list
- `usage` (optional): Usage instructions

**Returns:** `SkillMetadata` object or `null` if parsing fails

#### `parseConfigFile(filePath: string): Promise<ConfigMetadata | null>`

Parses opencode.json to extract MCP server configuration.

**Extracted Fields:**
- `mcpServers`: Array of MCP server configurations
- `defaultModel` (optional): Default model setting
- `settings` (optional): Additional configuration settings

**Returns:** `ConfigMetadata` object or `null` if parsing fails

---

### 3.5 Glob Utilities (glob-utils.ts)

#### `globScan(pattern: string, cwd: string, options?: GlobOptions): Promise<string[]>`

Performs glob pattern matching to find files.

**Parameters:**
```typescript
interface GlobOptions {
  /** Maximum depth to search */
  maxDepth?: number;
  /** Follow symbolic links */
  followSymlinks?: boolean;
  /** Patterns to ignore */
  ignore?: string[];
  /** Working directory */
  cwd?: string;
  /** Include dotfiles */
  dot?: boolean;
  /** Absolute paths in results */
  absolute?: boolean;
}
```

**Returns:** Array of matching file paths

#### `normalizePath(filePath: string): string`

Normalizes file paths for cross-platform compatibility.

**Parameters:**
- `filePath`: Path to normalize

**Returns:** Normalized path string

#### `expandHomeDir(filePath: string): string`

Expands `~` to the user's home directory.

**Parameters:**
- `filePath`: Path that may contain `~`

**Returns:** Expanded absolute path

---

## 4. Data Types

### 4.1 Core Types

```typescript
/**
 * Options for scanning directories
 */
export interface ScanOptions {
  /** Scan scope - project, global, or both */
  scope: 'project' | 'global' | 'both';
  /** Path to project root (default: process.cwd()) */
  projectPath?: string;
  /** Path to global config directory (default: ~/.config/opencode/) */
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
  /** Patterns to ignore during scan */
  ignorePatterns?: string[];
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
  /** Number of directories scanned */
  directoriesScanned: number;
  /** Number of files scanned */
  filesScanned: number;
  /** Any errors encountered during scan */
  errors: ScanError[];
}

/**
 * A detected file with metadata
 */
export interface DetectedFile {
  /** Unique identifier for the file (hash of path) */
  id: string;
  /** Full absolute path to the file */
  path: string;
  /** File name */
  name: string;
  /** Type of file */
  type: FileType;
  /** Scope - project or global */
  scope: 'project' | 'global';
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
```

### 4.2 Metadata Types

```typescript
/**
 * Metadata extracted from agent files
 */
export interface AgentMetadata {
  /** Agent name (required) */
  name: string;
  /** Optional description */
  description?: string;
  /** Model used by agent */
  model?: string;
  /** System prompt content */
  systemPrompt?: string;
  /** Available tools */
  tools?: string[];
  /** MCP servers */
  mcpServers?: string[];
  /** Maximum conversation turns */
  maxTurns?: number;
  /** Skills this agent can use */
  skills?: string[];
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
  /** Required tools */
  tools?: string[];
  /** Usage instructions */
  usage?: string;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Server type: 'local' or 'remote' */
  type: 'local' | 'remote';
  /** For local servers: command to run */
  command?: string;
  /** For local servers: command arguments */
  args?: string[];
  /** For remote servers: URL endpoint */
  url?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** HTTP headers (for remote) */
  headers?: Record<string, string>;
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
  /** Schema version */
  $schema?: string;
}
```

### 4.3 Error Types

```typescript
/**
 * Scan error information
 */
export interface ScanError {
  /** Path where error occurred */
  path: string;
  /** Error message */
  error: string;
  /** Error code for categorization */
  code: ScanErrorCode;
  /** Timestamp of error */
  timestamp: Date;
}

/**
 * Error codes for scan errors
 */
export type ScanErrorCode = 
  | 'PERMISSION_DENIED'    // No read access to file/directory
  | 'FILE_NOT_FOUND'       // File referenced but doesn't exist
  | 'DIRECTORY_NOT_FOUND'  // Directory doesn't exist
  | 'PARSE_ERROR'          // Failed to parse file content
  | 'ACCESS_ERROR'         // General filesystem access error
  | 'VALIDATION_ERROR'     // File failed validation
  | 'SYMLINK_ERROR';       // Error following symlink

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: ScanErrorCode;
  metadata?: AgentMetadata | SkillMetadata | ConfigMetadata;
}
```

### 4.4 Utility Types

```typescript
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
  /** Include dotfiles */
  dot?: boolean;
  /** Return absolute paths */
  absolute?: boolean;
  /** Case sensitive matching */
  caseSensitive?: boolean;
}

/**
 * File system implementation interface (for testing)
 */
export interface FileSystemImplementation {
  readFile(path: string, encoding?: string): Promise<Buffer | string>;
  stat(path: string): Promise<{
    size: number;
    mtime: Date;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }>;
  access(path: string, mode?: number): Promise<void>;
  readdir(path: string): Promise<string[]>;
}

/**
 * Glob implementation interface (for testing)
 */
export interface GlobImplementation {
  glob(pattern: string, options?: GlobOptions): Promise<string[]>;
}
```

---

## 5. Error Handling

### 5.1 Error Categories and Responses

| Error Code | Scenario | Response | User Impact |
|------------|----------|----------|-------------|
| `PERMISSION_DENIED` | No read access to file/directory | Log warning, add to errors array, continue scanning | File skipped, scan continues |
| `FILE_NOT_FOUND` | File referenced in results no longer exists | Skip file, add to errors array | File skipped gracefully |
| `DIRECTORY_NOT_FOUND` | Project or global directory doesn't exist | Return empty results, add error | Empty results returned |
| `PARSE_ERROR` | Invalid YAML frontmatter or JSON | Log warning, return basic file info without metadata | File included with minimal metadata |
| `VALIDATION_ERROR` | File doesn't match expected format | Skip file, add to errors array | Invalid files excluded |
| `ACCESS_ERROR` | General filesystem access error | Log error, add to errors array, continue | Scan continues |
| `SYMLINK_ERROR` | Broken or circular symlink | Skip if followSymlinks is false, otherwise log error | Depends on followSymlinks option |

### 5.2 Error Recovery Strategies

1. **Continue on Error**: All errors are non-fatal; scanning continues
2. **Error Aggregation**: All errors collected in `ScanResult.errors` array
3. **Graceful Degradation**: Partial results returned even with errors
4. **Validation Fallthrough**: Invalid files are skipped, valid files are included

### 5.3 Error Logging

When `debug: true` is set in constructor:
- All errors logged to stderr
- Scan progress logged (directories visited, files checked)
- Validation failures logged with file paths

---

## 6. Test Scenarios

### 6.1 Unit Tests (S4-18A)

#### Scanner Class Tests

**Test 1: Basic Project-Level Scan**
```typescript
// Input: Mock filesystem with .opencode/agents/*.md files
// Expected: Returns all agent files with correct metadata
// Coverage: scan(), scanProjectLevel(), detectAgents()
```

**Test 2: Basic Global-Level Scan**
```typescript
// Input: Mock filesystem with .config/opencode/agents/*.md files
// Expected: Returns all global agent files
// Coverage: scan(), scanGlobalLevel()
```

**Test 3: Mixed Scope Scan**
```typescript
// Input: Both project and global files exist
// Expected: All files found, correctly categorized by scope
// Coverage: categorizeByScope(), scan() with scope='both'
```

**Test 4: Skill Directory Scan**
```typescript
// Input: Mock filesystem with .opencode/skills/**/SKILL.md files
// Expected: Finds all skill files in subdirectories
// Coverage: detectSkills(), glob pattern matching
```

**Test 5: Config File Detection**
```typescript
// Input: Mock filesystem with opencode.json files
// Expected: Finds and parses config files
// Coverage: detectConfig(), parseConfigFile()
```

**Test 6: Empty Directory Handling**
```typescript
// Input: Empty directory or directory with no OpenCode files
// Expected: Returns empty results, no errors
// Coverage: Edge case handling
```

**Test 7: Permission Error Handling**
```typescript
// Input: Directory with no read permissions
// Expected: Graceful handling, permission error logged, scanning continues
// Coverage: Error handling for PERMISSION_DENIED
```

**Test 8: Max Depth Enforcement**
```typescript
// Input: Deeply nested directory structure with .opencode/ at various levels
// Expected: Only files within maxDepth are found
// Coverage: maxDepth option
```

**Test 9: Symlink Handling - Follow**
```typescript
// Input: Directory with symlinks to agents/skills
// Expected: Follows symlinks and finds target files
// Coverage: followSymlinks option
```

**Test 10: Symlink Handling - Skip**
```typescript
// Input: Directory with symlinks to agents/skills
// Expected: Skips symlinks when followSymlinks=false
// Coverage: followSymlinks option
```

#### Validation Tests

**Test 11: Valid Agent File Validation**
```typescript
// Input: Markdown file with valid YAML frontmatter (name, description)
// Expected: Returns valid=true with extracted metadata
// Coverage: validateAgentFile(), parseAgentFile()
```

**Test 12: Invalid Agent File - Missing Frontmatter**
```typescript
// Input: Markdown file without YAML frontmatter
// Expected: Returns valid=false with error
// Coverage: validateAgentFile() error handling
```

**Test 13: Invalid Agent File - Invalid YAML**
```typescript
// Input: Markdown file with malformed YAML frontmatter
// Expected: Returns valid=false with PARSE_ERROR
// Coverage: YAML parsing error handling
```

**Test 14: Valid Skill File Validation**
```typescript
// Input: SKILL.md with valid structure
// Expected: Returns valid=true with metadata
// Coverage: validateSkillFile(), parseSkillFile()
```

**Test 15: Valid Config File Validation**
```typescript
// Input: Valid opencode.json with MCP servers
// Expected: Returns valid=true with MCP configurations
// Coverage: validateConfigFile(), parseConfigFile()
```

**Test 16: Invalid Config File - Malformed JSON**
```typescript
// Input: Malformed JSON file
// Expected: Returns valid=false with PARSE_ERROR
// Coverage: JSON parsing error handling
```

#### Parser Tests

**Test 17: Agent Frontmatter Parsing - All Fields**
```typescript
// Input: Agent file with all fields (name, description, model, tools, mcpServers, maxTurns, skills)
// Expected: All fields extracted correctly
// Coverage: parseAgentFile() comprehensive
```

**Test 18: Agent Frontmatter Parsing - Minimal**
```typescript
// Input: Agent file with only required fields (name, description)
// Expected: Only required fields returned, others undefined
// Coverage: parseAgentFile() minimal case
```

**Test 19: Skill Markdown Parsing**
```typescript
// Input: SKILL.md with description, usage, tools sections
// Expected: Metadata extracted from content
// Coverage: parseSkillFile()
```

**Test 20: Config JSON Parsing**
```typescript
// Input: opencode.json with mcp, defaultModel, settings
// Expected: All configurations extracted
// Coverage: parseConfigFile()
```

#### Glob Utility Tests

**Test 21: Basic Glob Pattern Matching**
```typescript
// Input: Pattern '**/*.md', directory with nested .md files
// Expected: All .md files found recursively
// Coverage: globScan()
```

**Test 22: Glob with Ignore Patterns**
```typescript
// Input: Pattern with ignore for node_modules
// Expected: node_modules contents excluded
// Coverage: globScan() with ignore option
```

**Test 23: Path Normalization**
```typescript
// Input: Various path formats (Windows/Unix, relative/absolute, with ~)
// Expected: Consistent normalized paths
// Coverage: normalizePath(), expandHomeDir()
```

### 6.2 Integration Tests

**Test 24: Full Project Scan**
```typescript
// Setup: Create temporary directory with .opencode/agents/ and .opencode/skills/
// Action: Run scanner.scan({ scope: 'project' })
// Verify: All files found with correct metadata
// Coverage: End-to-end project scanning
```

**Test 25: Full Global Scan**
```typescript
// Setup: Mock ~/.config/opencode/ structure
// Action: Run scanner.scan({ scope: 'global' })
// Verify: All global files found
// Coverage: End-to-end global scanning
```

**Test 26: Mixed Project and Global Scan**
```typescript
// Setup: Both project and global files exist
// Action: Run scanner.scan({ scope: 'both' })
// Verify: Both sets found, correctly categorized
// Coverage: Complete dual-scope scanning
```

**Test 27: Nested Project Structure**
```typescript
// Setup: Multiple nested directories with .opencode/ at various levels
// Action: Run scanner from root
// Verify: Finds files at all levels up to maxDepth
// Coverage: Deep nesting support
```

**Test 28: Error Recovery**
```typescript
// Setup: Directory with mix of valid files, invalid files, and permission errors
// Action: Run scanner
// Verify: Valid files returned, errors collected, scan completes
// Coverage: Error resilience
```

**Test 29: Real OpenCode Structure**
```typescript
// Setup: Copy actual OpenCode project structure to temp directory
// Action: Run scanner
// Verify: Detects all agents, skills, configs correctly
// Coverage: Real-world compatibility
```

### 6.3 E2E Tests (S4-18K)

**Test 30: CLI Integration - Scan Command**
```typescript
// Setup: Create test project with OpenCode files
// Action: Run CLI scan command
// Verify: Output matches expected file list
// Coverage: CLI integration
```

**Test 31: Cross-Platform Path Handling**
```typescript
// Setup: Run on Windows and Unix environments
// Action: Scan identical structures
// Verify: Results consistent across platforms
// Coverage: Cross-platform compatibility
```

**Test 32: Large Directory Performance**
```typescript
// Setup: Create directory with 1000+ files
// Action: Run scanner with timing
// Verify: Completes within acceptable time (< 5s)
// Coverage: Performance under load
```

---

## 7. Acceptance Criteria

### 7.1 Functional Requirements

- [ ] **AC-1**: Scanner uses glob patterns for OpenCode file detection
  - Patterns: `**/.opencode/agents/*.md`, `**/.opencode/skills/**/SKILL.md`, `**/.opencode/opencode.json`
  - Patterns: `**/.config/opencode/agents/*.md`, `**/.config/opencode/skills/**/SKILL.md`, `**/.config/opencode/opencode.json`

- [ ] **AC-2**: Project-level detection works correctly
  - Finds agents in `./.opencode/agents/*.md`
  - Finds skills in `./.opencode/skills/**/SKILL.md`
  - Finds config in `./.opencode/opencode.json`

- [ ] **AC-3**: Global-level detection works correctly
  - Finds agents in `~/.config/opencode/agents/*.md`
  - Finds skills in `~/.config/opencode/skills/**/SKILL.md`
  - Finds config in `~/.config/opencode/opencode.json`

- [ ] **AC-4**: Returns structured results with file paths and types
  - Result includes `files`, `agents`, `skills`, `configs` arrays
  - Each file has `id`, `path`, `name`, `type`, `scope`, `size`, `lastModified`
  - Metadata extracted and included when available

- [ ] **AC-5**: Correctly categorizes files as 'project' or 'global' scope
  - Files in `./.opencode/` → scope: 'project'
  - Files in `~/.config/opencode/` → scope: 'global'

- [ ] **AC-6**: Handles permission errors gracefully
  - Logs warning when permission denied
  - Adds error to errors array
  - Continues scanning other directories

- [ ] **AC-7**: Handles missing directories gracefully
  - Returns empty results when directory doesn't exist
  - Adds appropriate error to errors array
  - Doesn't throw exceptions

- [ ] **AC-8**: Validates agent files have proper YAML frontmatter
  - Checks for `---` delimiters
  - Validates required fields (name, description)
  - Parses optional fields (model, tools, mcpServers, etc.)

- [ ] **AC-9**: Validates skill files have proper structure
  - Checks file exists and is readable
  - Extracts metadata from content

- [ ] **AC-10**: Parses opencode.json for MCP server configurations
  - Extracts mcp server definitions
  - Handles both local and remote server types
  - Preserves environment variables and headers

### 7.2 Non-Functional Requirements

- [ ] **AC-11**: Testable with mock file systems
  - Supports dependency injection for fs and glob implementations
  - All unit tests use mocks, no real file system access
  - memfs or similar can be used for integration tests

- [ ] **AC-12**: 100% test coverage for scanner logic
  - All functions have corresponding unit tests
  - All branches covered
  - Error handling paths tested

- [ ] **AC-13**: TypeScript types fully defined
  - All public APIs have explicit return types
  - All interfaces documented with JSDoc
  - No `any` types in public interfaces

- [ ] **AC-14**: Zero false positives in scan results
  - Invalid files are filtered out during validation
  - Only legitimate OpenCode configurations returned
  - AI cross-validation ready (for S4-18C)

- [ ] **AC-15**: Performance requirements
  - Scan completes in < 5 seconds for typical projects (< 1000 files)
  - Memory usage remains reasonable (< 100MB for large projects)
  - Supports cancellation (AbortSignal)

### 7.3 Code Quality Requirements

- [ ] **AC-16**: Follows existing codebase patterns
  - Consistent with other scanner implementations
  - Uses same error handling patterns
  - Follows TDD approach (tests first)

- [ ] **AC-17**: Properly documented
  - All public methods have JSDoc comments
  - Complex logic has inline comments
  - README.md explains usage

- [ ] **AC-18**: Cross-platform compatibility
  - Works on Windows, macOS, and Linux
  - Path handling is platform-agnostic
  - Tests pass on all platforms

---

## 8. Dependencies

### 8.1 Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `glob` | ^10.x | Glob pattern matching for file discovery |
| `js-yaml` | ^4.x | YAML frontmatter parsing for agent files |
| `zod` | ^3.x | Optional: Schema validation for config files |

### 8.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `memfs` | ^4.x | Mock file system for integration tests |
| `@types/glob` | ^8.x | TypeScript types for glob |
| `@types/js-yaml` | ^4.x | TypeScript types for js-yaml |

### 8.3 Internal Dependencies

| Module | Path | Purpose |
|--------|------|---------|
| Base Types | `../types.ts` | Shared type definitions |
| Utils | `../../utils/` | Utility functions (path, logging) |

### 8.4 Sprint Dependencies

| Sprint | Component | Relationship |
|--------|-----------|--------------|
| Sprint 1 | Core parsers | Content validation logic reference |
| Sprint 3 | AI scanner patterns | Glob matching reference |
| Sprint 4 Phase 1 | Scanner UI | Consumes scan results |
| Sprint 4 Phase 1.5 | AI Content Analyzer (S4-18C) | Uses this scanner as base |

---

## 9. Implementation Notes

### 9.1 Design Principles

1. **Pure Functions**: Use pure functions where possible for testability
2. **Dependency Injection**: Accept fs and glob implementations as parameters
3. **Lazy Validation**: Use glob first to find candidates, then validate content
4. **Fail Fast**: Return partial results rather than throwing on first error
5. **Caching**: Consider caching scan results for repeated operations

### 9.2 Performance Considerations

1. **Minimize File Reads**: Only read files that match glob patterns
2. **Stream Large Directories**: Use streaming glob for very large directories
3. **Parallel Processing**: Use Promise.all for independent validation operations
4. **Abort Support**: Accept AbortSignal for cancellation support

### 9.3 Security Considerations

1. **Path Traversal**: Validate all paths to prevent directory traversal attacks
2. **Symlinks**: Only follow symlinks when explicitly enabled
3. **Sensitive Data**: Don't log file contents or sensitive paths
4. **Permissions**: Respect file system permissions, don't try to escalate

### 9.4 Testing Strategy

1. **Unit Tests**: Mock all dependencies, test in isolation
2. **Integration Tests**: Use memfs for realistic file system simulation
3. **E2E Tests**: Test with actual OpenCode project structures
4. **Cross-Platform Tests**: Run tests on Windows, macOS, and Linux

---

## 10. Related Documents

- [Implementation Plan](../../../../../docs/implementation-plan.md) - Sprint 4 Phase 1.5
- [OpenCode Structure Reference](../../../../../docs/tool-structure-opencode.md) - OpenCode configuration format
- [Scanner Types](../types.ts) - Shared type definitions
- [AI Content Analyzer SPEC](../ai-content-analyzer/SPEC.md) - Related component (S4-18C)

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-01 | AI Engineer | Initial specification for S4-18A/B |

---

*Document End - AI Directory Scanner Specification v1.0*
