// Types for OpenCode skill structures

/**
 * Parsed skill configuration from skill.md frontmatter
 */
export interface OpenCodeSkillConfig {
  instructions?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * A skill extracted from skills subdirectory skill.md files
 */
export interface OpenCodeSkill {
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  content: string;
  path: string;
}

/**
 * Result of scanning the skills directory
 */
export interface OpenCodeSkillsScanResult {
  skills: OpenCodeSkill[];
  errors: string[];
}

/**
 * Frontmatter parsing result
 */
export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
}
