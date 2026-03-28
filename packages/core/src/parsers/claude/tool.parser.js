/**
 * Claude Tool Parser
 *
 * Main parser that coordinates scanning for Claude's single-file configuration.
 */
import { ClaudeScanner } from './scanner.js';
export class ClaudeToolParser {
    scanner;
    constructor() {
        this.scanner = new ClaudeScanner();
    }
    /**
     * Scan Claude directory and return tool model
     */
    async scan(basePath) {
        return this.scanner.scan(basePath);
    }
    /**
     * Check if a path is a valid Claude directory
     */
    async isValid(path) {
        return this.scanner.isClaudeDirectory(path);
    }
    /**
     * Find the config file path
     */
    async findConfigFile(basePath) {
        return this.scanner.findConfigFile(basePath);
    }
}
//# sourceMappingURL=tool.parser.js.map