// Schema Registry
export { schemaRegistry, SchemaRegistry } from './registry.js';
export type { 
  SupportedTool, 
  SchemaVersion, 
  SchemaMetadata, 
  MigrationVersionLock 
} from './registry.js';

// Individual schemas (for direct access)
export { 
  claudeV1, 
  claudeV2, 
  opencodeV1, 
  geminiV1, 
  cursorV1, 
  copilotV1 
} from './registry.js';

// Schema version information
export const SCHEMA_VERSIONS = {
  claude: ['v1', 'v2'] as const,
  opencode: ['v1'] as const,
  gemini: ['v1'] as const,
  cursor: ['v1'] as const,
  copilot: ['v1'] as const
};

// Latest versions per tool
export const LATEST_VERSIONS = {
  claude: 'v2' as const,
  opencode: 'v1' as const,
  gemini: 'v1' as const,
  cursor: 'v1' as const,
  copilot: 'v1' as const
};
