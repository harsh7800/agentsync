/**
 * Agent Parser for OpenCode
 *
 * Parses agent.md files from OpenCode agents directories.
 * Format:
 * ---
 * description: Agent description
 * system_prompt: You are an agent...
 * tools:
 *   - filesystem
 *   - git
 * ---
 *
 * # Agent Name
 *
 * Agent content...
 */
import * as fs from 'fs/promises';
export class OpenCodeAgentParser {
    /**
     * Parse an agent.md file
     */
    async parse(agentPath, agentName) {
        const content = await fs.readFile(agentPath, 'utf-8');
        const config = this.parseContent(content);
        return {
            name: agentName,
            config,
            content,
            path: agentPath
        };
    }
    /**
     * Parse agent.md content and return structured config
     */
    parseContent(content) {
        const frontmatter = this.parseFrontmatter(content);
        const data = frontmatter.data;
        // Handle both camelCase and snake_case keys
        const systemPrompt = data.systemPrompt || data.system_prompt;
        const description = data.description || '';
        return {
            description,
            systemPrompt,
            tools: this.parseToolsArray(data.tools)
        };
    }
    /**
     * Convert parsed agent file to OpenCodeAgent for migration
     */
    toAgent(agentFile) {
        return {
            name: agentFile.name,
            description: agentFile.config.description,
            systemPrompt: agentFile.config.systemPrompt,
            tools: agentFile.config.tools
        };
    }
    /**
     * Parse tools field - handles YAML arrays
     */
    parseToolsArray(tools) {
        if (!tools)
            return undefined;
        if (Array.isArray(tools)) {
            return tools.map(t => String(t));
        }
        if (typeof tools === 'string') {
            // Try to parse as YAML inline array: ["tool1", "tool2"] or [tool1, tool2]
            const yamlArrayMatch = tools.match(/\[(.*?)\]/);
            if (yamlArrayMatch) {
                const items = yamlArrayMatch[1];
                return items.split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
            }
        }
        return undefined;
    }
    /**
     * Parse YAML frontmatter from markdown content
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        if (!match) {
            return { data: {}, content };
        }
        const [, frontmatterText, restContent] = match;
        const data = {};
        // Parse YAML including lists
        const lines = frontmatterText.split('\n');
        let currentKey = null;
        for (const line of lines) {
            // Check for list item
            if (line.match(/^\s+-\s+/)) {
                const item = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '');
                if (currentKey) {
                    const existing = data[currentKey];
                    if (Array.isArray(existing)) {
                        existing.push(item);
                    }
                    else {
                        data[currentKey] = [item];
                    }
                }
                continue;
            }
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                let value = line.slice(colonIndex + 1).trim();
                if (value === '') {
                    currentKey = key;
                    data[key] = [];
                    continue;
                }
                currentKey = null;
                // Parse boolean values
                if (value === 'true')
                    value = true;
                else if (value === 'false')
                    value = false;
                // Parse number values
                else if (!isNaN(Number(value)) && value !== '')
                    value = Number(value);
                // Remove quotes
                else if (typeof value === 'string') {
                    value = value.replace(/^["']|["']$/g, '');
                }
                data[key] = value;
            }
        }
        return { data, content: restContent };
    }
    /**
     * Convert JSON config input to agents array
     */
    parseAgentsConfig(input) {
        const agents = [];
        for (const [name, agentConfig] of Object.entries(input.agents || {})) {
            agents.push({
                name,
                description: agentConfig.description,
                systemPrompt: agentConfig.system_prompt,
                tools: agentConfig.tools
            });
        }
        return agents;
    }
}
//# sourceMappingURL=agent.parser.js.map