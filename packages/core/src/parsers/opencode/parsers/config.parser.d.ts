/**
 * Config Parser for OpenCode
 *
 * Parses general settings from config.json and opencode.json.
 */
import type { OpenCodeSettings } from '../types.js';
export declare class OpenCodeConfigParser {
    /**
     * Scan settings from config.json and opencode.json
     */
    scanSettings(basePath: string): Promise<OpenCodeSettings | undefined>;
}
//# sourceMappingURL=config.parser.d.ts.map