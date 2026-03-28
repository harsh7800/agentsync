import type { JSONSchema7 } from 'json-schema';

// Import all schemas from TypeScript files
import { claudeV1 } from './claude/v1.js';
import { claudeV2 } from './claude/v2.js';
import { opencodeV1 } from './opencode/v1.js';
import { geminiV1 } from './gemini/v1.js';
import { cursorV1 } from './cursor/v1.js';
import { copilotV1 } from './copilot/v1.js';

export type SupportedTool = 'claude' | 'opencode' | 'gemini' | 'cursor' | 'copilot';
export type SchemaVersion = 'v1' | 'v2';

export interface SchemaMetadata {
  tool: SupportedTool;
  version: SchemaVersion;
  schema: JSONSchema7;
  lastUpdated: string;
}

export interface MigrationVersionLock {
  sourceTool: SupportedTool;
  sourceVersion: SchemaVersion;
  targetTool: SupportedTool;
  targetVersion: SchemaVersion;
  timestamp: string;
  migrationId: string;
}

/**
 * Schema Registry for AgentSync CLI
 * 
 * Manages versioned JSON schemas for all supported tools.
 * Provides schema validation, version tracking, and migration locking.
 */
export class SchemaRegistry {
  private schemas: Map<string, SchemaMetadata> = new Map();
  private migrationLocks: Map<string, MigrationVersionLock> = new Map();

  constructor() {
    this.registerSchemas();
  }

  private registerSchemas(): void {
    // Claude schemas
    this.register('claude', 'v1', claudeV1);
    this.register('claude', 'v2', claudeV2);

    // OpenCode schemas
    this.register('opencode', 'v1', opencodeV1);

    // Gemini schemas
    this.register('gemini', 'v1', geminiV1);

    // Cursor schemas
    this.register('cursor', 'v1', cursorV1);

    // Copilot schemas
    this.register('copilot', 'v1', copilotV1);
  }

  private register(tool: SupportedTool, version: SchemaVersion, schema: JSONSchema7): void {
    const key = `${tool}/${version}`;
    this.schemas.set(key, {
      tool,
      version,
      schema,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Get a schema by tool and version
   */
  getSchema(tool: SupportedTool, version: SchemaVersion): JSONSchema7 | undefined {
    const key = `${tool}/${version}`;
    return this.schemas.get(key)?.schema;
  }

  /**
   * Get schema metadata
   */
  getMetadata(tool: SupportedTool, version: SchemaVersion): SchemaMetadata | undefined {
    const key = `${tool}/${version}`;
    return this.schemas.get(key);
  }

  /**
   * Get all available versions for a tool
   */
  getVersions(tool: SupportedTool): SchemaVersion[] {
    const versions: SchemaVersion[] = [];
    for (const [key, metadata] of this.schemas) {
      if (metadata.tool === tool) {
        versions.push(metadata.version);
      }
    }
    return versions;
  }

  /**
   * Get the latest version for a tool
   */
  getLatestVersion(tool: SupportedTool): SchemaVersion | undefined {
    const versions = this.getVersions(tool);
    return versions.sort().pop();
  }

  /**
   * List all supported tools
   */
  getSupportedTools(): SupportedTool[] {
    const tools = new Set<SupportedTool>();
    for (const metadata of this.schemas.values()) {
      tools.add(metadata.tool);
    }
    return Array.from(tools);
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(tool: SupportedTool, version: SchemaVersion, config: unknown): { valid: boolean; errors?: string[] } {
    const schema = this.getSchema(tool, version);
    if (!schema) {
      return { valid: false, errors: [`Schema not found: ${tool}/${version}`] };
    }

    // Basic validation - check required fields and types
    const errors: string[] = [];
    
    if (typeof config !== 'object' || config === null) {
      return { valid: false, errors: ['Configuration must be an object'] };
    }

    const configObj = config as Record<string, unknown>;

    // Check required properties
    if (schema.required && Array.isArray(schema.required)) {
      for (const prop of schema.required) {
        if (!(prop in configObj)) {
          errors.push(`Missing required property: ${prop}`);
        }
      }
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Detect schema version from configuration
   */
  detectVersion(tool: SupportedTool, config: unknown): SchemaVersion | undefined {
    const versions = this.getVersions(tool);
    
    // Try each version, starting with latest
    for (const version of versions.sort().reverse()) {
      const result = this.validateConfig(tool, version, config);
      if (result.valid) {
        return version;
      }
    }

    return undefined;
  }

  /**
   * Create a migration version lock
   */
  createVersionLock(
    sourceTool: SupportedTool,
    sourceVersion: SchemaVersion,
    targetTool: SupportedTool,
    targetVersion: SchemaVersion
  ): MigrationVersionLock {
    const lock: MigrationVersionLock = {
      sourceTool,
      sourceVersion,
      targetTool,
      targetVersion,
      timestamp: new Date().toISOString(),
      migrationId: this.generateMigrationId()
    };

    this.migrationLocks.set(lock.migrationId, lock);
    return lock;
  }

  /**
   * Get migration version lock by ID
   */
  getVersionLock(migrationId: string): MigrationVersionLock | undefined {
    return this.migrationLocks.get(migrationId);
  }

  /**
   * Get schema differences between two versions
   */
  getSchemaDiff(
    sourceTool: SupportedTool,
    sourceVersion: SchemaVersion,
    targetTool: SupportedTool,
    targetVersion: SchemaVersion
  ): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const sourceSchema = this.getSchema(sourceTool, sourceVersion);
    const targetSchema = this.getSchema(targetTool, targetVersion);

    if (!sourceSchema || !targetSchema) {
      return { added: [], removed: [], modified: [] };
    }

    const sourceProps = Object.keys(sourceSchema.properties || {});
    const targetProps = Object.keys(targetSchema.properties || {});

    return {
      added: targetProps.filter(p => !sourceProps.includes(p)),
      removed: sourceProps.filter(p => !targetProps.includes(p)),
      modified: sourceProps.filter(p => targetProps.includes(p))
    };
  }

  private generateMigrationId(): string {
    return `mig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const schemaRegistry = new SchemaRegistry();

// Re-export schemas for direct access
export { claudeV1, claudeV2, opencodeV1, geminiV1, cursorV1, copilotV1 };
