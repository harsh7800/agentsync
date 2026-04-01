# AI Directory Scanner - Test Cases

**Feature ID:** S4-18A/B  
**Package:** packages/core  
**Phase:** Sprint 4 Phase 1.5  
**Status:** Test Design Complete  

---

## Table of Contents

1. [AIDirectoryScanner Class Tests](#1-aidirectoryscanner-class-tests)
2. [Pattern Matching Tests](#2-pattern-matching-tests)
3. [Error Handling Tests](#3-error-handling-tests)
4. [Edge Case Tests](#4-edge-case-tests)
5. [Integration Tests](#5-integration-tests)

---

## 1. AIDirectoryScanner Class Tests

### ADS-SCAN-001: Constructor with Default Options

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-001 |
| **Description** | Verify AIDirectoryScanner initializes with default options |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner();
```

**Expected Output/Behavior:**
- Scanner instance created successfully
- Uses default glob implementation
- Uses default file system implementation
- Debug logging disabled by default
- All internal state initialized

---

### ADS-SCAN-002: Constructor with Custom Options

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-002 |
| **Description** | Verify AIDirectoryScanner accepts custom implementations and options |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const mockGlob = { glob: vi.fn() };
const mockFs = { readFile: vi.fn(), stat: vi.fn(), access: vi.fn(), readdir: vi.fn() };
const scanner = new AIDirectoryScanner({
  globImpl: mockGlob,
  fsImpl: mockFs,
  debug: true
});
```

**Expected Output/Behavior:**
- Scanner instance created with injected dependencies
- Custom glob implementation stored
- Custom fs implementation stored
- Debug mode enabled

---

### ADS-SCAN-003: Scan with Default Options (Both Scopes)

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-003 |
| **Description** | Verify scan() with scope='both' finds both project and global files |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock filesystem structure:
// ./.opencode/agents/my-agent.md
// ~/.config/opencode/agents/global-agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'both' });
```

**Expected Output/Behavior:**
- Returns ScanResult with all detected files
- `result.files` contains both project and global files
- `result.agents` contains agent files from both scopes
- `result.projectLevel` contains only project files
- `result.globalLevel` contains only global files
- `result.errors` is empty (no errors)
- `result.duration` is populated (non-negative number)

---

### ADS-SCAN-004: Scan with Project Scope Only

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-004 |
| **Description** | Verify scan() with scope='project' only searches project directories |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: './my-project' });
```

**Expected Output/Behavior:**
- Only searches `./my-project/.opencode/` directory
- Does not search global config directory
- Returns only project-level files
- `result.globalLevel` array is empty
- Glob patterns called with project path only

---

### ADS-SCAN-005: Scan with Global Scope Only

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-005 |
| **Description** | Verify scan() with scope='global' only searches global directories |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'global', globalPath: '~/.config/opencode' });
```

**Expected Output/Behavior:**
- Only searches `~/.config/opencode/` directory
- Does not search project directory
- Returns only global-level files
- `result.projectLevel` array is empty
- Glob patterns called with global path only

---

### ADS-SCAN-006: Scan with Custom Glob Patterns

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-006 |
| **Description** | Verify scan() accepts custom glob patterns via options |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({
  scope: 'project',
  includeAgents: true,
  includeSkills: true,
  includeConfig: true,
  maxDepth: 5,
  followSymlinks: false,
  ignorePatterns: ['**/test/**', '**/temp/**']
});
```

**Expected Output/Behavior:**
- Custom patterns applied to glob calls
- `maxDepth: 5` passed to glob options
- `followSymlinks: false` respected
- Custom ignore patterns merged with defaults
- All file types included in results

---

### ADS-SCAN-007: scanProjectLevel Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-007 |
| **Description** | Verify scanProjectLevel() finds only project-level files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const files = await scanner.scanProjectLevel('./my-project', { maxDepth: 10 });
```

**Expected Output/Behavior:**
- Returns array of DetectedFile objects
- All files have `scope: 'project'`
- Searches for agents, skills, and config files
- Uses correct patterns:
  - `**/.opencode/agents/*.md`
  - `**/.opencode/skills/**/SKILL.md`
  - `**/.opencode/opencode.json`

---

### ADS-SCAN-008: scanGlobalLevel Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-008 |
| **Description** | Verify scanGlobalLevel() finds only global-level files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const files = await scanner.scanGlobalLevel('~/.config/opencode', { maxDepth: 10 });
```

**Expected Output/Behavior:**
- Returns array of DetectedFile objects
- All files have `scope: 'global'`
- Searches for agents, skills, and config files
- Uses correct patterns:
  - `**/.config/opencode/agents/*.md`
  - `**/.config/opencode/skills/**/SKILL.md`
  - `**/.config/opencode/opencode.json`

---

### ADS-SCAN-009: detectAgents Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-009 |
| **Description** | Verify detectAgents() finds and validates agent files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockGlob.glob.mockResolvedValue([
  '/project/.opencode/agents/my-agent.md',
  '/project/.opencode/agents/another-agent.md'
]);
// Mock valid agent files with YAML frontmatter
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const agents = await scanner.detectAgents('/project', 'project', {});
```

**Expected Output/Behavior:**
- Returns array of DetectedFile objects with type='agent'
- Each file has scope='project'
- Metadata extracted from YAML frontmatter
- Invalid agent files filtered out

---

### ADS-SCAN-010: detectSkills Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-010 |
| **Description** | Verify detectSkills() finds skill files in nested directories |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockGlob.glob.mockResolvedValue([
  '/project/.opencode/skills/eslint/SKILL.md',
  '/project/.opencode/skills/prettier/SKILL.md',
  '/project/.opencode/skills/nested/deep/SKILL.md'
]);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const skills = await scanner.detectSkills('/project', 'project', {});
```

**Expected Output/Behavior:**
- Returns array of DetectedFile objects with type='skill'
- Finds SKILL.md files at any depth under .opencode/skills/
- Each file has scope='project'
- Skill metadata extracted from file content

---

### ADS-SCAN-011: detectConfig Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-011 |
| **Description** | Verify detectConfig() finds and parses opencode.json |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockGlob.glob.mockResolvedValue(['/project/.opencode/opencode.json']);
// Mock valid opencode.json with MCP servers
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const config = await scanner.detectConfig('/project', 'project');
```

**Expected Output/Behavior:**
- Returns DetectedFile object with type='config'
- Config file has scope='project'
- MCP server configurations parsed and stored in metadata
- Returns null if no config file found

---

### ADS-SCAN-012: validateFile Method - Valid Agent

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-012 |
| **Description** | Verify validateFile() correctly validates a valid agent file |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const filePath = '/project/.opencode/agents/valid-agent.md';
// Mock file content with valid YAML frontmatter:
// ---
// name: test-agent
// description: Test agent description
// ---
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.validateFile(filePath, 'agent');
```

**Expected Output/Behavior:**
- Returns ValidationResult with `valid: true`
- Metadata extracted with name and description
- No error message

---

### ADS-SCAN-013: validateFile Method - Invalid Agent

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-013 |
| **Description** | Verify validateFile() rejects agent file without YAML frontmatter |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const filePath = '/project/.opencode/agents/invalid-agent.md';
// Mock file content without YAML frontmatter (plain markdown)
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.validateFile(filePath, 'agent');
```

**Expected Output/Behavior:**
- Returns ValidationResult with `valid: false`
- Error message indicates missing frontmatter
- No metadata returned

---

### ADS-SCAN-014: categorizeByScope Method

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-014 |
| **Description** | Verify categorizeByScope() correctly categorizes file paths |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const projectFile1 = '/home/user/project/.opencode/agents/agent.md';
const projectFile2 = '/home/user/project/.opencode/opencode.json';
const globalFile1 = '/home/user/.config/opencode/agents/global-agent.md';
const globalFile2 = '/home/user/.config/opencode/opencode.json';
const scanner = new AIDirectoryScanner();
```

**Expected Output/Behavior:**
- `categorizeByScope(projectFile1)` returns 'project'
- `categorizeByScope(projectFile2)` returns 'project'
- `categorizeByScope(globalFile1)` returns 'global'
- `categorizeByScope(globalFile2)` returns 'global'

---

### ADS-SCAN-015: Scan with Disabled File Types

| Field | Value |
|-------|-------|
| **Test ID** | ADS-SCAN-015 |
| **Description** | Verify scan() respects includeAgents/includeSkills/includeConfig options |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({
  scope: 'project',
  includeAgents: true,
  includeSkills: false,
  includeConfig: false
});
```

**Expected Output/Behavior:**
- Only agent files scanned and returned
- `result.skills` is empty array
- `result.configs` is empty array
- `result.agents` contains only agent files
- Glob patterns for skills and config not called

---

## 2. Pattern Matching Tests

### ADS-PAT-001: Project-Level Agent Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-001 |
| **Description** | Verify glob pattern matches project-level agent files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.opencode/agents/*.md';
// Mock filesystem with:
// - /project/.opencode/agents/agent1.md
// - /project/.opencode/agents/agent2.md
// - /project/.opencode/agents/README.md
// - /project/.opencode/other/file.md (should NOT match)
// - /project/agents/file.md (should NOT match)
```

**Expected Output/Behavior:**
- Matches `agent1.md`, `agent2.md`, `README.md` in .opencode/agents/
- Does NOT match files outside .opencode/agents/
- Returns correct file paths

---

### ADS-PAT-002: Global-Level Agent Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-002 |
| **Description** | Verify glob pattern matches global-level agent files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.config/opencode/agents/*.md';
// Mock filesystem with:
// - ~/.config/opencode/agents/global-agent.md
// - ~/.config/opencode/agents/dev-agent.md
// - ~/.config/opencode/other/file.md (should NOT match)
```

**Expected Output/Behavior:**
- Matches `.md` files in `.config/opencode/agents/`
- Does NOT match files in other directories
- Handles home directory expansion correctly

---

### ADS-PAT-003: Project-Level Skill Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-003 |
| **Description** | Verify glob pattern matches SKILL.md files at any depth |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.opencode/skills/**/SKILL.md';
// Mock filesystem with:
// - /project/.opencode/skills/eslint/SKILL.md
// - /project/.opencode/skills/prettier/SKILL.md
// - /project/.opencode/skills/deep/nested/skill/SKILL.md
// - /project/.opencode/skills/other.md (should NOT match)
```

**Expected Output/Behavior:**
- Matches SKILL.md files at any depth under .opencode/skills/
- Does NOT match files with different names
- Handles deeply nested skill directories

---

### ADS-PAT-004: Global-Level Skill Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-004 |
| **Description** | Verify glob pattern matches global skill files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.config/opencode/skills/**/SKILL.md';
// Mock filesystem with global skills
```

**Expected Output/Behavior:**
- Matches SKILL.md files in `.config/opencode/skills/` subdirectories
- Correctly handles nested global skill directories

---

### ADS-PAT-005: Project-Level Config Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-005 |
| **Description** | Verify glob pattern matches project opencode.json files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.opencode/opencode.json';
// Mock filesystem with:
// - /project/.opencode/opencode.json
// - /project/.opencode/sub/opencode.json
// - /project/opencode.json (should NOT match)
```

**Expected Output/Behavior:**
- Matches opencode.json in .opencode directories
- Handles nested .opencode directories
- Does NOT match files outside .opencode/

---

### ADS-PAT-006: Global-Level Config Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-006 |
| **Description** | Verify glob pattern matches global opencode.json |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
const pattern = '**/.config/opencode/opencode.json';
// Mock filesystem with ~/.config/opencode/opencode.json
```

**Expected Output/Behavior:**
- Matches opencode.json in `.config/opencode/`
- Does NOT match other locations

---

### ADS-PAT-007: Default Ignore Patterns

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-007 |
| **Description** | Verify default ignore patterns exclude build artifacts |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
const ignorePatterns = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.cache/**',
];
// Mock filesystem with files in node_modules, .git, dist, etc.
```

**Expected Output/Behavior:**
- Files in node_modules are excluded
- Files in .git are excluded
- Files in dist/build directories are excluded
- Other files are included

---

### ADS-PAT-008: Custom Ignore Patterns

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-008 |
| **Description** | Verify custom ignore patterns are applied |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
const customIgnores = ['**/test/**', '**/temp/**', '**/*.bak'];
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({
  scope: 'project',
  ignorePatterns: customIgnores
});
```

**Expected Output/Behavior:**
- Custom ignore patterns merged with defaults
- Files matching custom patterns are excluded
- Default patterns still applied

---

### ADS-PAT-009: Multiple Pattern Matching

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-009 |
| **Description** | Verify scanner matches multiple file types in one scan |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock filesystem with:
// - /project/.opencode/agents/agent1.md
// - /project/.opencode/agents/agent2.md
// - /project/.opencode/skills/eslint/SKILL.md
// - /project/.opencode/opencode.json
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- All agent files found
- All skill files found
- Config file found
- Each file correctly categorized by type
- No duplicate entries

---

### ADS-PAT-010: Pattern with Max Depth

| Field | Value |
|-------|-------|
| **Test ID** | ADS-PAT-010 |
| **Description** | Verify maxDepth option limits pattern matching depth |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem structure:
// /project/.opencode/agents/shallow.md (depth 2)
// /project/.opencode/subdir/subdir2/agents/deep.md (depth 4)
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', maxDepth: 3 });
```

**Expected Output/Behavior:**
- Files within maxDepth are found
- Files beyond maxDepth are excluded
- maxDepth passed to glob implementation

---

## 3. Error Handling Tests

### ADS-ERR-001: Permission Denied Error

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-001 |
| **Description** | Verify scanner handles permission errors gracefully |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));
mockGlob.glob.mockRejectedValue(new Error('EACCES: permission denied'));
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- Scan does not throw exception
- Error added to `result.errors` array
- Error has code: 'PERMISSION_DENIED'
- Error includes path and message
- Scanning continues with other directories
- Returns partial results if available

---

### ADS-ERR-002: Non-Existent Directory

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-002 |
| **Description** | Verify scanner handles non-existent directories gracefully |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: '/nonexistent' });
```

**Expected Output/Behavior:**
- Scan does not throw exception
- Error added to `result.errors` array
- Error has code: 'DIRECTORY_NOT_FOUND'
- Returns empty results (empty arrays)
- Scan completes successfully

---

### ADS-ERR-003: Invalid Glob Pattern

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-003 |
| **Description** | Verify scanner handles invalid glob patterns |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Inject glob implementation that throws on invalid pattern
mockGlob.glob.mockImplementation((pattern) => {
  if (pattern.includes('[') && !pattern.includes(']')) {
    throw new Error('Invalid glob pattern: unclosed bracket');
  }
  return Promise.resolve([]);
});
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Error caught and added to errors array
- Scan continues with other patterns
- Error has descriptive message

---

### ADS-ERR-004: Empty Directory

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-004 |
| **Description** | Verify scanner returns empty results for empty directory |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
mockGlob.glob.mockResolvedValue([]); // Empty results
mockFs.readdir.mockResolvedValue([]);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: '/empty-project' });
```

**Expected Output/Behavior:**
- Returns empty ScanResult
- `result.files` is empty array
- `result.agents`, `result.skills`, `result.configs` are empty
- `result.errors` is empty
- Scan completes successfully

---

### ADS-ERR-005: Deep Nesting Handling

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-005 |
| **Description** | Verify scanner handles deeply nested directory structures |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Create deeply nested structure: /a/b/c/d/e/f/g/h/i/j/.opencode/agents/agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', maxDepth: 15 });
```

**Expected Output/Behavior:**
- Finds agent file at deep nesting level
- No stack overflow or performance issues
- Path correctly normalized

---

### ADS-ERR-006: File Not Found During Validation

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-006 |
| **Description** | Verify validation handles missing files |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockGlob.glob.mockResolvedValue(['/project/.opencode/agents/deleted.md']);
mockFs.readFile.mockRejectedValue(new Error('ENOENT: file not found'));
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- File not found error added to errors array
- Error has code: 'FILE_NOT_FOUND'
- Scan continues with other files
- File excluded from results

---

### ADS-ERR-007: Parse Error - Invalid YAML

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-007 |
| **Description** | Verify validation handles invalid YAML frontmatter |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockFs.readFile.mockResolvedValue(`
---
name: test-agent
invalid yaml: [unclosed bracket
description: Test
---
# Agent Content
`);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const validation = await scanner.validateFile('/path/to/agent.md', 'agent');
```

**Expected Output/Behavior:**
- Returns `valid: false`
- Error has code: 'PARSE_ERROR'
- Error message indicates YAML parsing failed
- No metadata returned

---

### ADS-ERR-008: Parse Error - Invalid JSON

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-008 |
| **Description** | Verify validation handles invalid JSON config |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
mockFs.readFile.mockResolvedValue(`
{
  "mcpServers": [
    { "name": "test", invalid json
  ]
}
`);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const validation = await scanner.validateFile('/path/to/opencode.json', 'config');
```

**Expected Output/Behavior:**
- Returns `valid: false`
- Error has code: 'PARSE_ERROR'
- Error message indicates JSON parsing failed
- No metadata returned

---

### ADS-ERR-009: Validation Error - Missing Required Fields

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-009 |
| **Description** | Verify validation rejects agent files missing required fields |
| **Test Type** | Unit |
| **Priority** | High |

**Input/Setup:**
```typescript
// Agent file with missing 'name' field
mockFs.readFile.mockResolvedValue(`
---
description: Test agent without name
---
# Agent Content
`);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const validation = await scanner.validateFile('/path/to/agent.md', 'agent');
```

**Expected Output/Behavior:**
- Returns `valid: false`
- Error has code: 'VALIDATION_ERROR'
- Error message indicates missing required field 'name'
- No metadata returned

---

### ADS-ERR-010: Symlink Error

| Field | Value |
|-------|-------|
| **Test ID** | ADS-ERR-010 |
| **Description** | Verify scanner handles broken symlinks gracefully |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock broken symlink
mockFs.stat.mockResolvedValue({
  isFile: () => false,
  isDirectory: () => false,
  isSymbolicLink: () => true
});
mockFs.readFile.mockRejectedValue(new Error('ENOENT: broken symlink'));
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', followSymlinks: true });
```

**Expected Output/Behavior:**
- Error added to errors array with code: 'SYMLINK_ERROR'
- Scan continues with other files
- Broken symlink excluded from results

---

## 4. Edge Case Tests

### ADS-EDGE-001: Multiple Projects in Subdirectories

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-001 |
| **Description** | Verify scanner handles multiple projects in subdirectories |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem:
// /root/
//   project1/.opencode/agents/agent1.md
//   project2/.opencode/agents/agent2.md
//   project3/.opencode/agents/agent3.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: '/root' });
```

**Expected Output/Behavior:**
- Finds agents in all subprojects
- All files have scope='project'
- No duplicate detection
- Each file has unique ID based on path

---

### ADS-EDGE-002: Duplicate File Detection

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-002 |
| **Description** | Verify scanner handles duplicate files (same content, different paths) |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Same agent content in two different locations
// /project1/.opencode/agents/agent.md
// /project2/.opencode/agents/agent.md (identical content)
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Both files included in results (different paths)
- Each file has unique ID (hash of path, not content)
- No deduplication based on content

---

### ADS-EDGE-003: Hidden Directories

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-003 |
| **Description** | Verify scanner handles hidden directories (dot-prefixed) |
| **Test Type** | Unit |
| **Priority** | Low |

**Input/Setup:**
```typescript
// Mock filesystem:
// /project/.hidden/.opencode/agents/hidden-agent.md
// /project/.opencode/agents/visible-agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- Finds agent in hidden directory
- Correctly categorizes file
- Hidden directory treated as normal path

---

### ADS-EDGE-004: Symbolic Links - Follow Enabled

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-004 |
| **Description** | Verify scanner follows symbolic links when enabled |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem with symlink:
// /project/.opencode/agents/link.md -> /actual/agent.md
mockGlob.glob.mockImplementation((pattern, opts) => {
  if (opts?.followSymlinks) {
    return Promise.resolve(['/project/.opencode/agents/link.md']);
  }
  return Promise.resolve([]);
});
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', followSymlinks: true });
```

**Expected Output/Behavior:**
- Follows symbolic links when followSymlinks=true
- Returns files pointed to by symlinks
- Symlink target file included in results

---

### ADS-EDGE-005: Symbolic Links - Follow Disabled

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-005 |
| **Description** | Verify scanner skips symbolic links when disabled |
| **Test Type** | Unit |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem with symlink
mockGlob.glob.mockImplementation((pattern, opts) => {
  if (!opts?.followSymlinks) {
    return Promise.resolve([]); // Does not follow symlinks
  }
  return Promise.resolve(['/project/.opencode/agents/link.md']);
});
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', followSymlinks: false });
```

**Expected Output/Behavior:**
- Does not follow symbolic links when followSymlinks=false
- Returns empty results for symlink-only paths
- No errors generated

---

### ADS-EDGE-006: Case Sensitivity on Windows

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-006 |
| **Description** | Verify scanner handles case-insensitive paths on Windows |
| **Test Type** | Integration |
| **Priority** | Low |

**Input/Setup:**
```typescript
// On Windows, paths are case-insensitive
// Files: C:\Project\.OpenCode\Agents\Agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
// Pattern is '**/.opencode/agents/*.md' (lowercase)
```

**Expected Output/Behavior:**
- Matches files regardless of case on Windows
- Pattern matching is case-insensitive on Windows
- Pattern matching is case-sensitive on Unix

---

### ADS-EDGE-007: Special Characters in Paths

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-007 |
| **Description** | Verify scanner handles special characters in file paths |
| **Test Type** | Unit |
| **Priority** | Low |

**Input/Setup:**
```typescript
// Mock filesystem with special characters:
// /project (with spaces)/.opencode/agents/my agent.md
// /project/with-brackets[1]/.opencode/agents/agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Handles spaces in directory names
- Handles brackets and other special characters
- Paths properly escaped in glob patterns

---

### ADS-EDGE-008: Very Long Paths

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-008 |
| **Description** | Verify scanner handles very long file paths |
| **Test Type** | Integration |
| **Priority** | Low |

**Input/Setup:**
```typescript
// Create path exceeding 200 characters
const longPath = '/project/' + 'very/long/path/'.repeat(20) + '.opencode/agents/agent.md';
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Handles paths up to system limits
- No truncation or path corruption
- Error gracefully if path exceeds OS limits

---

### ADS-EDGE-009: Empty Agent Files

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-009 |
| **Description** | Verify scanner handles empty agent files |
| **Test Type** | Unit |
| **Priority** | Low |

**Input/Setup:**
```typescript
mockFs.readFile.mockResolvedValue(''); // Empty file
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- Empty file treated as invalid (no frontmatter)
- File excluded from results
- Error added to errors array

---

### ADS-EDGE-010: Concurrent Scan Operations

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-010 |
| **Description** | Verify scanner handles concurrent scan operations |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
// Run multiple scans concurrently
const [result1, result2, result3] = await Promise.all([
  scanner.scan({ scope: 'project', projectPath: '/project1' }),
  scanner.scan({ scope: 'project', projectPath: '/project2' }),
  scanner.scan({ scope: 'global' })
]);
```

**Expected Output/Behavior:**
- All scans complete successfully
- Results are independent
- No race conditions or shared state issues

---

### ADS-EDGE-011: Files Without Extensions

| Field | Value |
|-------|-------|
| **Test ID** | ADS-EDGE-011 |
| **Description** | Verify scanner handles files without extensions in skills directory |
| **Test Type** | Unit |
| **Priority** | Low |

**Input/Setup:**
```typescript
// Mock filesystem with:
// /project/.opencode/skills/eslint/SKILL (no .md extension)
mockGlob.glob.mockResolvedValue(['/project/.opencode/skills/eslint/SKILL']);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Only matches files named exactly 'SKILL.md'
- Files without .md extension are ignored
- Pattern requires exact match

---

## 5. Integration Tests

### ADS-INT-001: Scan Result Structure Validation

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-001 |
| **Description** | Verify ScanResult structure matches specification |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock complete filesystem:
// /project/.opencode/agents/agent1.md
// /project/.opencode/agents/agent2.md
// /project/.opencode/skills/skill1/SKILL.md
// /project/.opencode/opencode.json
// ~/.config/opencode/agents/global-agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'both' });
```

**Expected Output/Behavior:**
- `result.files` is array of DetectedFile objects
- Each DetectedFile has: id, path, name, type, scope, size, lastModified
- `result.agents` contains only agent files
- `result.skills` contains only skill files
- `result.configs` contains only config files
- `result.projectLevel` contains only project scope files
- `result.globalLevel` contains only global scope files
- `result.duration` is a non-negative number
- `result.directoriesScanned` is a non-negative integer
- `result.filesScanned` is a non-negative integer
- `result.errors` is array of ScanError objects

---

### ADS-INT-002: File Type Classification

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-002 |
| **Description** | Verify files are correctly classified by type |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock filesystem with all file types
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- `*.md` files in `agents/` directory → type: 'agent'
- `SKILL.md` files in `skills/**/` → type: 'skill'
- `opencode.json` files → type: 'config'
- No files with incorrect type classification

---

### ADS-INT-003: Path Normalization

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-003 |
| **Description** | Verify paths are normalized across platforms |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Input paths with different formats:
// ./project/.opencode/agents/agent.md
// /project//.opencode//agents//agent.md
// ~/project/.opencode/agents/agent.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: './project' });
```

**Expected Output/Behavior:**
- All paths normalized to absolute paths
- Double slashes removed
- Relative paths resolved to absolute
- Home directory (~) expanded
- Cross-platform path separators handled

---

### ADS-INT-004: Result Deduplication

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-004 |
| **Description** | Verify results do not contain duplicate entries |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock filesystem where glob might return duplicates
mockGlob.glob.mockResolvedValue([
  '/project/.opencode/agents/agent.md',
  '/project/.opencode/agents/agent.md', // Duplicate
  '/project/.opencode/agents/agent2.md'
]);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- Duplicate paths removed from results
- Each unique file appears only once
- Total count reflects unique files only

---

### ADS-INT-005: Metadata Extraction - Agent

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-005 |
| **Description** | Verify agent metadata is correctly extracted from YAML frontmatter |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock agent file with full metadata:
// ---
// name: my-agent
// description: My test agent
// model: gpt-4
// maxTurns: 10
// tools: [tool1, tool2]
// mcpServers: [server1]
// skills: [skill1, skill2]
// ---
// # Content
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- `metadata.name` = 'my-agent'
- `metadata.description` = 'My test agent'
- `metadata.model` = 'gpt-4'
- `metadata.maxTurns` = 10
- `metadata.tools` = ['tool1', 'tool2']
- `metadata.mcpServers` = ['server1']
- `metadata.skills` = ['skill1', 'skill2']

---

### ADS-INT-006: Metadata Extraction - Skill

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-006 |
| **Description** | Verify skill metadata is correctly extracted from SKILL.md |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock skill file:
// # Skill Name
// 
// ## Description
// This skill does something useful.
// 
// ## Usage
// Use this skill with `command`.
//
// ## Tools
// - tool1
// - tool2
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- `metadata.name` extracted from heading
- `metadata.description` extracted from description section
- `metadata.usage` extracted from usage section
- `metadata.tools` extracted from tools section

---

### ADS-INT-007: Metadata Extraction - Config

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-007 |
| **Description** | Verify config metadata is correctly extracted from opencode.json |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock opencode.json:
// {
//   "$schema": "https://opencode.ai/schema.json",
//   "defaultModel": "gpt-4",
//   "mcpServers": [
//     { "name": "local-server", "type": "local", "command": "npx", "args": ["server"] },
//     { "name": "remote-server", "type": "remote", "url": "https://api.example.com" }
//   ],
//   "settings": { "autoSave": true }
// }
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- `metadata.$schema` = 'https://opencode.ai/schema.json'
- `metadata.defaultModel` = 'gpt-4'
- `metadata.mcpServers` array with 2 servers
- First server has name, type, command, args
- Second server has name, type, url
- `metadata.settings.autoSave` = true

---

### ADS-INT-008: Full Project Scan

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-008 |
| **Description** | Verify end-to-end project scanning with mock filesystem |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Use memfs to create virtual filesystem:
// /test-project/
//   .opencode/
//     agents/
//       developer.md
//       reviewer.md
//     skills/
//       linting/
//         SKILL.md
//       formatting/
//         SKILL.md
//     opencode.json
import { createFsFromVolume, Volume } from 'memfs';
const volume = new Volume();
const fs = createFsFromVolume(volume);
// Populate volume with files...
const scanner = new AIDirectoryScanner({ fsImpl: fs });
const result = await scanner.scan({ scope: 'project', projectPath: '/test-project' });
```

**Expected Output/Behavior:**
- All 2 agents found
- All 2 skills found
- 1 config file found
- All files have correct types and scopes
- Metadata extracted for all files
- Scan completes within 1 second

---

### ADS-INT-009: Full Global Scan

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-009 |
| **Description** | Verify end-to-end global scanning with mock filesystem |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Use memfs to create virtual home directory:
// ~/.config/opencode/
//   agents/
//     global-dev.md
//     global-admin.md
//   skills/
//     common/
//       SKILL.md
//   opencode.json
const scanner = new AIDirectoryScanner({ fsImpl: fs });
const result = await scanner.scan({ scope: 'global', globalPath: '~/.config/opencode' });
```

**Expected Output/Behavior:**
- All global agents found
- All global skills found
- Global config file found
- All files have scope='global'
- Home directory (~) expanded correctly

---

### ADS-INT-010: Mixed Project and Global Scan

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-010 |
| **Description** | Verify scanner handles both scopes in single scan |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock both project and global filesystems
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'both' });
```

**Expected Output/Behavior:**
- Project files have scope='project'
- Global files have scope='global'
- `result.projectLevel` contains only project files
- `result.globalLevel` contains only global files
- `result.files` contains all files
- No mixing or misclassification

---

### ADS-INT-011: Error Recovery Integration

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-011 |
| **Description** | Verify scanner recovers from errors and returns partial results |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Mock filesystem with:
// - /project/.opencode/agents/valid-agent.md (readable)
// - /project/.opencode/agents/invalid-yaml.md (parse error)
// - /project/.opencode/agents/no-permission.md (EACCES)
// - /project/.opencode/skills/good-skill/SKILL.md (readable)
mockFs.readFile.mockImplementation((path) => {
  if (path.includes('valid-agent')) return Promise.resolve(validAgentContent);
  if (path.includes('invalid-yaml')) return Promise.resolve(invalidYamlContent);
  if (path.includes('no-permission')) return Promise.reject(new Error('EACCES'));
  if (path.includes('SKILL.md')) return Promise.resolve(validSkillContent);
  return Promise.reject(new Error('Not found'));
});
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project' });
```

**Expected Output/Behavior:**
- Valid agent included in results
- Valid skill included in results
- Invalid YAML file error in errors array
- Permission error in errors array
- Scan completes successfully
- Partial results returned

---

### ADS-INT-012: Nested Project Structure

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-012 |
| **Description** | Verify scanner finds files at multiple nesting levels |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem:
// /root/
//   .opencode/agents/root-agent.md
//   subproject1/.opencode/agents/sub1-agent.md
//   subproject1/nested/.opencode/agents/deep-agent.md
//   subproject2/.opencode/skills/skill/SKILL.md
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const result = await scanner.scan({ scope: 'project', projectPath: '/root', maxDepth: 10 });
```

**Expected Output/Behavior:**
- Root level agent found
- Subproject 1 agent found
- Nested deep agent found
- Skill found in subproject 2
- All files have correct relative paths

---

### ADS-INT-013: Real OpenCode Structure

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-013 |
| **Description** | Verify scanner works with realistic OpenCode project structure |
| **Test Type** | Integration |
| **Priority** | High |

**Input/Setup:**
```typescript
// Copy actual OpenCode-like structure to temp directory:
// /temp-test/
//   .opencode/
//     agents/
//       code-reviewer.md
//       documentation-writer.md
//       test-writer.md
//     skills/
//       eslint/
//         SKILL.md
//         package.json
//       prettier/
//         SKILL.md
//         README.md
//       git/
//         SKILL.md
//     opencode.json
const scanner = new AIDirectoryScanner();
const result = await scanner.scan({ scope: 'project', projectPath: '/temp-test' });
```

**Expected Output/Behavior:**
- All 3 agents detected with metadata
- All 3 skills detected with metadata
- Config file detected and parsed
- No false positives (package.json, README.md not included)
- All files pass validation

---

### ADS-INT-014: Large Directory Performance

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-014 |
| **Description** | Verify scanner performs within acceptable time for large directories |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Mock filesystem with 1000+ files
const manyFiles = Array.from({ length: 1000 }, (_, i) => 
  `/project/.opencode/agents/agent-${i}.md`
);
mockGlob.glob.mockResolvedValue(manyFiles);
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
const startTime = Date.now();
const result = await scanner.scan({ scope: 'project' });
const duration = Date.now() - startTime;
```

**Expected Output/Behavior:**
- Scan completes in < 5 seconds
- All 1000 files processed
- Result.files.length === 1000
- Duration recorded in result.duration

---

### ADS-INT-015: Cross-Platform Path Handling

| Field | Value |
|-------|-------|
| **Test ID** | ADS-INT-015 |
| **Description** | Verify scanner produces consistent results on different platforms |
| **Test Type** | Integration |
| **Priority** | Medium |

**Input/Setup:**
```typescript
// Test with both Windows and Unix-style paths
const windowsPath = 'C:\\Users\\user\\project\\.opencode\\agents\\agent.md';
const unixPath = '/home/user/project/.opencode/agents/agent.md';
const scanner = new AIDirectoryScanner({ globImpl: mockGlob, fsImpl: mockFs });
```

**Expected Output/Behavior:**
- Windows paths normalized correctly
- Unix paths normalized correctly
- Same logical structure produces same results
- Path separators handled per-platform

---

## Test Summary

| Category | Count | High Priority | Medium Priority | Low Priority |
|----------|-------|---------------|-----------------|--------------|
| AIDirectoryScanner Class | 15 | 12 | 3 | 0 |
| Pattern Matching | 10 | 7 | 3 | 0 |
| Error Handling | 10 | 7 | 3 | 0 |
| Edge Cases | 11 | 3 | 4 | 4 |
| Integration | 15 | 11 | 4 | 0 |
| **Total** | **61** | **40** | **17** | **4** |

---

## Coverage Requirements

Based on the SPEC.md acceptance criteria (AC-12):

- **Unit Tests**: All functions must have corresponding unit tests
- **Branch Coverage**: All conditional branches must be covered
- **Error Handling**: All error paths must be tested
- **Integration Tests**: All integration scenarios must be tested
- **Target Coverage**: 100% statement coverage for scanner logic

---

*Document End - AI Directory Scanner Test Cases v1.0*
