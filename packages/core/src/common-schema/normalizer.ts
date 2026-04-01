/**
 * Normalizer Interface
 * 
 * Normalizers convert tool-specific configurations to Common Schema.
 * Every supported tool must implement a normalizer.
 */

import type { CommonSchema } from './types.js';
import type { ToolName } from '../registry/tool-paths.registry.js';

/**
 * Normalizer interface - Tool → Common Schema
 */
export interface ToolNormalizer<ToolConfig> {
  /**
   * Convert tool-specific config to Common Schema
   */
  toCommonSchema(config: ToolConfig): CommonSchema;
  
  /**
   * Get the tool name this normalizer handles
   */
  getToolName(): ToolName;
  
  /**
   * Get the version of this normalizer
   */
  getVersion(): string;
}

/**
 * Adapter interface - Common Schema → Tool
 */
export interface ToolAdapter<ToolConfig> {
  /**
   * Convert Common Schema to tool-specific config
   */
  fromCommonSchema(schema: CommonSchema): ToolConfig;
  
  /**
   * Get the tool name this adapter handles
   */
  getToolName(): ToolName;
  
  /**
   * Get the version of this adapter
   */
  getVersion(): string;
}

/**
 * Common Schema Migration Service
 * Orchestrates Normalizer → Adapter workflow
 */
export class CommonSchemaMigrationOrchestrator {
  private normalizers: Map<ToolName, ToolNormalizer<unknown>>;
  private adapters: Map<ToolName, ToolAdapter<unknown>>;
  
  constructor() {
    this.normalizers = new Map();
    this.adapters = new Map();
  }
  
  /**
   * Register a normalizer
   */
  registerNormalizer<T>(normalizer: ToolNormalizer<T>): void {
    this.normalizers.set(normalizer.getToolName(), normalizer as ToolNormalizer<unknown>);
  }
  
  /**
   * Register an adapter
   */
  registerAdapter<T>(adapter: ToolAdapter<T>): void {
    this.adapters.set(adapter.getToolName(), adapter as ToolAdapter<unknown>);
  }
  
  /**
   * Check if we have a normalizer for a tool
   */
  hasNormalizer(tool: ToolName): boolean {
    return this.normalizers.has(tool);
  }
  
  /**
   * Check if we have an adapter for a tool
   */
  hasAdapter(tool: ToolName): boolean {
    return this.adapters.has(tool);
  }
  
  /**
   * Normalize a tool config to Common Schema
   */
  normalize<T>(tool: ToolName, config: T): CommonSchema {
    const normalizer = this.normalizers.get(tool);
    if (!normalizer) {
      throw new Error(`No normalizer registered for tool: ${tool}`);
    }
    return normalizer.toCommonSchema(config);
  }
  
  /**
   * Adapt Common Schema to a tool config
   */
  adapt<T>(tool: ToolName, schema: CommonSchema): T {
    const adapter = this.adapters.get(tool);
    if (!adapter) {
      throw new Error(`No adapter registered for tool: ${tool}`);
    }
    return adapter.fromCommonSchema(schema) as T;
  }
  
  /**
   * Perform migration via Common Schema
   * Tool A → Common Schema → Tool B
   */
  migrate<SourceConfig, TargetConfig>(
    sourceTool: ToolName,
    targetTool: ToolName,
    sourceConfig: SourceConfig
  ): TargetConfig {
    // Step 1: Normalize source to Common Schema
    const commonSchema = this.normalize(sourceTool, sourceConfig);
    
    // Step 2: Adapt Common Schema to target
    return this.adapt<TargetConfig>(targetTool, commonSchema);
  }
  
  /**
   * Get registered tool names
   */
  getRegisteredTools(): { normalizers: ToolName[]; adapters: ToolName[] } {
    return {
      normalizers: Array.from(this.normalizers.keys()),
      adapters: Array.from(this.adapters.keys())
    };
  }
}
