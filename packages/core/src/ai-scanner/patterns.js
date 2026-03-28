/**
 * Tool-specific glob patterns for agent detection
 */
/**
 * Default patterns for all supported tools
 */
export const DEFAULT_TOOL_PATTERNS = [
    {
        tool: 'claude',
        name: 'Claude Code',
        patterns: [
            '**/.claude/**/*.json',
            '**/.claude/**/*.md',
            '**/.claude.json',
            '**/claude.json'
        ],
        extensions: ['.json', '.md'],
        configFiles: ['settings.json', 'claude.json', 'config.json']
    },
    {
        tool: 'opencode',
        name: 'OpenCode',
        patterns: [
            '**/.opencode/**/*.json',
            '**/.opencode/**/*.md',
            '**/.opencode.json',
            '**/opencode.json',
            '**/*.agent.md',
            '**/*.skill.md'
        ],
        extensions: ['.json', '.md'],
        configFiles: ['config.json', 'opencode.json', 'settings.json']
    },
    {
        tool: 'gemini',
        name: 'Gemini CLI',
        patterns: [
            '**/.gemini/**/*.json',
            '**/.gemini.json',
            '**/gemini.json'
        ],
        extensions: ['.json'],
        configFiles: ['config.json', 'gemini.json']
    },
    {
        tool: 'cursor',
        name: 'Cursor',
        patterns: [
            '**/.cursor/**/*.json',
            '**/.cursorrules',
            '**/cursor.json'
        ],
        extensions: ['.json', ''],
        configFiles: ['config.json', 'settings.json', '.cursorrules']
    },
    {
        tool: 'copilot',
        name: 'GitHub Copilot',
        patterns: [
            '**/.github/copilot/**/*.json',
            '**/copilot.json'
        ],
        extensions: ['.json'],
        configFiles: ['config.json', 'copilot.json']
    }
];
/**
 * Get patterns for a specific tool
 */
export function getToolPatterns(tool) {
    return DEFAULT_TOOL_PATTERNS.find(p => p.tool === tool.toLowerCase());
}
/**
 * Get all supported tool names
 */
export function getSupportedTools() {
    return DEFAULT_TOOL_PATTERNS.map(p => p.tool);
}
/**
 * Check if a tool is supported
 */
export function isToolSupported(tool) {
    return DEFAULT_TOOL_PATTERNS.some(p => p.tool === tool.toLowerCase());
}
//# sourceMappingURL=patterns.js.map