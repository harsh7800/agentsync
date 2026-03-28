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
import type { OpenCodeSkill, SkillFileResult } from '../types.js';
export declare class OpenCodeSkillParser {
    /**
     * Parse a skill.md file
     */
    parse(skillPath: string, skillName: string): Promise<SkillFileResult>;
    /**
     * Parse skill.md content and return structured config
     */
    parseContent(content: string): SkillFileResult['config'];
    /**
     * Convert parsed skill file to OpenCodeSkill
     */
    toSkill(skillFile: SkillFileResult): OpenCodeSkill;
    /**
     * Parse YAML frontmatter from markdown content
     */
    private parseFrontmatter;
}
//# sourceMappingURL=skill.parser.d.ts.map