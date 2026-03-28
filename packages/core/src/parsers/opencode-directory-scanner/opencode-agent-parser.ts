import * as fs from 'fs/promises';
import type { OpenCodeAgent } from '../../types/opencode.types.js';

/**
 * Parsed agent file configuration from agent.md frontmatter
 */
export interface OpenCodeAgentFile {
  name: string;
  description: string;
  systemPrompt?: string;
  tools?: string[];
  content: string;
  path: string;
}

/**
 * Parses agent.md files from OpenCode agents directories
 */
export class OpenCodeAgentFileParser {
  /**
   * Parse an agent.md file
   */
  async parse(agentPath: string, agentName: string): Promise<OpenCodeAgentFile> {
    const content = await fs.readFile(agentPath, 'utf-8');
    const config = this.parseContent(content, agentName);
    
    return {
      name: agentName,
      description: config.description || '',
      systemPrompt: config.systemPrompt,
      tools: config.tools,
      content: content,
      path: agentPath
    };
  }

  /**
   * Parse agent.md content directly
   */
  parseContent(content: string, agentName: string): Omit<OpenCodeAgentFile, 'name' | 'content' | 'path'> {
    const frontmatter = this.parseFrontmatter(content);
    const data = frontmatter.data;
    
    // Handle both camelCase (systemPrompt) and snake_case (system_prompt) keys
    const systemPrompt = (data.systemPrompt as string) || (data.system_prompt as string);
    const description = (data.description as string) || '';
    
    return {
      description,
      systemPrompt,
      tools: this.parseToolsArray(data.tools)
    };
  }

  /**
   * Parse tools field - can be YAML array or JSON array string
   */
  private parseToolsArray(tools: unknown): string[] | undefined {
    if (!tools) return undefined;
    
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
    
    // Parse YAML including lists
    const lines = frontmatterText.split('\n');
    let currentKey: string | null = null;
    
    for (const line of lines) {
      // Check for list item
      if (line.match(/^\s+-\s+/)) {
        // This is a list item
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
          // This key might have a list following it
          currentKey = key;
          data[key] = [];
          continue;
        }
        
        currentKey = null;
        
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

  /**
   * Convert parsed agent file to OpenCodeAgent type for migration
   */
  toOpenCodeAgent(agentFile: OpenCodeAgentFile): OpenCodeAgent {
    return {
      name: agentFile.name,
      description: agentFile.description,
      systemPrompt: agentFile.systemPrompt,
      tools: agentFile.tools
    };
  }
}
