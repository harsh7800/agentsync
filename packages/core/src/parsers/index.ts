/**
 * Parsers Module
 * 
 * Unified exports for all tool-specific parsers.
 * 
 * Architecture:
 * - Each tool has its own directory under parsers/
 * - Tool parsers handle tool-specific directory structures
 * - Use ToolPathRegistry to locate tool directories
 */

// Tool-specific parsers
export { ClaudeToolParser, ClaudeScanner } from './claude/index.js';
export { OpenCodeToolParser, OpenCodeScanner } from './opencode/index.js';
export { OpenCodeAgentParser } from './opencode/parsers/agent.parser.js';
export { OpenCodeSkillParser } from './opencode/parsers/skill.parser.js';
export { OpenCodeMCPParser } from './opencode/parsers/mcp.parser.js';
export { OpenCodeConfigParser } from './opencode/parsers/config.parser.js';

// Common Schema Normalizers & Adapters (NEW)
export { OpenCodeNormalizer, createOpenCodeNormalizer } from './opencode/normalizer.js';
export { OpenCodeAdapter, createOpenCodeAdapter } from './opencode/adapter.js';

// Legacy parsers (for backward compatibility)
export { ClaudeParser } from './claude.parser.js';
export { OpenCodeParser } from './opencode.parser.js';
export { GeminiParser } from './gemini.parser.js';
export { CursorParser } from './cursor.parser.js';

// Type exports
export type { ClaudeToolModel, ClaudeScanResult, ClaudeScanErrors, ClaudeMCPServer, ClaudeAgent } from './claude/types.js';
export type { OpenCodeToolModel, OpenCodeScanResult, OpenCodeScanErrors, OpenCodeMCPServer, OpenCodeAgent, OpenCodeSkill, OpenCodeSettings } from './opencode/types.js';

// Legacy type exports
export type { ClaudeConfig, ClaudeMCPServer as ClaudeMCPServerLegacy } from '../types/claude.types.js';
export type { OpenCodeConfig, OpenCodeMCPServer as OpenCodeMCPServerLegacy, OpenCodeAgent as OpenCodeAgentLegacy } from '../types/opencode.types.js';
export type { GeminiConfig, GeminiMCPServer, GeminiAgent } from '../types/gemini.types.js';
export type { CursorConfig, CursorMCPServer, CursorAgent, CursorRules } from '../types/cursor.types.js';

// Tool path registry
export { ToolPathRegistry, toolPathRegistry, TOOL_PATH_REGISTRY } from '../registry/index.js';
export type { ToolName, ToolDirectoryStructure, ResolvedToolPath } from '../registry/index.js';
