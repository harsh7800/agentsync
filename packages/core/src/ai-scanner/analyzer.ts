import { readFile } from 'fs/promises';
import type { AgentInfo } from './types.js';

/**
 * Content Analyzer
 * 
 * Analyzes file content to determine agent type and metadata
 */
export class ContentAnalyzer {
  /**
   * Analyze a file to extract agent information
   * 
   * @param filePath Path to file
   * @returns AgentInfo if valid agent, null otherwise
   */
  async analyze(filePath: string): Promise<AgentInfo | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const tool = this.detectToolFromContent(content, filePath);
      
      if (!tool) {
        return null;
      }

      const name = this.extractName(content, filePath);
      const type = this.detectType(content, filePath);
      const metadata = this.extractMetadata(content);

      return {
        name,
        type,
        tool,
        metadata
      };
    } catch (error) {
      // File read error - not a valid agent
      return null;
    }
  }

  /**
   * Detect tool type from content and file path
   */
  private detectToolFromContent(content: string, filePath: string): string | null {
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Check path patterns first
    if (lowerPath.includes('.claude') || lowerPath.includes('claude')) {
      return 'claude';
    }
    if (lowerPath.includes('.opencode') || lowerPath.includes('opencode')) {
      return 'opencode';
    }
    if (lowerPath.includes('.gemini') || lowerPath.includes('gemini')) {
      return 'gemini';
    }
    if (lowerPath.includes('.cursor') || lowerPath.includes('cursor')) {
      return 'cursor';
    }
    if (lowerPath.includes('copilot')) {
      return 'copilot';
    }

    // Check content patterns
    if (lowerContent.includes('mcpServers') || lowerContent.includes('claude')) {
      return 'claude';
    }
    if (lowerContent.includes('opencode') || lowerContent.includes('agent')) {
      return 'opencode';
    }

    return null;
  }

  /**
   * Extract agent name from content
   */
  private extractName(content: string, filePath: string): string {
    // Try to extract from markdown header
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Try to extract from JSON name field
    try {
      const json = JSON.parse(content);
      if (json.name) return json.name;
      if (json.agent?.name) return json.agent.name;
    } catch {
      // Not valid JSON
    }

    // Fall back to file name
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown';
    return fileName.replace(/\.(md|json)$/i, '');
  }

  /**
   * Detect agent type from content and file path
   */
  private detectType(content: string, filePath: string): 'agent' | 'skill' | 'mcp' | 'config' {
    const lowerPath = filePath.toLowerCase();

    // Check file name patterns
    if (lowerPath.includes('.agent.')) {
      return 'agent';
    }
    if (lowerPath.includes('.skill.')) {
      return 'skill';
    }
    if (lowerPath.includes('mcp')) {
      return 'mcp';
    }

    // Check content patterns
    if (content.includes('system_prompt') || content.includes('systemPrompt')) {
      return 'agent';
    }
    if (content.includes('mcpServers')) {
      return 'mcp';
    }

    // Default to config
    return 'config';
  }

  /**
   * Extract metadata from content
   */
  private extractMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Extract description from markdown
    const descMatch = content.match(/##?\s+Description\s*\n\s*(.+?)(?:\n##|\n\n|$)/s);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract version from JSON
    try {
      const json = JSON.parse(content);
      if (json.version) metadata.version = json.version;
      if (json.model) metadata.model = json.model;
      if (json.temperature !== undefined) metadata.temperature = json.temperature;
    } catch {
      // Not valid JSON
    }

    // Count lines as complexity metric
    const lines = content.split('\n').length;
    metadata.lines = lines;

    return metadata;
  }
}
