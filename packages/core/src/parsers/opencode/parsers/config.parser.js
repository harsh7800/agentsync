/**
 * Config Parser for OpenCode
 *
 * Parses general settings from config.json and opencode.json.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
export class OpenCodeConfigParser {
    /**
     * Scan settings from config.json and opencode.json
     */
    async scanSettings(basePath) {
        const settings = {};
        // Read config.json
        const configPath = path.join(basePath, 'config.json');
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const configData = JSON.parse(content);
            Object.assign(settings, configData);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                // File doesn't exist is okay, other errors should warn
                if (error.code) {
                    console.warn(`Warning: Failed to read config.json: ${error}`);
                }
            }
        }
        // Read opencode.json (may override some settings)
        const opencodeConfigPath = path.join(basePath, 'opencode.json');
        try {
            const content = await fs.readFile(opencodeConfigPath, 'utf-8');
            const opencodeData = JSON.parse(content);
            Object.assign(settings, opencodeData);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                if (error.code) {
                    console.warn(`Warning: Failed to read opencode.json: ${error}`);
                }
            }
        }
        return Object.keys(settings).length > 0 ? settings : undefined;
    }
}
//# sourceMappingURL=config.parser.js.map