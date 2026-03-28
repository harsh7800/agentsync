import * as fs from 'fs/promises';
import * as path from 'path';
import type { OpenCodeSkill, OpenCodeSkillConfig } from './opencode-skill.types.js';

/**
 * Parses skill.md files from OpenCode skills directories
 */
export class OpenCodeSkillParser {
  /**
   * Parse a skill.md file
   */
  async parse(skillPath: string, skillName: string): Promise<OpenCodeSkill> {
    const content = await fs.readFile(skillPath, 'utf-8');
    const config = this.parseContent(content, skillName);
    
    return {
      name: skillName,
      description: config.description || '',
      instructions: config.instructions,
      enabled: config.enabled ?? true,
      content: content,
      path: skillPath
    };
  }

  /**
   * Parse skill.md content directly
   */
  parseContent(content: string, skillName: string): OpenCodeSkillConfig {
    const frontmatter = this.parseFrontmatter(content);
    
    return {
      instructions: frontmatter.data.instructions as string | undefined,
      description: frontmatter.data.description as string | undefined,
      enabled: frontmatter.data.enabled as boolean | undefined
    };
  }

  /**
   * Parse YAML frontmatter from markdown content
   * Format:
   * ---
   * key: value
   * ---
   * content
   */
  private parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      // No frontmatter, return content as-is
      return { data: {}, content: content };
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
        // Remove quotes from string values
        else if (typeof value === 'string') {
          value = value.replace(/^["']|["']$/g, '');
        }
        
        data[key] = value;
      }
    }
    
    return { data, content: restContent };
  }
}
