import { homedir } from 'os';
import type { DetectedAgent, CategorizedAgents } from './types.js';

/**
 * Categorizer
 * 
 * Categorizes detected agents as local (project-specific) or system (user-wide)
 */
export class Categorizer {
  private homeDir: string;

  constructor() {
    this.homeDir = homedir();
  }

  /**
   * Categorize agents as local or system
   * 
   * @param agents Array of detected agents
   * @returns Categorized agents
   */
  categorize(agents: DetectedAgent[]): CategorizedAgents {
    const local: DetectedAgent[] = [];
    const system: DetectedAgent[] = [];

    for (const agent of agents) {
      // If already categorized, use existing category
      if (agent.category) {
        if (agent.category === 'local') {
          local.push(agent);
        } else {
          system.push(agent);
        }
        continue;
      }

      // Determine category from path
      const category = this.getCategoryFromPath(agent.path);
      
      const categorizedAgent = {
        ...agent,
        category
      };

      if (category === 'local') {
        local.push(categorizedAgent);
      } else {
        system.push(categorizedAgent);
      }
    }

    return { local, system };
  }

  /**
   * Determine category from file path
   * 
   * @param filePath File path
   * @returns 'local' or 'system'
   */
  getCategoryFromPath(filePath: string): 'local' | 'system' {
    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedHome = this.homeDir.replace(/\\/g, '/');

    // System paths (in home directory config folders)
    const systemPatterns = [
      `${normalizedHome}/.config/`,
      `${normalizedHome}/.cursor/`,
      `${normalizedHome}/.claude/`,
      `${normalizedHome}/.opencode/`,
      `${normalizedHome}/.gemini/`,
      `${normalizedHome}/.github/`
    ];

    // Check if path matches any system pattern
    for (const pattern of systemPatterns) {
      if (normalizedPath.startsWith(pattern)) {
        return 'system';
      }
    }

    // If it starts with home directory but not in system patterns,
    // it's likely a user-specific but non-config location
    if (normalizedPath.startsWith(normalizedHome)) {
      return 'system';
    }

    // Default to local for project directories
    return 'local';
  }

  /**
   * Check if a path is a system path
   * 
   * @param filePath File path
   * @returns true if system path
   */
  isSystemPath(filePath: string): boolean {
    return this.getCategoryFromPath(filePath) === 'system';
  }

  /**
   * Check if a path is a local path
   * 
   * @param filePath File path
   * @returns true if local path
   */
  isLocalPath(filePath: string): boolean {
    return this.getCategoryFromPath(filePath) === 'local';
  }
}
