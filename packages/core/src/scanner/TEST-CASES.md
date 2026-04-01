# Test Cases: AI Directory Scanner

Generated from: `packages/core/src/scanner/SPEC.md`
Generated on: 2026-04-01

---

## Summary

| Layer | Count | P0 | P1 | P2 |
|-------|-------|----|----|----|
| Unit (Scanner) | 18 | 12 | 5 | 1 |
| Integration | 4 | 4 | 0 | 0 |
| E2E | 2 | 2 | 0 | 0 |
| **Total** | **24** | **18** | **5** | **1** |

---

## Unit Tests

### AIDirectoryScanner Core

#### UNIT-SCANNER-001: Constructor initializes with default options
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: No options provided
- **When**: Scanner is instantiated
- **Then**: Scanner has default configuration

#### UNIT-SCANNER-002: scan() with scope='project' scans only project-level files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with both project and global OpenCode files
- **When**: scan({ scope: 'project' }) is called
- **Then**: Only project-level files returned

#### UNIT-SCANNER-003: scan() with scope='global' scans only global-level files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with both project and global OpenCode files
- **When**: scan({ scope: 'global' }) is called
- **Then**: Only global-level files returned

#### UNIT-SCANNER-004: scan() with scope='both' scans all files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with both project and global OpenCode files
- **When**: scan({ scope: 'both' }) is called
- **Then**: Both project and global files returned with correct scope categorization

#### UNIT-SCANNER-005: scanProjectLevel() finds agents with glob pattern
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with files at `./.opencode/agents/*.md`
- **When**: scanProjectLevel() is called
- **Then**: Returns array with all agent files

#### UNIT-SCANNER-006: scanProjectLevel() finds skills with glob pattern
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with files at `./.opencode/skills/**/SKILL.md`
- **When**: scanProjectLevel() is called
- **Then**: Returns array with all skill files

#### UNIT-SCANNER-007: scanProjectLevel() finds config files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with `./opencode.json`
- **When**: scanProjectLevel() is called
- **Then**: Returns config file in results

#### UNIT-SCANNER-008: scanGlobalLevel() finds global agents
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with files at `~/.config/opencode/agents/*.md`
- **When**: scanGlobalLevel() is called
- **Then**: Returns array with global agent files

#### UNIT-SCANNER-009: scanGlobalLevel() finds global skills
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Mock fs with files at `~/.config/opencode/skills/**/SKILL.md`
- **When**: scanGlobalLevel() is called
- **Then**: Returns array with global skill files

#### UNIT-SCANNER-010: categorizeByScope() identifies project-level files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: File path `./.opencode/agents/test-agent.md`
- **When**: categorizeByScope() is called
- **Then**: Returns 'project'

#### UNIT-SCANNER-011: categorizeByScope() identifies global-level files
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: File path `~/.config/opencode/agents/test-agent.md`
- **When**: categorizeByScope() is called
- **Then**: Returns 'global'

#### UNIT-SCANNER-012: Returns empty results for empty directories
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Empty directory or directory without OpenCode files
- **When**: scan() is called
- **Then**: Returns empty arrays for all file types

### Glob Pattern Matching

#### UNIT-SCANNER-013: globScan() matches agent pattern correctly
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Pattern `**/.opencode/agents/*.md` and directory with matching files
- **When**: globScan() is called
- **Then**: Returns all matching file paths

#### UNIT-SCANNER-014: globScan() matches skill pattern correctly
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Pattern `**/.opencode/skills/**/SKILL.md` and directory with nested skills
- **When**: globScan() is called
- **Then**: Returns all skill file paths including nested ones

#### UNIT-SCANNER-015: globScan() matches config pattern correctly
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Pattern `**/opencode.json` and directory with config
- **When**: globScan() is called
- **Then**: Returns config file path

#### UNIT-SCANNER-016: Multiple projects in subdirectories are all detected
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Root directory with multiple subprojects each having .opencode/
- **When**: scan() is called with sufficient depth
- **Then**: Returns agents/skills from all subprojects

### Error Handling

#### UNIT-SCANNER-017: Handles permission errors gracefully
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Directory with no read permissions
- **When**: scan() is called
- **Then**: Logs permission error, continues scanning other directories, includes error in results

#### UNIT-SCANNER-018: Handles missing directories gracefully
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Non-existent directory path
- **When**: scan() is called
- **Then**: Returns empty results, adds error to errors array

### File Validation

#### UNIT-SCANNER-019: validateFile() returns true for valid agent files
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Markdown file with valid YAML frontmatter
- **When**: validateFile() is called with type='agent'
- **Then**: Returns true

#### UNIT-SCANNER-020: validateFile() returns false for invalid agent files
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: File without YAML frontmatter or invalid structure
- **When**: validateFile() is called with type='agent'
- **Then**: Returns false

### Metadata Parsing

#### UNIT-SCANNER-021: parseAgentFile() extracts metadata from YAML frontmatter
- **Priority**: P2
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Agent markdown file with name, description, model in frontmatter
- **When**: parseAgentFile() is called
- **Then**: Returns AgentMetadata with extracted fields

#### UNIT-SCANNER-022: parseConfigFile() extracts MCP server configurations
- **Priority**: P1
- **File**: `packages/core/src/__tests__/ai-directory-scanner.spec.ts`
- **Given**: Valid opencode.json with mcpServers array
- **When**: parseConfigFile() is called
- **Then**: Returns ConfigMetadata with MCP server configs

---

## Integration Tests

### Scanner Integration

#### INT-SCANNER-001: Full project scan returns structured results
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.integration.spec.ts`
- **Given**: Temporary directory with complete .opencode structure (agents, skills, config)
- **When**: scan() is called
- **Then**: Returns ScanResult with all files categorized correctly

#### INT-SCANNER-002: Mixed project and global scan with both scope
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.integration.spec.ts`
- **Given**: Both project-level and global-level OpenCode configurations
- **When**: scan({ scope: 'both' }) is called
- **Then**: Result contains both projectLevel and globalLevel arrays with correct files

#### INT-SCANNER-003: Scanner respects maxDepth option
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.integration.spec.ts`
- **Given**: Nested directory structure 5 levels deep with .opencode/ at each level
- **When**: scan({ maxDepth: 3 }) is called
- **Then**: Only files within 3 levels are returned

#### INT-SCANNER-004: Scanner with include/exclude options
- **Priority**: P0
- **File**: `packages/core/src/__tests__/ai-directory-scanner.integration.spec.ts`
- **Given**: Directory with agents, skills, and config
- **When**: scan({ includeAgents: true, includeSkills: false, includeConfig: true }) is called
- **Then**: Result contains only agents and configs, no skills

---

## E2E Tests

### Real OpenCode Structure Detection

#### E2E-SCANNER-001: Detects actual OpenCode project structure
- **Priority**: P0
- **File**: `packages/e2e/ai-directory-scanner.e2e-spec.ts`
- **Steps**:
  1. Create temporary directory with realistic OpenCode structure:
     - `.opencode/agents/coder.md` (with YAML frontmatter)
     - `.opencode/agents/reviewer.md` (with YAML frontmatter)
     - `.opencode/skills/git/SKILL.md`
     - `.opencode/skills/testing/SKILL.md`
     - `opencode.json` with MCP servers
  2. Run scanner on the directory
  3. Verify all files are detected
- **Expected**: All 5 files detected with correct types and metadata

#### E2E-SCANNER-002: Detects global OpenCode configuration
- **Priority**: P0
- **File**: `packages/e2e/ai-directory-scanner.e2e-spec.ts`
- **Steps**:
  1. Mock home directory with global OpenCode config:
     - `.config/opencode/agents/global-assistant.md`
     - `.config/opencode/opencode.json`
  2. Run scanner with scope='global'
  3. Verify global files are detected
- **Expected**: Global files detected and categorized as 'global' scope

---

## Security Tests

| ID | Description | Criteria |
|----|-------------|----------|
| SEC-SCANNER-001 | No sensitive data in scan results | ScanResult doesn't expose file contents unless explicitly requested |
| SEC-SCANNER-002 | Path traversal protection | Scanner doesn't escape base directory when following symlinks |

---

## Not Tested

| Scenario | Reason |
|----------|--------|
| Performance with 1000+ files | Performance tests are P2 for MVP |
| Network file systems | Out of scope for initial implementation |
| Windows-specific path handling | Covered by Node.js path module tests |

---

## Mock Data

```typescript
// packages/core/src/__tests__/fixtures/ai-directory-scanner.ts
export const mockFileSystem = {
  project: {
    '.opencode': {
      'agents': {
        'coder.md': '---\nname: Coder\nmodel: claude-sonnet-4-20250514\n---\n# Coder Agent',
        'reviewer.md': '---\nname: Code Reviewer\nmodel: claude-haiku-3-20250708\n---\n# Reviewer Agent'
      },
      'skills': {
        'git': {
          'SKILL.md': '# Git Skill\n\nDescription here'
        },
        'testing': {
          'jest': {
            'SKILL.md': '# Jest Testing\n\nDescription here'
          }
        }
      },
      'opencode.json': JSON.stringify({
        mcpServers: [
          { name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] }
        ]
      })
    }
  },
  global: {
    '.config': {
      'opencode': {
        'agents': {
          'global-assistant.md': '---\nname: Global Assistant\n---\n'
        },
        'opencode.json': JSON.stringify({
          mcpServers: [
            { name: 'github', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] }
          ]
        })
      }
    }
  }
};

export const mockDetectedFiles = {
  agent: {
    id: 'agent-coder-md-123456',
    path: '/project/.opencode/agents/coder.md',
    name: 'coder.md',
    type: 'agent',
    scope: 'project',
    size: 256,
    lastModified: new Date('2026-04-01'),
    metadata: {
      name: 'Coder',
      model: 'claude-sonnet-4-20250514'
    }
  },
  skill: {
    id: 'skill-git-skill-md-123456',
    path: '/project/.opencode/skills/git/SKILL.md',
    name: 'SKILL.md',
    type: 'skill',
    scope: 'project',
    size: 128,
    lastModified: new Date('2026-04-01')
  },
  config: {
    id: 'config-opencode-json-123456',
    path: '/project/opencode.json',
    name: 'opencode.json',
    type: 'config',
    scope: 'project',
    size: 512,
    lastModified: new Date('2026-04-01'),
    metadata: {
      mcpServers: [{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] }]
    }
  }
};
```

---

## Running Tests

```bash
# Run all AI Directory Scanner tests
pnpm test -- --testPathPattern=ai-directory-scanner

# Run unit tests only
pnpm test -- packages/core/src/__tests__/ai-directory-scanner.spec.ts

# Run integration tests
pnpm test -- packages/core/src/__tests__/ai-directory-scanner.integration.spec.ts

# Run E2E tests
pnpm test -- packages/e2e/ai-directory-scanner.e2e-spec.ts

# Run with coverage
pnpm test -- --coverage --testPathPattern=ai-directory-scanner
```

---

## Coverage Requirements

| Category | Target |
|----------|--------|
| AIDirectoryScanner | 100% |
| Glob patterns | 100% |
| File validation | 100% |
| Error handling | 100% |
| Metadata parsing | 90% |
| **Overall** | **95%+** |
