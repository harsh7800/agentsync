# Smart Agent Scanner SPEC

## Overview

The Smart Agent Scanner is a core component of the AI-Assisted Interactive Migration Engine (Sprint 3). It provides intelligent agent detection using glob/grep pattern matching, categorizing found agents as "local" (project-specific) or "system" (user-wide). The scanner supports two modes: Manual (user-controlled) and AI-Assisted (autonomous pattern matching).

## Files

- `packages/core/src/ai-scanner/scanner.ts` - Core scanner engine with glob/grep patterns
- `packages/core/src/ai-scanner/types.ts` - TypeScript interfaces and types
- `packages/core/src/ai-scanner/patterns.ts` - Tool-specific glob patterns
- `packages/core/src/ai-scanner/categorizer.ts` - Local vs System categorization logic
- `packages/core/src/__tests__/ai-scanner.spec.ts` - Test suite

## Functions/Methods

### Scanner Class

#### `scan(options: ScanOptions): Promise<ScanResult>`
Main entry point for agent scanning.

**Parameters:**
- `options.scope`: 'local' | 'system' | 'both' - Scan scope
- `options.depth`: number - Directory depth limit (default: 3)
- `options.patterns`: string[] - Custom glob patterns (optional)
- `options.tools`: string[] - Tools to scan for (default: all)

**Returns:** `ScanResult` with found agents categorized

#### `detectAgents(tool: string, paths: string[]): Promise<DetectedAgent[]>`
Detects agents for a specific tool in given paths.

**Parameters:**
- `tool`: Tool identifier (e.g., 'opencode', 'claude')
- `paths`: Array of paths to search

**Returns:** Array of detected agents with metadata

#### `analyzeContent(filePath: string): Promise<AgentInfo | null>`
Analyzes file content to determine agent type and metadata.

**Parameters:**
- `filePath`: Path to file to analyze

**Returns:** AgentInfo if valid agent, null otherwise

### Categorizer

#### `categorize(agents: DetectedAgent[]): CategorizedAgents`
Categorizes agents as local or system-wide.

### ManualScanController

#### `scanWithUserOptions(options: ManualScanOptions): Promise<ScanResult>`
Performs a user-controlled scan with specific options.

**Parameters:**
- `options.scope`: 'current' | 'home' | 'custom' - Scan scope
- `options.depth`: number - User-specified depth (1-10)
- `options.includePatterns`: string[] - User-specified include patterns
- `options.excludePatterns`: string[] - User-specified exclude patterns
- `options.tools`: string[] - Specific tools to scan
- `options.respectGitignore`: boolean - Whether to respect .gitignore

**Returns:** `ScanResult` with found agents

#### `validateScanOptions(options: ManualScanOptions): ValidationResult`
Validates user-provided scan options before execution.

**Parameters:**
- `options`: ManualScanOptions to validate

**Returns:** ValidationResult with isValid and errors array

#### `suggestScanDepth(path: string): number`
Suggests optimal scan depth based on directory structure.

**Parameters:**
- `path`: Directory path to analyze

**Returns:** Suggested depth (1-10)

**Parameters:**
- `agents`: Array of detected agents

**Returns:** Object with `local` and `system` arrays

## Data Types

```typescript
interface ScanOptions {
  scope: 'local' | 'system' | 'both';
  depth?: number;
  patterns?: string[];
  tools?: string[];
  cwd?: string;
}

interface ScanResult {
  agents: CategorizedAgents;
  duration: number;
  filesScanned: number;
  errors: string[];
}

interface DetectedAgent {
  id: string;
  name: string;
  tool: string;
  path: string;
  type: 'agent' | 'skill' | 'mcp' | 'config';
  category: 'local' | 'system';
  size: number;
  lastModified: Date;
  metadata?: Record<string, unknown>;
}

interface CategorizedAgents {
  local: DetectedAgent[];
  system: DetectedAgent[];
}

interface AgentInfo {
  name: string;
  type: 'agent' | 'skill' | 'mcp' | 'config';
  tool: string;
  metadata: Record<string, unknown>;
}
```

## Error Handling

| Error | Response |
|-------|----------|
| Invalid tool name | Throw `ValidationError` |
| Path not accessible | Log warning, continue scanning |
| Permission denied | Log warning, skip path |
| Pattern syntax error | Throw `PatternError` with details |
| File read error | Log warning, skip file |

## Test Scenarios

### Unit Tests

1. **Basic Scan**
   - Scan current directory
   - Expect: Returns agents found in default patterns

2. **Local vs System Categorization**
   - Agents in `./agents/` → local
   - Agents in `~/.config/` → system
   - Expect: Correct categorization

3. **Tool-Specific Patterns**
   - OpenCode: `**/*.agent.md`, `.opencode/**/*.json`
   - Claude: `.claude/settings.json`, `.claude.json`
   - Expect: Finds correct file types

4. **Depth Control**
   - depth=1: Only immediate subdirectories
   - depth=5: Deep scan
   - Expect: Respects depth limit

5. **Content Analysis**
   - Read agent file content
   - Detect type from headers/structure
   - Expect: Correct agent type detection

6. **Error Handling**
   - Permission denied paths
   - Broken symlinks
   - Expect: Graceful handling, no crashes

### Integration Tests

1. **Full Scan Flow**
   - Create test directory with agents
   - Run scanner
   - Expect: All agents found and categorized

2. **Mixed Local/System**
   - Local: `./agents/test.agent.md`
   - System: `~/.config/opencode/config.json`
   - Expect: Both found, correctly categorized

3. **Custom Patterns**
   - Provide custom glob pattern
   - Expect: Only matches custom pattern

## Acceptance Criteria

- [ ] Scanner can detect agents using glob patterns
- [ ] Supports local vs system categorization
- [ ] Handles all 5 tools (claude, opencode, gemini, cursor, copilot)
- [ ] Configurable scan depth (default: 3 levels)
- [ ] Returns scan duration and statistics
- [ ] Gracefully handles permission errors
- [ ] Content analysis identifies agent types
- [ ] 100% test coverage for scanner logic
- [ ] TypeScript types fully defined
- [ ] Documentation complete

## Dependencies

- Sprint 1: Core parsers (for content analysis)
- Sprint 2: File operations (for reading files)
- Node.js fs/promises for file system access
- Glob library for pattern matching (if needed)

## Notes

- Use pure functions for testability
- Cache scan results for performance
- Respect .gitignore patterns
- Support both sync and async scanning
- Minimize file reads for performance
