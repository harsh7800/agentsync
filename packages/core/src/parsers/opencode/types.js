/**
 * OpenCode Tool Parser Types
 *
 * Defines the type system for OpenCode's directory-based configuration.
 * OpenCode stores configuration in opencode.json:
 *
 * ~/.config/opencode/
 * ├── opencode.json    # Main config with MCP servers, settings, etc.
 * ├── skills/          # Skills directory
 * │   ├── git-commit/
 * │   │   └── skill.md
 * │   └── code-review/
 * │       └── skill.md
 * └── agents/          # Agents directory
 *     ├── onboarding/
 *     │   └── agent.md
 *     └── refactoring/
 *         └── agent.md
 *
 * opencode.json format:
 * {
 *   "mcp": {
 *     "server-name": {
 *       "type": "local" | "remote",
 *       "command": ["npx", "-y", "package"],
 *       "environment": { ... },
 *       "url": "https://...",
 *       "headers": { ... }
 *     }
 *   }
 * }
 */
export {};
//# sourceMappingURL=types.js.map