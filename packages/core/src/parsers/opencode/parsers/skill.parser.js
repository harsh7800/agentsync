/**
 * Skill Parser for OpenCode
 *
 * Parses skill.md files from OpenCode skills directories.
 * Format:
 * ---
 * description: Skill description
 * enabled: true
 * ---
 *
 * # Skill Name
 *
 * Skill content...
 */
import * as fs from 'fs/promises';
export class OpenCodeSkillParser {
    /**
     * Parse a skill.md file
     */
    async parse(skillPath, skillName) {
        const content = await fs.readFile(skillPath, 'utf-8');
        const config = this.parseContent(content);
        return {
            name: skillName,
            config,
            content,
            path: skillPath
        };
    }
    /**
     * Parse skill.md content and return structured config
     */
    parseContent(content) {
        const frontmatter = this.parseFrontmatter(content);
        return {
            instructions: frontmatter.data.instructions,
            description: frontmatter.data.description,
            enabled: frontmatter.data.enabled
        };
    }
    /**
     * Convert parsed skill file to OpenCodeSkill
     */
    toSkill(skillFile) {
        return {
            name: skillFile.name,
            description: skillFile.config.description || '',
            instructions: skillFile.config.instructions,
            enabled: skillFile.config.enabled ?? true,
            content: skillFile.content,
            path: skillFile.path
        };
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
        // Simple YAML parsing for key: value pairs
        const lines = frontmatterText.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                let value = line.slice(colonIndex + 1).trim();
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
}
//# sourceMappingURL=skill.parser.js.map