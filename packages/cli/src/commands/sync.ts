import { Command } from 'commander';
import chalk from 'chalk';
import { AIDirectoryScanner } from '@agent-sync/core';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { DetectedFile, ScanResult } from '@agent-sync/core';

interface SyncOptions {
  scope?: 'current' | 'home' | 'system';
  depth?: string;
}

interface SyncState {
  timestamp: string;
  files: Array<{
    id: string;
    path: string;
    name: string;
    type: string;
    tool?: string;
    size: number;
    lastModified: string;
  }>;
  summary: {
    totalFiles: number;
    agents: number;
    skills: number;
    configs: number;
    tools: string[];
  };
}

interface SyncChanges {
  added: DetectedFile[];
  removed: DetectedFile[];
  modified: DetectedFile[];
  unchanged: DetectedFile[];
}

const STATE_DIR = join(homedir(), '.agentsync');
const STATE_FILE = join(STATE_DIR, 'last-scan.json');

/**
 * Create the sync command
 */
export function createSyncCommand(): Command {
  const command = new Command('sync');

  command
    .description('Sync and detect changes since last scan')
    .option('-s, --scope <scope>', 'Scan scope: current, home, or system', 'current')
    .option('-d, --depth <depth>', 'Scan depth (1-10)', '10')
    .action(async (options: SyncOptions) => {
      console.log(chalk.bold('\n🔄 AgentSync Sync\n'));

      try {
        await runSync(options);
      } catch (error) {
        console.error(chalk.red('Sync failed:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

/**
 * Run sync operation
 */
async function runSync(options: SyncOptions): Promise<void> {
  // Check if we have a previous state
  const hasPreviousState = existsSync(STATE_FILE);
  
  if (!hasPreviousState) {
    console.log(chalk.yellow('⚠ No previous scan found. Running initial scan...\n'));
  } else {
    const lastState = loadLastState();
    console.log(chalk.gray(`Last sync: ${new Date(lastState.timestamp).toLocaleString()}\n`));
  }

  // Map scope options
  let scanScope: 'project' | 'global' | 'both' = 'project';
  if (options.scope === 'home') scanScope = 'global';
  if (options.scope === 'system') scanScope = 'both';

  console.log(chalk.blue('📡 Scanning for changes...'));

  // Create scanner
  const scanner = new AIDirectoryScanner({
    scope: scanScope,
    maxDepth: parseInt(options.depth || '10', 10),
  });

  // Run scan
  const result = await scanner.scan();

  if (!hasPreviousState) {
    // First scan - just save state and show summary
    saveState(result);
    displayInitialScan(result);
  } else {
    // Compare with previous state
    const lastState = loadLastState();
    const changes = compareStates(lastState, result);
    
    // Display changes
    displayChanges(changes, result);
    
    // Save new state
    saveState(result);
  }
}

/**
 * Compare current scan with previous state
 */
function compareStates(lastState: SyncState, currentResult: ScanResult): SyncChanges {
  const lastFiles = new Map(lastState.files.map(f => [f.path, f]));
  const currentFiles = new Map(currentResult.files.map(f => [f.path, f]));

  const added: DetectedFile[] = [];
  const removed: DetectedFile[] = [];
  const modified: DetectedFile[] = [];
  const unchanged: DetectedFile[] = [];

  // Find added and modified files
  for (const file of currentResult.files) {
    const lastFile = lastFiles.get(file.path);
    
    if (!lastFile) {
      // New file
      added.push(file);
    } else if (new Date(lastFile.lastModified).getTime() !== file.lastModified.getTime() || 
               lastFile.size !== file.size) {
      // Modified file
      modified.push(file);
    } else {
      // Unchanged
      unchanged.push(file);
    }
  }

  // Find removed files
  for (const lastFile of lastState.files) {
    if (!currentFiles.has(lastFile.path)) {
      removed.push({
        id: lastFile.id,
        path: lastFile.path,
        name: lastFile.name,
        type: lastFile.type as 'agent' | 'skill' | 'config',
        scope: 'project',
        tool: lastFile.tool,
        size: lastFile.size,
        lastModified: new Date(lastFile.lastModified),
      } as DetectedFile);
    }
  }

  return { added, removed, modified, unchanged };
}

/**
 * Display changes to user
 */
function displayChanges(changes: SyncChanges, currentResult: ScanResult): void {
  const totalChanges = changes.added.length + changes.removed.length + changes.modified.length;

  if (totalChanges === 0) {
    console.log(chalk.green('\n✓ No changes detected. Everything is up to date!\n'));
    console.log(chalk.gray(`Found ${changes.unchanged.length} existing files`));
    return;
  }

  console.log(chalk.bold(`\n📊 Changes Detected: ${totalChanges} item(s)\n`));

  // Added files
  if (changes.added.length > 0) {
    console.log(chalk.green(`➕ Added (${changes.added.length}):`));
    changes.added.forEach(file => {
      const icon = getIconForType(file.type);
      const toolIcon = getToolIcon(file.tool);
      console.log(`  ${icon} ${toolIcon} ${chalk.white(file.name)} ${chalk.gray(file.path)}`);
    });
    console.log();
  }

  // Removed files
  if (changes.removed.length > 0) {
    console.log(chalk.red(`➖ Removed (${changes.removed.length}):`));
    changes.removed.forEach(file => {
      const icon = getIconForType(file.type);
      const toolIcon = getToolIcon(file.tool);
      console.log(`  ${icon} ${toolIcon} ${chalk.strikethrough(file.name)} ${chalk.gray(file.path)}`);
    });
    console.log();
  }

  // Modified files
  if (changes.modified.length > 0) {
    console.log(chalk.yellow(`✏️  Modified (${changes.modified.length}):`));
    changes.modified.forEach(file => {
      const icon = getIconForType(file.type);
      const toolIcon = getToolIcon(file.tool);
      console.log(`  ${icon} ${toolIcon} ${chalk.white(file.name)} ${chalk.gray(file.path)}`);
    });
    console.log();
  }

  // Summary
  console.log(chalk.bold('📈 Summary:'));
  console.log(`  Total files: ${currentResult.files.length}`);
  console.log(`  Agents: ${currentResult.agents.length}`);
  console.log(`  Skills: ${currentResult.skills.length}`);
  console.log(`  Configs: ${currentResult.configs.length}`);
  
  // Detected tools
  const tools = [...new Set(currentResult.files.map(f => f.tool).filter((t): t is string => typeof t === 'string'))];
  if (tools.length > 0) {
    console.log(`  Tools: ${tools.map(t => getToolIcon(t)).join(' ')}`);
  }
  
  console.log();
}

/**
 * Display initial scan results
 */
function displayInitialScan(result: ScanResult): void {
  console.log(chalk.green('\n✓ Initial scan complete!\n'));

  console.log(chalk.bold('📊 Summary:'));
  console.log(`  Total files: ${result.files.length}`);
  console.log(`  Agents: ${result.agents.length}`);
  console.log(`  Skills: ${result.skills.length}`);
  console.log(`  Configs: ${result.configs.length}`);

  // Detected tools
  const tools = [...new Set(result.files.map(f => f.tool).filter((t): t is string => typeof t === 'string'))];
  if (tools.length > 0) {
    console.log(`  Tools detected: ${tools.map(t => `${getToolIcon(t)} ${t}`).join(', ')}`);
  }

  console.log(chalk.gray('\nRun "agentsync sync" again to detect changes.\n'));
}

/**
 * Get icon for file type
 */
function getIconForType(type: string): string {
  switch (type) {
    case 'agent': return '🤖';
    case 'skill': return '📚';
    case 'config': return '⚙️';
    default: return '📄';
  }
}

/**
 * Get icon for tool
 */
function getToolIcon(tool?: string): string {
  switch (tool) {
    case 'opencode': return '🔵';
    case 'claude': return '🟠';
    case 'cursor': return '🟢';
    case 'gemini': return '🟣';
    case 'copilot': return '⚪';
    default: return '⚪';
  }
}

/**
 * Save scan state to file
 */
function saveState(result: ScanResult): void {
  // Ensure state directory exists
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }

  const state: SyncState = {
    timestamp: new Date().toISOString(),
    files: result.files.map(f => ({
      id: f.id,
      path: f.path,
      name: f.name,
      type: f.type,
      tool: f.tool,
      size: f.size,
      lastModified: f.lastModified.toISOString(),
    })),
    summary: {
      totalFiles: result.files.length,
      agents: result.agents.length,
      skills: result.skills.length,
      configs: result.configs.length,
      tools: [...new Set(result.files.map(f => f.tool).filter(Boolean) as string[])],
    },
  };

  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Load last scan state from file
 */
function loadLastState(): SyncState {
  const content = readFileSync(STATE_FILE, 'utf-8');
  return JSON.parse(content) as SyncState;
}
