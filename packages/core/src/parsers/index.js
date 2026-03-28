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
// Legacy parsers (for backward compatibility)
export { ClaudeParser } from './claude.parser.js';
export { OpenCodeParser } from './opencode.parser.js';
// Tool path registry
export { ToolPathRegistry, toolPathRegistry, TOOL_PATH_REGISTRY } from '../registry/index.js';
//# sourceMappingURL=index.js.map