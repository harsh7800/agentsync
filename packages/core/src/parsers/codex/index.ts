/**
 * Codex Tool Parser Module
 *
 * Provides parsing for Codex's directory-based configuration structure.
 * Codex stores everything under a .codex tree (defaults to ~/.codex,
 * redirected via CODEX_HOME).
 *
 * Directory structure:
 * ```
 * ~/.codex/                    (or $CODEX_HOME)
 * ├── config.toml              # User config (TOML format)
 * ├── requirements.toml        # Enterprise policy
 * ├── AGENTS.md                # Global agent instructions
 * ├── AGENTS.override.md       # Override instructions
 * ├── skills/                  # Skills directory
 * │   └── skill-name/
 * │       ├── SKILL.md
 * │       ├── scripts/
 * │       ├── references/
 * │       ├── assets/
 * │       └── openai.yaml
 * ├── sessions/                # Session metadata
 * ├── prompts/                 # Saved prompts
 * └── plugins/                 # Plugins
 * ```
 */

export { CodexToolParser } from './tool.parser.js';
export { CodexScanner } from './scanner.js';
export * from './types.js';

// Re-export parsers
export { CodexAgentParser } from './parsers/agent.parser.js';
export { CodexSkillParser } from './parsers/skill.parser.js';
export { CodexConfigParser } from './parsers/config.parser.js';

// Common Schema support
export { CodexNormalizer, createCodexNormalizer } from './normalizer.js';
export { CodexAdapter, createCodexAdapter } from './adapter.js';
