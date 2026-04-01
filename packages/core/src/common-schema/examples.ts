/**
 * Cross-Tool Migration Example
 * 
 * This example demonstrates the Common Schema architecture by migrating
 * between Claude and OpenCode using the canonical intermediate format.
 * 
 * Flow:
 *   Claude Config → ClaudeNormalizer → Common Schema → OpenCodeAdapter → OpenCode Config
 *   
 * Benefits:
 *   - Single code path for all migrations
 *   - Lossless conversion via metadata.extensions
 *   - Easy to add new tools (just normalizer + adapter)
 */

import { 
  ClaudeToolParser,
  ClaudeNormalizer,
  ClaudeAdapter,
  OpenCodeToolParser,
  OpenCodeNormalizer,
  OpenCodeAdapter,
  type ClaudeToolModel,
  type OpenCodeToolModel
} from '../parsers/index.js';
import type { CommonSchema } from './types.js';
import { CommonSchemaMigrationOrchestrator } from './normalizer.js';

/**
 * Example: Migrate Claude configuration to OpenCode
 */
export async function migrateClaudeToOpenCodeExample() {
  console.log('=== Claude → OpenCode Migration Example ===\n');

  // Step 1: Parse Claude configuration
  console.log('1. Parsing Claude configuration...');
  const claudeParser = new ClaudeToolParser();
  // In real usage: await claudeParser.scan('~/.config/claude')
  const claudeConfig: ClaudeToolModel = {
    tool: 'claude',
    rootPath: '~/.config/claude',
    mcpServers: [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/user/projects'],
        env: { NODE_ENV: 'production' }
      },
      {
        name: 'git',
        command: 'uvx',
        args: ['mcp-server-git', '--repository', '/home/user/projects/myapp']
      }
    ],
    agents: [
      {
        name: 'Code Reviewer',
        description: 'Reviews code for best practices',
        systemPrompt: 'You are an expert code reviewer. Focus on security, performance, and maintainability.',
        tools: ['read_file', 'write_file', 'run_command']
      },
      {
        name: 'Documentation Writer',
        description: 'Writes clear documentation',
        systemPrompt: 'Write comprehensive documentation with examples.',
        tools: ['read_file', 'write_file']
      }
    ],
    discovered: {
      agentCount: 2,
      skillCount: 0,
      mcpServerCount: 2
    }
  };

  console.log(`   Found ${claudeConfig.mcpServers?.length} MCP servers`);
  console.log(`   Found ${claudeConfig.agents?.length} agents\n`);

  // Step 2: Normalize to Common Schema
  console.log('2. Normalizing to Common Schema...');
  const claudeNormalizer = new ClaudeNormalizer();
  const commonSchema = claudeNormalizer.toCommonSchema(claudeConfig);

  console.log(`   Common Schema version: ${commonSchema.version}`);
  console.log(`   Agents: ${commonSchema.agents.length}`);
  console.log(`   MCPs: ${commonSchema.mcps.length}`);
  console.log(`   Skills: ${commonSchema.skills.length}`);
  console.log(`   Source: ${commonSchema.metadata.sourceTools.join(', ')}\n`);

  // Step 3: Display Common Schema structure
  console.log('3. Common Schema Contents:');
  console.log('   Agents:');
  commonSchema.agents.forEach(agent => {
    console.log(`     - ${agent.name}: ${agent.description}`);
    console.log(`       ID: ${agent.id}`);
    const tools = (agent.metadata.extensions?.claude as Record<string, unknown>)?.originalTools as string[];
    console.log(`       Tools: ${tools?.join(', ') || 'none'}`);
  });
    console.log('   MCP Servers:');
  commonSchema.mcps.forEach(mcp => {
    console.log(`     - ${mcp.name} (${mcp.type})`);
    console.log(`       Command: ${mcp.command} ${(mcp.args || []).join(' ')}`);
  });
  console.log();

  // Step 4: Adapt to OpenCode format
  console.log('4. Adapting to OpenCode format...');
  const openCodeAdapter = new OpenCodeAdapter();
  const openCodeConfig = openCodeAdapter.fromCommonSchema(commonSchema);

  console.log(`   Created OpenCode model with:`);
  console.log(`   - ${openCodeConfig.mcpServers?.length} MCP servers`);
  console.log(`   - ${openCodeConfig.agents?.length} agents`);
  console.log(`   - ${openCodeConfig.skills?.length} skills\n`);

  // Step 5: Show OpenCode output structure
  console.log('5. OpenCode Configuration:');
  console.log('   agents/');
  openCodeConfig.agents?.forEach(agent => {
    console.log(`     └── ${agent.name}/`);
    console.log(`         └── agent.md`);
  });
  console.log('   opencode.json');
  console.log('     └── mcp:');
  openCodeConfig.mcpServers?.forEach(mcp => {
    console.log(`         └── ${mcp.name}:`);
    console.log(`             type: ${mcp.type}`);
    console.log(`             command: ${mcp.command}`);
  });
  console.log();

  console.log('=== Migration Complete ===');
  console.log('The Claude configuration has been successfully migrated to OpenCode format!');
  console.log();

  return { claudeConfig, commonSchema, openCodeConfig };
}

/**
 * Example: Migrate OpenCode configuration to Claude
 */
export async function migrateOpenCodeToClaudeExample() {
  console.log('=== OpenCode → Claude Migration Example ===\n');

  // Step 1: Parse OpenCode configuration
  console.log('1. Parsing OpenCode configuration...');
  // In real usage: await openCodeParser.scan('./.opencode')
  const openCodeConfig: OpenCodeToolModel = {
    tool: 'opencode',
    rootPath: './.opencode',
    mcpServers: [
      {
        name: 'github',
        type: 'remote',
        command: 'https://api.github.com/mcp',
        args: [],
        url: 'https://api.github.com/mcp',
        headers: { Authorization: 'Bearer token123' }
      },
      {
        name: 'postgres',
        type: 'local',
        command: 'docker run -i postgres-mcp',
        args: ['-i', 'postgres-mcp'],
        env: { DATABASE_URL: 'postgresql://localhost/mydb' }
      }
    ],
    agents: [
      {
        name: 'Database Expert',
        description: 'Expert in PostgreSQL and database design',
        systemPrompt: 'You are a PostgreSQL expert. Help optimize queries and design schemas.',
        tools: ['query', 'analyze', 'migrate']
      }
    ],
    skills: [
      {
        name: 'SQL Optimization',
        description: 'Optimizes SQL queries',
        instructions: 'Analyze query execution plans and suggest indexes.',
        enabled: true,
        content: '# SQL Optimization\n\n1. Check EXPLAIN output\n2. Look for sequential scans\n3. Suggest appropriate indexes',
        path: 'skills/sql-optimization/skill.md'
      }
    ],
    settings: {
      model: 'gpt-4-turbo',
      temperature: 0.3
    },
    discovered: {
      agentCount: 1,
      skillCount: 1,
      mcpServerCount: 2
    }
  };

  console.log(`   Found ${openCodeConfig.mcpServers?.length} MCP servers`);
  console.log(`   Found ${openCodeConfig.agents?.length} agents`);
  console.log(`   Found ${openCodeConfig.skills?.length} skills\n`);

  // Step 2: Normalize to Common Schema
  console.log('2. Normalizing to Common Schema...');
  const openCodeNormalizer = new OpenCodeNormalizer();
  const commonSchema = openCodeNormalizer.toCommonSchema(openCodeConfig);

  console.log(`   Common Schema version: ${commonSchema.version}`);
  console.log(`   Agents: ${commonSchema.agents.length}`);
  console.log(`   MCPs: ${commonSchema.mcps.length}`);
  console.log(`   Skills: ${commonSchema.skills.length}\n`);

  // Step 3: Adapt to Claude format
  console.log('3. Adapting to Claude format...');
  console.log('   Note: Claude only supports local MCP servers');
  console.log('   Remote MCPs will be skipped...\n');
  
  const claudeAdapter = new ClaudeAdapter();
  const claudeConfig = claudeAdapter.fromCommonSchema(commonSchema);

  console.log(`   Created Claude model with:`);
  console.log(`   - ${claudeConfig.mcpServers?.length} MCP servers (local only)`);
  console.log(`   - ${claudeConfig.agents?.length} agents`);
  console.log(`   - Skills converted to agent tools\n`);

  // Step 4: Show Claude output
  console.log('4. Claude Configuration (settings.json):');
  console.log(JSON.stringify({
    mcpServers: claudeConfig.mcpServers?.reduce((acc, mcp) => ({
      ...acc,
      [mcp.name]: {
        command: mcp.command,
        args: mcp.args,
        env: mcp.env
      }
    }), {}),
    agents: claudeConfig.agents?.reduce((acc, agent) => ({
      ...acc,
      [agent.name]: {
        description: agent.description,
        system_prompt: agent.systemPrompt,
        tools: agent.tools
      }
    }), {})
  }, null, 2));
  console.log();

  console.log('=== Migration Complete ===');
  console.log('The OpenCode configuration has been successfully migrated to Claude format!');
  console.log('Note: Remote MCP servers (GitHub) were skipped as Claude only supports local MCPs.');
  console.log();

  return { openCodeConfig, commonSchema, claudeConfig };
}

/**
 * Example: Using the Migration Orchestrator
 */
export async function usingMigrationOrchestratorExample() {
  console.log('=== Using MigrationOrchestrator ===\n');

  // Create orchestrator and register normalizers/adapters
  const orchestrator = new CommonSchemaMigrationOrchestrator();
  
  orchestrator.registerNormalizer(new ClaudeNormalizer());
  orchestrator.registerNormalizer(new OpenCodeNormalizer());
  
  orchestrator.registerAdapter(new ClaudeAdapter());
  orchestrator.registerAdapter(new OpenCodeAdapter());

  console.log('Registered tools:');
  const registered = orchestrator.getRegisteredTools();
  console.log(`  Normalizers: ${registered.normalizers.join(', ')}`);
  console.log(`  Adapters: ${registered.adapters.join(', ')}\n`);

  // Example migration using orchestrator
  const claudeConfig: ClaudeToolModel = {
    tool: 'claude',
    rootPath: '~/.config/claude',
    agents: [
      { name: 'Test Agent', description: 'A test agent' }
    ],
    discovered: { agentCount: 1, skillCount: 0, mcpServerCount: 0 }
  };

  console.log('Migrating Claude → OpenCode using orchestrator...');
  const openCodeConfig = orchestrator.migrate<ClaudeToolModel, OpenCodeToolModel>(
    'claude',
    'opencode',
    claudeConfig
  );

  console.log(`Success! Created OpenCode config with ${openCodeConfig.agents?.length} agents\n`);

  return orchestrator;
}

// Export all examples
export const examples = {
  claudeToOpenCode: migrateClaudeToOpenCodeExample,
  openCodeToClaude: migrateOpenCodeToClaudeExample,
  usingOrchestrator: usingMigrationOrchestratorExample
};
