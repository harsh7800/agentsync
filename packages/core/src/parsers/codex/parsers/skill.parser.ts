/**
 * Skill Parser for Codex
 *
 * Parses SKILL.md files from Codex skills directories.
 * Each skill lives under $CODEX_HOME/skills/{name}/ and can contain:
 * - SKILL.md (required, with YAML frontmatter)
 * - scripts/ (optional, executable scripts)
 * - references/ (optional, reference files)
 * - assets/ (optional, asset files)
 * - agents/ (optional, agent definitions)
 * - openai.yaml (optional, OpenAI-specific config)
 *
 * SKILL.md format:
 * ```markdown
 * ---
 * description: Skill description
 * enabled: true
 * instructions: Optional instruction override
 * ---
 *
 * # Skill Name
 *
 * Skill content...
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { CodexSkill, SkillFileResult, FrontmatterResult } from '../types.js';

export class CodexSkillParser {
  /**
   * Parse a SKILL.md file from a skill directory
   * Also discovers optional scripts, references, assets, and openai.yaml
   */
  async parse(skillDirPath: string, skillName: string): Promise<SkillFileResult> {
    // Try SKILL.md (uppercase) first, then skill.md (lowercase)
    let content: string;
    let skillMdPath: string;

    try {
      skillMdPath = path.join(skillDirPath, 'SKILL.md');
      content = await fs.readFile(skillMdPath, 'utf-8');
    } catch {
      skillMdPath = path.join(skillDirPath, 'skill.md');
      content = await fs.readFile(skillMdPath, 'utf-8');
    }

    const config = this.parseContent(content);

    // Discover optional subdirectories
    const scripts = await this.listDirectoryContents(path.join(skillDirPath, 'scripts'));
    const references = await this.listDirectoryContents(path.join(skillDirPath, 'references'));
    const assets = await this.listDirectoryContents(path.join(skillDirPath, 'assets'));

    // Parse optional openai.yaml
    const openaiConfig = await this.parseOpenAIYaml(skillDirPath);

    return {
      name: skillName,
      config,
      content,
      path: skillMdPath,
      scripts: scripts.length > 0 ? scripts : undefined,
      references: references.length > 0 ? references : undefined,
      assets: assets.length > 0 ? assets : undefined,
      openaiConfig
    };
  }

  /**
   * Parse SKILL.md content and return structured config
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
   * Convert parsed skill file to CodexSkill
   */
  toSkill(skillFile: SkillFileResult): CodexSkill {
    return {
      name: skillFile.name,
      description: skillFile.config.description || '',
      instructions: skillFile.config.instructions,
      enabled: skillFile.config.enabled ?? true,
      content: skillFile.content,
      path: skillFile.path,
      scripts: skillFile.scripts,
      references: skillFile.references,
      assets: skillFile.assets,
      openaiConfig: skillFile.openaiConfig
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

    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();

        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        else if (typeof value === 'string') {
          value = value.replace(/^["']|["']$/g, '');
        }

        data[key] = value;
      }
    }

    return { data, content: restContent };
  }

  /**
   * List files in a directory (non-recursive)
   */
  private async listDirectoryContents(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(e => e.isFile())
        .map(e => path.join(dirPath, e.name));
    } catch {
      return [];
    }
  }

  /**
   * Parse optional openai.yaml file in skill directory
   */
  private async parseOpenAIYaml(skillDirPath: string): Promise<Record<string, unknown> | undefined> {
    const yamlPath = path.join(skillDirPath, 'openai.yaml');
    try {
      const content = await fs.readFile(yamlPath, 'utf-8');
      const parsed = yaml.load(content);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if a directory contains a valid skill
   */
  async isSkillDirectory(dirPath: string): Promise<boolean> {
    try {
      // Check for SKILL.md or skill.md
      const upperPath = path.join(dirPath, 'SKILL.md');
      const lowerPath = path.join(dirPath, 'skill.md');

      try {
        await fs.access(upperPath);
        return true;
      } catch {
        try {
          await fs.access(lowerPath);
          return true;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }
}
