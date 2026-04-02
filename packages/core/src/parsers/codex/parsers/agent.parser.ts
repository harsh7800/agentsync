/**
 * Agent Parser for Codex
 *
 * Parses AGENTS.md files from Codex's configuration hierarchy.
 * Discovery order: global → repo root → nested folders
 * AGENTS.override.md takes precedence and merges with AGENTS.md.
 *
 * Format (AGENTS.md):
 * ```markdown
 * ---
 * description: Agent description
 * tools:
 *   - filesystem
 *   - git
 * ---
 *
 * # Agent Name
 *
 * System prompt instructions go here...
 * ```
 *
 * AGENTS.override.md uses the same format but its content
 * takes precedence when merging.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  CodexAgent,
  AgentFileResult,
  FrontmatterResult
} from '../types.js';

export class CodexAgentParser {
  /**
   * Parse an AGENTS.md file with optional AGENTS.override.md
   */
  async parse(agentsPath: string, agentName: string = 'default'): Promise<AgentFileResult> {
    const content = await fs.readFile(agentsPath, 'utf-8');
    const config = this.parseContent(content);

    // Check for override file in the same directory
    let overrideContent: string | undefined;
    const overridePath = path.join(path.dirname(agentsPath), 'AGENTS.override.md');
    try {
      overrideContent = await fs.readFile(overridePath, 'utf-8');
    } catch {
      // No override file, that's fine
    }

    return {
      name: agentName,
      config,
      content,
      path: agentsPath,
      overrideContent
    };
  }

  /**
   * Parse AGENTS.md content and return structured config
   *
   * Priority:
   * 1. frontmatter system_prompt / systemPrompt field
   * 2. Content body after frontmatter
   */
  parseContent(content: string): AgentFileResult['config'] {
    const frontmatter = this.parseFrontmatter(content);
    const data = frontmatter.data;

    const frontmatterPrompt = (data.system_prompt as string) || (data.systemPrompt as string);
    const description = (data.description as string) || '';

    // Use frontmatter prompt if provided, otherwise use content body
    const systemPrompt = frontmatterPrompt || frontmatter.content.trim() || undefined;

    return {
      description,
      systemPrompt,
      tools: this.parseToolsArray(data.tools)
    };
  }

  /**
   * Convert parsed agent file to CodexAgent
   */
  toAgent(agentFile: AgentFileResult): CodexAgent {
    let systemPrompt = agentFile.config.systemPrompt;

    // If override file exists, merge/override the system prompt
    if (agentFile.overrideContent) {
      const overrideConfig = this.parseContent(agentFile.overrideContent);
      // Override content takes precedence
      systemPrompt = overrideConfig.systemPrompt || systemPrompt;
    }

    return {
      name: agentFile.name,
      description: agentFile.config.description,
      systemPrompt,
      tools: agentFile.config.tools,
      overrideContent: agentFile.overrideContent
    };
  }

  /**
   * Parse tools array from frontmatter
   */
  private parseToolsArray(tools: unknown): string[] | undefined {
    if (!tools) return undefined;

    if (Array.isArray(tools)) {
      return tools.map(t => String(t));
    }

    if (typeof tools === 'string') {
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
  private parseFrontmatter(content: string): FrontmatterResult {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { data: {}, content };
    }

    const [, frontmatterText, restContent] = match;
    const data: Record<string, unknown> = {};

    // Parse YAML including lists
    const lines = frontmatterText.split('\n');
    let currentKey: string | null = null;

    for (const line of lines) {
      // Check for list item
      if (line.match(/^\s+-\s+/)) {
        const item = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '');
        if (currentKey) {
          const existing = data[currentKey];
          if (Array.isArray(existing)) {
            existing.push(item);
          } else {
            data[currentKey] = [item];
          }
        }
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();

        if (value === '') {
          currentKey = key;
          data[key] = [];
          continue;
        }

        currentKey = null;

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
   * Check if a path contains an AGENTS.md file
   */
  async hasAgentsFile(dirPath: string): Promise<boolean> {
    const agentsPath = path.join(dirPath, 'AGENTS.md');
    try {
      await fs.access(agentsPath);
      return true;
    } catch {
      return false;
    }
  }
}
