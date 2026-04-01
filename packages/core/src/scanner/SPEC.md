# AI Directory Scanner SPEC

## Overview

The AI Directory Scanner is a specialized scanning component for Sprint 4 Phase 1.5 that provides intelligent, pattern-based detection of OpenCode configurations using glob/grep. It addresses the false positive issues in the current scanner by specifically targeting OpenCode's actual directory structure and file patterns. The scanner differentiates between project-level (./.opencode/) and global (~/.config/opencode/) configurations, returning structured results with accurate file type detection.

## Problem Statement

Current scanner returns false positives and doesn't properly detect OpenCode's structure:
- Agents are Markdown files with YAML frontmatter in `./.opencode/agents/*.md`
- Skills are directories containing `./.opencode/skills/**/SKILL.md`
- MCP servers are defined in `~/.config/opencode/opencode.json`
- Need to distinguish between project-level and global scopes

## Files

- `packages/core/src/scanner/ai-directory-scanner.ts` - Core scanner implementation with glob patterns
- `packages/core/src/scanner/types.ts` - TypeScript interfaces for scan results and options
- `packages/core/src/scanner/patterns.ts` - OpenCode-specific glob patterns (agents, skills, config)
- `packages/core/src/__tests__/ai-directory-scanner.spec.ts` - Comprehensive test suite

## Functions/Methods

### AIDirectoryScanner Class

#### `scan(options: ScanOptions): Promise<ScanResult>`
Main entry point for directory scanning.

**Parameters:**
- `options.scope`: 'project' | 'global' | 'both' - Scan scope (default: 'both')
- `options.projectPath`: string - Project root path (default: process.cwd())
- `options.globalPath`: string - Global config path (default: ~/.config/opencode/)
- `options.includeAgents`: boolean - Scan for agent files (default: true)
- `options.includeSkills`: boolean - Scan for skill directories (default: true)
- `options.includeConfig`: boolean - Scan for opencode.json (default: true)
- `options.followSymlinks`: boolean - Follow symbolic links (default: false)
- `options.maxDepth`: number - Maximum directory depth (default: 10)

**Returns:** `ScanResult` with categorized files

#### `scanProjectLevel(projectPath: string): Promise<DetectedFile[]>`
Scans project-level OpenCode configurations.

**Patterns:**
- Agents: `**/.opencode/agents/*.md`
- Skills: `**/.opencode/skills/**/SKILL.md`
- Config: `**/opencode.json` (within .opencode/)

**Parameters:**
- `projectPath`: Root path of the project to scan

**Returns:** Array of detected files with metadata

#### `scanGlobalLevel(globalPath: string): Promise<DetectedFile[]>`
Scans global/user-level OpenCode configurations.

**Patterns:**
- Agents: `**/.config/opencode/agents/*.md`
- Skills: `**/.config/opencode/skills/**/SKILL.md`
- Config: `**/opencode.json` (within .config/opencode/)

**Parameters:**
- `globalPath`: Path to global config directory (usually ~/.config/)

**Returns:** Array of detected files with metadata

#### `detectAgents(searchPath: string): Promise<DetectedFile[]>`
Detects agent files using glob pattern matching.

**Pattern:** `**/.opencode/agents/*.md` or `**/.config/opencode/agents/*.md`

**Parameters:**
- `searchPath`: Base directory to search

**Returns:** Array of detected agent files

#### `detectSkills(searchPath: string): Promise<DetectedFile[]>`
Detects skill directories using glob pattern matching.

**Pattern:** `**/.opencode/skills/**/SKILL.md` or `**/.config/opencode/skills/**/SKILL.md`

**Parameters:**
- `searchPath`: Base directory to search

**Returns:** Array of detected skill files

#### `detectConfig(searchPath: string): Promise<DetectedFile | null>`
Detects opencode.json configuration files.

**Pattern:** `**/opencode.json`

**Parameters:**
- `searchPath`: Base directory to search

**Returns:** Detected config file or null

#### `validateFile(filePath: string, expectedType: FileType): Promise<boolean>`
Validates that a file is a legitimate OpenCode configuration.

**Parameters:**
- `filePath`: Path to file to validate
- `expectedType`: Expected file type (agent, skill, config)

**Returns:** True if file is valid, false otherwise

#### `categorizeByScope(filePath: string): 'project' | 'global'`
Determines if a file is project-level or global-level.

**Parameters:**
- `filePath`: Path to the detected file

**Returns:** 'project' or 'global' category

### Utility Functions

#### `globScan(pattern: string, cwd: string, options?: GlobOptions): Promise<string[]>`
Performs glob pattern matching to find files.

**Parameters:**
- `pattern`: Glob pattern (e.g., `**/.opencode/agents/*.md`)
- `cwd`: Working directory for the search
- `options`: Additional glob options (depth, followSymlinks, etc.)

**Returns:** Array of matching file paths

#### `parseAgentFile(filePath: string): Promise<AgentMetadata | null>`
Parses an agent Markdown file to extract metadata from YAML frontmatter.

**Parameters:**
- `filePath`: Path to agent .md file

**Returns:** Agent metadata or null if invalid

#### `parseSkillFile(filePath: string): Promise<SkillMetadata | null>`
Parses a skill SKILL.md file to extract metadata.

**Parameters:**
- `filePath`: Path to skill SKILL.md file

**Returns:** Skill metadata or null if invalid

#### `parseConfigFile(filePath: string): Promise<ConfigMetadata | null>`
Parses opencode.json to extract MCP server configuration.

**Parameters:**
- `filePath`: Path to opencode.json

**Returns:** Config metadata or null if invalid

## Data Types

```typescript
interface ScanOptions {
  scope: 'project' | 'global' | 'both';
  projectPath?: string;
  globalPath?: string;
  includeAgents?: boolean;
  includeSkills?: boolean;
  includeConfig?: boolean;
  followSymlinks?: boolean;
  maxDepth?: number;
}

interface ScanResult {
  files: DetectedFile[];
  agents: DetectedFile[];
  skills: DetectedFile[];
  configs: DetectedFile[];
  projectLevel: DetectedFile[];
  globalLevel: DetectedFile[];
  duration: number;
  filesScanned: number;
  errors: ScanError[];
}

interface DetectedFile {
  id: string;
  path: string;
  name: string;
  type: FileType;
  scope: 'project' | 'global';
  size: number;
  lastModified: Date;
  metadata?: AgentMetadata | SkillMetadata | ConfigMetadata;
}

type FileType = 'agent' | 'skill' | 'config';

interface AgentMetadata {
  name: string;
  description?: string;
  model?: string;
  systemPrompt?: string;
  tools?: string[];
  mcpServers?: string[];
}

interface SkillMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
}

interface ConfigMetadata {
  mcpServers: MCPServerConfig[];
  defaultModel?: string;
  settings?: Record<string, unknown>;
}

interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface ScanError {
  path: string;
  error: string;
  code: 'PERMISSION_DENIED' | 'FILE_NOT_FOUND' | 'PARSE_ERROR' | 'ACCESS_ERROR';
}

interface GlobOptions {
  maxDepth?: number;
  followSymlinks?: boolean;
  ignore?: string[];
  cwd?: string;
}
```

## Error Handling

| Error | Response |
|-------|----------|
| Permission denied | Log warning, add to errors array, continue scanning |
| File not found | Skip file, add to errors array |
| Directory doesn't exist | Return empty results, add to errors array |
| Invalid YAML frontmatter | Log warning, return basic metadata |
| Invalid JSON in config | Log warning, add to errors array |
| Broken symlink | Skip unless followSymlinks is true |
| Circular symlink | Detect and prevent infinite loops |

## Test Scenarios

### Unit Tests

1. **Glob Pattern Matching - Agents**
   - Input: Mock fs with `./.opencode/agents/*.md` files
   - Expected: Finds all agent files matching pattern

2. **Glob Pattern Matching - Skills**
   - Input: Mock fs with `./.opencode/skills/**/SKILL.md` files
   - Expected: Finds all skill files matching pattern

3. **Glob Pattern Matching - Config**
   - Input: Mock fs with `./opencode.json` and `~/.config/opencode/opencode.json`
   - Expected: Finds all config files

4. **Project-Level vs Global Scope Detection**
   - Input: Files in both `./.opencode/` and `~/.config/opencode/`
   - Expected: Correctly categorizes each file's scope

5. **Error Handling - Inaccessible Directories**
   - Input: Directory with no read permissions
   - Expected: Graceful handling, permission error logged, scanning continues

6. **Empty Directory Handling**
   - Input: Empty directory or directory with no OpenCode files
   - Expected: Returns empty results array

7. **Multiple Project Detection in Subdirectories**
   - Input: Root with multiple subprojects, each with .opencode/
   - Expected: Finds all agent/skill files across all subdirectories

8. **Agent File Validation**
   - Input: Markdown file with valid YAML frontmatter
   - Expected: Returns true, extracts metadata

9. **Agent File Validation - Invalid**
   - Input: Markdown file without YAML frontmatter
   - Expected: Returns false or basic metadata

10. **Skill File Validation**
    - Input: SKILL.md with valid structure
    - Expected: Returns true, extracts metadata

11. **Config File Parsing**
    - Input: Valid opencode.json with MCP servers
    - Expected: Returns MCP server configurations

12. **Symlink Handling**
    - Input: Directory with symlinks to agents/skills
    - Expected: Follows symlinks when enabled, skips when disabled

### Integration Tests

1. **Full Project Scan**
   - Create temporary directory with .opencode/agents/ and .opencode/skills/
   - Run scanner
   - Expected: All files found with correct metadata

2. **Full Global Scan**
   - Mock ~/.config/opencode/ structure
   - Run scanner
   - Expected: All global files found

3. **Mixed Project and Global Scan**
   - Both project and global files exist
   - Run scanner with scope='both'
   - Expected: Both sets found, correctly categorized

4. **Nested Project Structure**
   - Multiple nested directories with .opencode/
   - Run scanner
   - Expected: Finds files at all levels up to maxDepth

### E2E Tests

1. **Real OpenCode Project Detection**
   - Use actual OpenCode project structure
   - Run scanner
   - Expected: Matches actual OpenCode file layout

## Acceptance Criteria

- [ ] Scanner uses glob patterns for OpenCode file detection
- [ ] Project-level detection: `./.opencode/agents/*.md` and `./.opencode/skills/**/SKILL.md`
- [ ] Global-level detection: `~/.config/opencode/agents/*.md` and `~/.config/opencode/skills/**/SKILL.md`
- [ ] Config detection: `**/opencode.json` files
- [ ] Returns structured results with file paths and types
- [ ] Correctly categorizes files as 'project' or 'global' scope
- [ ] Handles permission errors gracefully (logs, continues)
- [ ] Handles missing directories gracefully
- [ ] Validates agent files have proper YAML frontmatter
- [ ] Validates skill files have proper structure
- [ ] Parses opencode.json for MCP server configurations
- [ ] Testable with mock file systems
- [ ] 100% test coverage for scanner logic
- [ ] TypeScript types fully defined
- [ ] Zero false positives in scan results

## Dependencies

- Sprint 1: Core parsers (for content validation)
- Sprint 3: AI scanner patterns (for glob matching reference)
- Node.js fs/promises for file system access
- glob library for pattern matching (or custom implementation)
- js-yaml for YAML frontmatter parsing

## Patterns Reference

### Agent Files
```
./.opencode/agents/*.md
~/.config/opencode/agents/*.md
```

### Skill Files
```
./.opencode/skills/**/SKILL.md
~/.config/opencode/skills/**/SKILL.md
```

### Config Files
```
./opencode.json
./.opencode/opencode.json
~/.config/opencode/opencode.json
```

## Notes

- Use pure functions for testability with dependency injection
- Support mock file systems for unit testing (memfs or similar)
- Cache scan results for performance in repeated scans
- Minimize file reads - use glob first, then validate
- Cross-platform path handling (Windows/Unix)
- Respect .gitignore when scanning project directories
- AI cross-validation to eliminate false positives (Phase 1.5 Task S4-18C)
