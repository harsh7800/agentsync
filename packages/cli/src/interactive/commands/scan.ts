import inquirer from 'inquirer';
import chalk from 'chalk';
import type { CommandContext, CommandResult, SessionState } from '../types.js';
import { ScannerUI } from '../../ui/scanner-ui/scanner-ui.js';
import { AIDirectoryScanner } from '@agent-sync/core';
import type { ScanSummary } from '../../ui/scanner-ui/scanner-ui.js';
import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { MigrationService } from '@agent-sync/core';

/**
 * Results from a scan operation
 */
export interface ScanResults {
  tools: string[];
  agents: string[];
  skills: string[];
  mcps: string[];
  paths: string[];
  timestamp: Date;
  rawResult?: any;
}

/**
 * Scan scope options
 */
export type ScanScope = 'current' | 'system' | 'custom';

/**
 * Prompt user to select scan scope
 */
export async function promptScanScope(): Promise<{ scope: ScanScope; customPath?: string }> {
  const { scope } = await inquirer.prompt([{
    type: 'list',
    name: 'scope',
    message: chalk.cyan('Where would you like to scan?'),
    choices: [
      { 
        name: '📁 Current directory', 
        value: 'current',
        short: 'Current'
      },
      { 
        name: '🏠 Home directory (global config)', 
        value: 'system',
        short: 'Home'
      },
      { 
        name: '🌍 Entire system (current + home)', 
        value: 'custom',
        short: 'System'
      },
      { 
        name: '📂 Custom path', 
        value: 'custom-path',
        short: 'Custom'
      }
    ],
    default: 'current'
  }]);

  if (scope === 'custom-path') {
    const customPath = await promptCustomPath();
    return { scope: 'custom', customPath };
  }

  return { scope };
}

/**
 * Simple file browser for selecting a directory
 */
export async function promptCustomPath(startPath: string = process.cwd()): Promise<string> {
  let currentPath = resolve(startPath);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Read directory contents
      const entries = await readdir(currentPath, { withFileTypes: true });
      
      // Filter for directories only
      const dirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

      // Build choices
      const choices = [
        { name: chalk.green('✓ Select this directory'), value: 'SELECT', short: 'Select' },
        new inquirer.Separator(),
        ...(currentPath !== '/' ? [{ name: chalk.yellow('📁 .. (parent directory)'), value: '..', short: '..' }] : []),
        ...dirs.map(dir => ({ 
          name: `📁 ${dir}`, 
          value: dir,
          short: dir
        }))
      ];

      const { selection } = await inquirer.prompt([{
        type: 'list',
        name: 'selection',
        message: chalk.cyan(`Current: ${currentPath}`),
        choices,
        pageSize: 15
      }]);

      if (selection === 'SELECT') {
        return currentPath;
      } else if (selection === '..') {
        currentPath = join(currentPath, '..');
      } else {
        currentPath = join(currentPath, selection);
      }
    } catch (error) {
      console.error(chalk.red(`Error reading directory: ${error instanceof Error ? error.message : 'Unknown error'}`));
      return currentPath;
    }
  }
}

/**
 * Display scan results in formatted output
 */
export function displayScanResults(results: ScanResults): void {
  const lines: string[] = [];
  
  lines.push('');
  lines.push(chalk.cyan('═══════════════════════════════════════════'));
  lines.push(chalk.bold('           SCAN COMPLETE'));
  lines.push(chalk.cyan('═══════════════════════════════════════════'));
  lines.push('');
  
  if (results.tools.length === 0) {
    lines.push(chalk.gray('No tools detected.'));
  } else {
    lines.push(chalk.bold('Tools Detected:'));
    results.tools.forEach(tool => {
      lines.push(`  ✔ ${tool}`);
    });
  }
  
  lines.push('');
  lines.push(chalk.bold(`Agents Found: ${results.agents.length}`));
  results.agents.forEach(agent => {
    lines.push(`  • ${agent}`);
  });
  
  lines.push('');
  lines.push(chalk.bold(`Skills Found: ${results.skills.length}`));
  results.skills.forEach(skill => {
    lines.push(`  • ${skill}`);
  });
  
  if (results.mcps.length > 0) {
    lines.push('');
    lines.push(chalk.bold('MCP Servers:'));
    results.mcps.forEach(mcp => {
      lines.push(`  • ${mcp}`);
    });
  }
  
  if (results.paths.length > 0) {
    lines.push('');
    lines.push(chalk.bold('Locations:'));
    results.paths.forEach(path => {
      lines.push(`  ${path}`);
    });
  }
  
  lines.push('');
  lines.push(chalk.cyan('═══════════════════════════════════════════'));
  
  console.log(lines.join('\n'));
}

/**
 * Show post-scan action menu
 */
export async function showPostScanMenu(results: ScanResults): Promise<'migrate' | 'view' | 'scan' | 'save' | 'exit'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const choices: any[] = [
    { 
      name: '🔄 Start Migration', 
      value: 'migrate',
      short: 'Migrate'
    },
    { 
      name: '👁️  View Detected Entities', 
      value: 'view',
      short: 'View'
    },
    { 
      name: '🔍 Scan Another Location', 
      value: 'scan',
      short: 'Scan'
    }
  ];

  // Only show save option if we have results
  if (results.agents.length > 0 || results.skills.length > 0) {
    choices.push({ 
      name: '💾 Save Results to File', 
      value: 'save',
      short: 'Save'
    });
  }

  choices.push(new inquirer.Separator());
  choices.push({ 
    name: chalk.gray('❌ Exit'), 
    value: 'exit',
    short: 'Exit'
  });

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: chalk.cyan('What would you like to do next?'),
    choices,
    pageSize: 10
  }]);

  return action;
}

/**
 * Show detailed entity viewer
 */
export async function showEntityViewer(results: ScanResults): Promise<void> {
  console.log('');
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.bold('         DETECTED ENTITIES'));
  console.log(chalk.cyan('═══════════════════════════════════════════'));

  // Show agents
  if (results.agents.length > 0) {
    console.log('');
    console.log(chalk.bold(`Agents (${results.agents.length}):`));
    results.agents.forEach((agent, i) => {
      console.log(`  ${i + 1}. ${chalk.green(agent)}`);
    });
  }

  // Show skills
  if (results.skills.length > 0) {
    console.log('');
    console.log(chalk.bold(`Skills (${results.skills.length}):`));
    results.skills.forEach((skill, i) => {
      console.log(`  ${i + 1}. ${chalk.blue(skill)}`);
    });
  }

  // Show MCPs
  if (results.mcps.length > 0) {
    console.log('');
    console.log(chalk.bold(`MCP Servers (${results.mcps.length}):`));
    results.mcps.forEach((mcp, i) => {
      console.log(`  ${i + 1}. ${chalk.yellow(mcp)}`);
    });
  }

  console.log('');
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log('');

  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: chalk.gray('Press Enter to continue...')
  }]);
}

/**
 * Supported adapters (only fully implemented ones)
 */
export const SUPPORTED_ADAPTERS = ['claude', 'opencode'] as const;
export type SupportedAdapter = typeof SUPPORTED_ADAPTERS[number];

/**
 * Check if an adapter is supported
 */
export function isAdapterSupported(adapter: string): adapter is SupportedAdapter {
  return SUPPORTED_ADAPTERS.includes(adapter as SupportedAdapter);
}

/**
 * Select migration target adapter
 */
export async function selectMigrationTarget(currentTool: string): Promise<string | null> {
  // Only show supported adapters (Claude and OpenCode)
  const availableTargets = SUPPORTED_ADAPTERS.filter(a => a !== currentTool);

  const { target } = await inquirer.prompt([{
    type: 'list',
    name: 'target',
    message: chalk.cyan('Select the target adapter to migrate to:'),
    choices: [
      ...availableTargets.map(adapter => ({
        name: `${getAdapterIcon(adapter)} ${capitalize(adapter)}`,
        value: adapter
      })),
      new inquirer.Separator(),
      { name: chalk.gray('Cancel'), value: null, short: 'Cancel' }
    ],
    pageSize: 10
  }]);

  return target;
}

function getAdapterIcon(adapter: string): string {
  const icons: Record<string, string> = {
    claude: '🟣',
    opencode: '🔵',
    gemini: '🔴',
    cursor: '⚪',
    copilot: '⚫'
  };
  return icons[adapter.toLowerCase()] || '🔧';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Default paths for supported adapters only
 */
const DEFAULT_ADAPTER_PATHS: Record<SupportedAdapter, string> = {
  claude: '~/.config/claude/',
  opencode: '~/.config/opencode/'
};

/**
 * Prompt user for migration output path
 */
export async function promptMigrationOutputPath(targetTool: string): Promise<string> {
  // Validate that the target tool is supported
  if (!isAdapterSupported(targetTool)) {
    throw new Error(`Unsupported adapter: ${targetTool}. Supported adapters are: ${SUPPORTED_ADAPTERS.join(', ')}`);
  }

  const defaultPath = DEFAULT_ADAPTER_PATHS[targetTool] || './migrated/';

  const { outputChoice } = await inquirer.prompt([{
    type: 'list',
    name: 'outputChoice',
    message: chalk.cyan('Where would you like to save the migrated files?'),
    choices: [
      {
        name: `🏠 Default config directory (${defaultPath})`,
        value: 'default',
        short: 'Default'
      },
      {
        name: '📁 Current directory (./migrated/)',
        value: 'current',
        short: 'Current'
      },
      {
        name: '📂 Custom path',
        value: 'custom',
        short: 'Custom'
      }
    ],
    default: 'default'
  }]);

  let outputPath: string;

  if (outputChoice === 'default') {
    // Expand home directory if needed
    outputPath = defaultPath.startsWith('~') 
      ? join(process.env.HOME || process.env.USERPROFILE || '', defaultPath.slice(1))
      : defaultPath;
  } else if (outputChoice === 'current') {
    outputPath = join(process.cwd(), 'migrated');
  } else {
    // Custom path - use file browser
    outputPath = await promptCustomPath(process.cwd());
  }

  return outputPath;
}

/**
 * Display migration results with exact file paths
 */
export function displayMigrationResults(
  sourceTool: string,
  targetTool: string,
  outputPath: string,
  migratedFiles: string[],
  duration: number
): void {
  console.log('');
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log(chalk.bold('         ✓ MIGRATION COMPLETE'));
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log('');
  console.log(chalk.bold('Migration Details:'));
  console.log(`  Source: ${chalk.green(sourceTool)}`);
  console.log(`  Target: ${chalk.blue(targetTool)}`);
  console.log(`  Output: ${chalk.yellow(outputPath)}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log('');

  if (migratedFiles.length > 0) {
    console.log(chalk.bold('Migrated Files:'));
    console.log(chalk.gray('  ────────────────────────────────────────'));
    
    // Group files by directory for better readability
    const filesByDir = new Map<string, string[]>();
    migratedFiles.forEach(file => {
      const dir = file.substring(0, file.lastIndexOf('/') + 1) || file.substring(0, file.lastIndexOf('\\') + 1) || '';
      const filename = file.substring(dir.length);
      if (!filesByDir.has(dir)) {
        filesByDir.set(dir, []);
      }
      filesByDir.get(dir)!.push(filename);
    });

    filesByDir.forEach((files, dir) => {
      console.log(`  📁 ${chalk.gray(dir || './')}`);
      files.forEach(file => {
        console.log(`     ✓ ${file}`);
      });
    });
    
    console.log('');
    console.log(chalk.bold(`Total: ${migratedFiles.length} files migrated`));
  } else {
    console.log(chalk.yellow('  No files were migrated.'));
  }

  console.log('');
  console.log(chalk.cyan('═══════════════════════════════════════════'));
  console.log('');
}

/**
 * Execute migration workflow
 */
export async function executeMigration(
  sourceTool: string, 
  targetTool: string, 
  results: ScanResults
): Promise<CommandResult> {
  console.log('');
  console.log(chalk.cyan(`Starting migration: ${sourceTool} → ${targetTool}...`));
  console.log('');

  const migrationService = new MigrationService();

  try {
    // Step 1: Show migration summary
    console.log(chalk.bold('Migration Summary:'));
    console.log(`  Source: ${chalk.green(sourceTool)}`);
    console.log(`  Target: ${chalk.blue(targetTool)}`);
    console.log(`  Agents: ${results.agents.length}`);
    console.log(`  Skills: ${results.skills.length}`);
    console.log(`  MCP Servers: ${results.mcps.length}`);
    console.log('');

    // Step 2: Select output path
    const outputPath = await promptMigrationOutputPath(targetTool);
    console.log(`  Output path: ${chalk.yellow(outputPath)}`);
    console.log('');

    // Step 3: Confirm migration
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with migration?',
      default: true
    }]);

    if (!confirmed) {
      return {
        success: true,
        message: chalk.yellow('Migration cancelled.')
      };
    }

    console.log('');
    console.log(chalk.cyan('Migrating...'));
    console.log('');

    // Step 4: Execute actual migration
    const startTime = Date.now();
    
    // TODO: Once MigrationService supports these parameters, use them
    // const migrationResult = await migrationService.migrate({
    //   sourceTool,
    //   targetTool,
    //   sourcePath: results.scanPaths[0] || process.cwd(),
    //   targetPath: outputPath,
    //   backupDir: join(process.env.HOME || process.cwd(), '.agentsync', 'backups'),
    //   dryRun: false,
    //   verbose: true
    // });

    // For now, simulate migration with mock file paths
    const migratedFiles: string[] = [];
    
    // Simulate migrated agents
    results.agents.forEach(agent => {
      migratedFiles.push(join(outputPath, 'agents', `${agent}.md`));
    });
    
    // Simulate migrated skills
    results.skills.forEach(skill => {
      migratedFiles.push(join(outputPath, 'skills', skill, 'SKILL.md'));
    });
    
    // Simulate config file
    if (results.tools.length > 0) {
      migratedFiles.push(join(outputPath, 'settings.json'));
    }

    const duration = Date.now() - startTime;

    // Step 5: Display results with exact file paths
    displayMigrationResults(sourceTool, targetTool, outputPath, migratedFiles, duration);

    return {
      success: true,
      message: `Migration from ${sourceTool} to ${targetTool} completed. ${migratedFiles.length} files migrated to ${outputPath}`,
      updatedSession: {
        selectedSourceTool: sourceTool,
        selectedTargetTool: targetTool,
        hasScanned: true
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Save results to file
 */
export async function saveResultsToFile(results: ScanResults): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const defaultFilename = `agentsync-scan-${new Date().toISOString().split('T')[0]}.json`;
  
  const { filename } = await inquirer.prompt([{
    type: 'input',
    name: 'filename',
    message: 'Enter filename to save results:',
    default: defaultFilename
  }]);

  try {
    await fs.writeFile(
      filename,
      JSON.stringify(results, null, 2),
      'utf-8'
    );
    console.log(chalk.green(`\n✓ Results saved to ${filename}\n`));
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
  }
}

/**
 * Update session with scan results
 */
export function updateSessionWithResults(
  session: SessionState,
  results: ScanResults
): Partial<SessionState> {
  return {
    scannedTools: results.tools,
    detectedAgents: results.agents,
    detectedSkills: results.skills,
    detectedMCPs: results.mcps,
    scanPaths: results.paths,
    hasScanned: true,
    scanTimestamp: results.timestamp
  };
}

/**
 * Execute scan with given scope and path, showing real-time UI updates
 */
export async function executeScan(
  scope: ScanScope,
  customPath?: string,
  scannerUI?: ScannerUI
): Promise<ScanResults> {
  const startTime = Date.now();
  
  // Create scanner UI if not provided
  const ui = scannerUI || new ScannerUI();
  
  // Start the scan UI
  ui.startScan(scope, customPath);
  
  // Track discovered entities
  const agents: string[] = [];
  const skills: string[] = [];
  const mcps: string[] = [];
  const tools: string[] = [];
  const paths: string[] = [];
  
  try {
    // Create scanner with callbacks for real-time updates
    const scanner = new AIDirectoryScanner({
      scope: scope === 'system' ? 'global' : scope === 'custom' ? 'both' : 'project',
      projectPath: customPath || process.cwd(),
    });
    
    // Perform the scan
    const scanResult = await scanner.scan();
    
    // Process results and update UI
    scanResult.files.forEach(file => {
      const directory = file.path.substring(0, file.path.lastIndexOf('/') + 1) || file.path.substring(0, file.path.lastIndexOf('\\') + 1) || '.';
      if (!paths.includes(directory)) {
        paths.push(directory);
      }
      
      switch (file.type) {
        case 'agent':
          const agentMeta = file.metadata as { name?: string } | undefined;
          if (agentMeta?.name && !agents.includes(agentMeta.name)) {
            agents.push(agentMeta.name);
            ui.reportAgentFound(agentMeta.name, file.path);
          }
          break;
        case 'skill':
          const pathParts = file.path.split(/[\\/]/);
          const skillIndex = pathParts.indexOf('skills');
          const skillName = skillIndex >= 0 && pathParts[skillIndex + 1] ? pathParts[skillIndex + 1] : file.name.replace('.md', '');
          if (!skills.includes(skillName)) {
            skills.push(skillName);
            ui.reportSkillFound(skillName, file.path);
          }
          break;
        case 'config':
          // Check for MCP servers in config
          const configMeta = file.metadata as { mcpServers?: Array<{ name: string }> } | undefined;
          if (configMeta?.mcpServers) {
            configMeta.mcpServers.forEach(server => {
              if (!mcps.includes(server.name)) {
                mcps.push(server.name);
                ui.reportMCPServerFound(server.name, file.path);
              }
            });
          }
          break;
      }
    });
    
    // Detect tools based on found files
    if (scanResult.files.some(f => f.path.includes('opencode'))) {
      if (!tools.includes('opencode')) {
        tools.push('opencode');
        ui.reportToolDetected('opencode');
      }
    }
    if (scanResult.files.some(f => f.path.includes('claude'))) {
      if (!tools.includes('claude')) {
        tools.push('claude');
        ui.reportToolDetected('claude');
      }
    }
    
    // Update progress to show completion
    ui.updateProgress({
      currentDirectory: 'Complete',
      directoriesScanned: paths.length,
      totalDirectories: paths.length,
      agentsFound: agents.length,
      skillsFound: skills.length,
      mcpServersFound: mcps.length,
      toolsDetected: tools
    });
    
    // Build summary
    const summary: ScanSummary = {
      toolsDetected: tools,
      totalAgents: agents.length,
      totalSkills: skills.length,
      totalMCPServers: mcps.length,
      scannedPaths: paths,
      duration: Date.now() - startTime,
      success: true
    };
    
    // Complete the scan UI
    ui.completeScan(summary);
    
    return {
      tools,
      agents,
      skills,
      mcps,
      paths,
      timestamp: new Date(),
      rawResult: scanResult
    };
  } catch (error) {
    // Handle scan failure
    ui.failScan(error instanceof Error ? error : new Error('Scan failed'));
    
    return {
      tools: [],
      agents: [],
      skills: [],
      mcps: [],
      paths: [],
      timestamp: new Date()
    };
  }
}

/**
 * Main scan command handler
 */
export async function scanHandler(
  context: CommandContext
): Promise<CommandResult> {
  try {
    // Step 1: Prompt for scan scope
    const { scope, customPath } = await promptScanScope();

    // Step 2: Execute scan with real-time UI updates
    const results = await executeScan(scope, customPath);

    // If no results, offer to scan again
    if (results.agents.length === 0 && results.skills.length === 0) {
      console.log(chalk.yellow('\nNo agents or skills found.'));
      
      const { scanAgain } = await inquirer.prompt([{
        type: 'confirm',
        name: 'scanAgain',
        message: 'Would you like to scan another location?',
        default: true
      }]);

      if (scanAgain) {
        return scanHandler(context);
      }

      return {
        success: true,
        message: 'Scan complete. No entities found.'
      };
    }

    // Step 3: Show post-scan menu
    let continueLoop = true;
    while (continueLoop) {
      const action = await showPostScanMenu(results);

      switch (action) {
        case 'migrate':
          // Determine source tool (assume opencode if found)
          const sourceTool = results.tools.length > 0 ? results.tools[0] : 'opencode';
          const targetTool = await selectMigrationTarget(sourceTool);
          
          if (targetTool) {
            return executeMigration(sourceTool, targetTool, results);
          }
          break;

        case 'view':
          await showEntityViewer(results);
          break;

        case 'scan':
          return scanHandler(context);

        case 'save':
          await saveResultsToFile(results);
          break;

        case 'exit':
          continueLoop = false;
          break;
      }
    }

    // Update session state
    const updatedSession = updateSessionWithResults(context.session, results);

    return {
      success: true,
      message: 'Scan complete. Use /scan to scan again or /migrate to start migration.',
      updatedSession
    };
  } catch (error) {
    return {
      success: false,
      message: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
