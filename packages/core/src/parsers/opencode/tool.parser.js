/**
 * OpenCode Tool Parser
 *
 * Main parser that coordinates scanning and provides a unified interface
 * for converting OpenCode tool models.
 */
import { OpenCodeScanner } from './scanner.js';
export class OpenCodeToolParser {
    scanner;
    constructor() {
        this.scanner = new OpenCodeScanner();
    }
    /**
     * Scan OpenCode directory and return tool model
     */
    async scan(basePath) {
        return this.scanner.scan(basePath);
    }
    /**
     * Check if a path is a valid OpenCode directory
     */
    async isValid(path) {
        return this.scanner.isOpenCodeDirectory(path);
    }
}
//# sourceMappingURL=tool.parser.js.map