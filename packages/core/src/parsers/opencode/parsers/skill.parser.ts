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
import type { OpenCodeSkill, SkillFileResult, FrontmatterResult } from '../types.js';

export class OpenCodeSkillParser {
  /**
   * Parse a skill.md file
   */
  async parse(skillPath: string, skillName: string): Promise<SkillFileResult> {
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
  parseContent(content: string): SkillFileResult['config'] {
    const frontmatter = this.parseFrontmatter(content);
    
    return {
      instructions: frontmatter.data.instructions as string | undefined,
      description: frontmatter.data.description as string | undefined,
      enabled: frontmatter.data.enabled as boolean | undefined
    };
  }

  /**
   * Convert parsed skill file to OpenCodeSkill
   */
  toSkill(skillFile: SkillFileResult): OpenCodeSkill {
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
  private parseFrontmatter(content: string): FrontmatterResult {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { data: {}, content };
    }
    
    const [, frontmatterText, restContent] = match;
    const data: Record<string, unknown> = {};
    
    // Simple YAML parsing for key: value pairs
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();
        
        // Parse boolean values
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        // Parse number values
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
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
