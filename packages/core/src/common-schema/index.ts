/**
 * Common Schema Module
 * 
 * Canonical intermediate format for all tool configurations.
 * 
 * Usage:
 *   import { 
 *     CommonSchema, 
 *     CommonAgent, 
 *     OpenCodeNormalizer,
 *     OpenCodeAdapter 
 *   } from '@agent-sync/core/common-schema';
 * 
 * Migration Flow:
 *   OpenCode Dir → OpenCodeToolParser → OpenCodeToolModel 
 *     → OpenCodeNormalizer → CommonSchema 
 *     → OpenCodeAdapter → OpenCodeToolModel 
 *     → OpenCodeWriter → Target Dir
 */

// Types
export {
  COMMON_SCHEMA_VERSION,
  CommonSchema,
  CommonAgent,
  CommonSkill,
  CommonMCP,
  CommonMetadata,
  createEmptySchema,
  isCommonAgent,
  isCommonSchema
} from './types.js';

// Normalizer/Adapter interfaces and orchestrator
export {
  ToolNormalizer,
  ToolAdapter,
  CommonSchemaMigrationOrchestrator
} from './normalizer.js';

// Tool-specific normalizers and adapters (re-exported from parsers)
export { OpenCodeNormalizer, createOpenCodeNormalizer } from '../parsers/opencode/normalizer.js';
export { OpenCodeAdapter, createOpenCodeAdapter } from '../parsers/opencode/adapter.js';
