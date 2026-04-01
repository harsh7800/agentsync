import { Command } from 'commander';
import chalk from 'chalk';
import { AIDirectoryScanner, AICrossValidator } from '@agent-sync/core';
import { ScannerUI } from '../ui/scanner-ui/scanner-ui.js';
import { Colors } from '../ui/index.js';
import inquirer from 'inquirer';

interface ScanOptions {
  manual?: boolean;
  ai?: boolean;
  scope?: 'current' | 'home' | 'system';
  depth?: string;
  output?: string;
}

/**
 * Create the scan command
 */
export function createScanCommand(): Command {
  const command = new Command('scan');

  command
    .description('Scan for AI tool configurations and agents')
    .option('-m, --manual', 'Use manual scan mode (user-controlled)')
    .option('-a, --ai', 'Use AI-assisted scan mode with cross-validation')
    .option('-s, --scope <scope>', 'Scan scope: current, home, or system', 'current')
    .option('-d, --depth <depth>', 'Scan depth (1-10)', '10')
    .option('-o, --output <file>', 'Output results to file')
    .action(async (options: ScanOptions) => {
      console.log(chalk.bold('\n🔍 AgentSync Scanner\n'));

      // Determine scan mode
      const scanMode = await determineScanMode(options);
      
      if (scanMode === 'ai') {
        await runAIScan(options);
      } else {
        await runManualScan(options);
      }
    });

  return command;
}

/**
 * Determine which scan mode to use
 */
async function determineScanMode(options: ScanOptions): Promise<'manual' | 'ai'> {
  // Check explicit flags
  if (options.manual) return 'manual';
  if (options.ai) return 'ai';

  // Otherwise, prompt user
  const { mode } = await inquirer.prompt([{
    type: 'list',
    name: 'mode',
    message: 'Choose scan mode:',
    choices: [
      { name: '🤖 AI-Assisted (with cross-validation for accuracy)', value: 'ai' },
      { name: '👤 Manual (you control the scan scope and depth)', value: 'manual' }
    ]
  }]);

  return mode;
}

/**
 * Run AI-assisted scan with cross-validation
 */
async function runAIScan(options: ScanOptions): Promise<void> {
  const ui = new ScannerUI();
  
  try {
    // Map scope options
    let scanScope: 'project' | 'global' | 'both' = 'project';
    if (options.scope === 'home' || options.scope === 'system') {
      scanScope = 'global';
    }

    // Start scan UI
    ui.startScan(options.scope === 'current' ? 'current' : 'system');

    // Create scanner
    const scanner = new AIDirectoryScanner({
      scope: scanScope,
      maxDepth: parseInt(options.depth || '10', 10),
    });

    ui.updateProgress({
      currentDirectory: 'Initializing...',
      directoriesScanned: 0,
      totalDirectories: 1,
      agentsFound: 0,
      skillsFound: 0,
      mcpServersFound: 0,
      toolsDetected: []
    });

    // Run scan
    const result = await scanner.scan();

    // Update progress with results
    ui.updateProgress({
      currentDirectory: 'Complete',
      directoriesScanned: result.projectLevel.length + result.globalLevel.length,
      totalDirectories: result.projectLevel.length + result.globalLevel.length,
      agentsFound: result.agents.length,
      skillsFound: result.skills.length,
      mcpServersFound: result.configs.reduce((acc, c) => {
        const metadata = c.metadata as { mcpServers?: unknown[] } | undefined;
        return acc + (metadata?.mcpServers?.length || 0);
      }, 0),
      toolsDetected: result.agents.length > 0 || result.skills.length > 0 ? ['opencode'] : []
    });

    // Build summary
    const summary = {
      toolsDetected: result.agents.length > 0 || result.skills.length > 0 ? ['opencode'] : [],
      totalAgents: result.agents.length,
      totalSkills: result.skills.length,
      totalMCPServers: result.configs.reduce((acc, c) => {
        const metadata = c.metadata as { mcpServers?: unknown[] } | undefined;
        return acc + (metadata?.mcpServers?.length || 0);
      }, 0),
      scannedPaths: result.files.map(f => f.path),
      duration: result.duration,
      success: result.errors.length === 0
    };

    ui.completeScan(summary);

    // Display detailed results
    displayDetailedResults(result);

    // Optionally save to file
    if (options.output) {
      await saveResults(result, options.output);
    }

  } catch (error) {
    ui.failScan(error instanceof Error ? error : new Error('Scan failed'));
    console.error(Colors.error(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Run manual scan
 */
async function runManualScan(options: ScanOptions): Promise<void> {
  const ui = new ScannerUI();

  // Map scope options
  let scanScope: 'project' | 'global' | 'both' = 'project';
  if (options.scope === 'home' || options.scope === 'system') {
    scanScope = 'global';
  }

  ui.startScan(options.scope === 'current' ? 'current' : 'system');

  try {
    const scanner = new AIDirectoryScanner({
      scope: scanScope,
      maxDepth: parseInt(options.depth || '10', 10),
    });

    ui.updateProgress({
      currentDirectory: scanScope === 'project' ? process.cwd() : '~/.config/opencode',
      directoriesScanned: 0,
      totalDirectories: 1,
      agentsFound: 0,
      skillsFound: 0,
      mcpServersFound: 0,
      toolsDetected: []
    });

    const result = await scanner.scan();

    // Build summary
    const summary = {
      toolsDetected: result.agents.length > 0 || result.skills.length > 0 ? ['opencode'] : [],
      totalAgents: result.agents.length,
      totalSkills: result.skills.length,
      totalMCPServers: result.configs.reduce((acc, c) => {
        const metadata = c.metadata as { mcpServers?: unknown[] } | undefined;
        return acc + (metadata?.mcpServers?.length || 0);
      }, 0),
      scannedPaths: result.files.map(f => f.path),
      duration: result.duration,
      success: result.errors.length === 0
    };

    ui.completeScan(summary);

    // Display detailed results
    displayDetailedResults(result);

    // Optionally save to file
    if (options.output) {
      await saveResults(result, options.output);
    }

  } catch (error) {
    ui.failScan(error instanceof Error ? error : new Error('Scan failed'));
    console.error(Colors.error(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Display detailed scan results
 */
function displayDetailedResults(result: any): void {
  console.log(chalk.bold('\n📊 Detailed Scan Results\n'));

  // Agents
  if (result.agents?.length > 0) {
    console.log(chalk.cyan(`Agents Found: ${result.agents.length}`));
    result.agents.forEach((agent: any) => {
      const metadata = agent.metadata || {};
      const name = metadata.name || agent.name.replace('.md', '');
      console.log(`  ${Colors.success('✓')} ${name}`);
      if (metadata.description) {
        console.log(`    ${chalk.gray(metadata.description)}`);
      }
    });
    console.log();
  }

  // Skills
  if (result.skills?.length > 0) {
    console.log(chalk.cyan(`Skills Found: ${result.skills.length}`));
    result.skills.forEach((skill: any) => {
      const pathParts = skill.path.split(/[\\/]/);
      const skillIndex = pathParts.indexOf('skills');
      const skillName = skillIndex >= 0 && pathParts[skillIndex + 1] ? pathParts[skillIndex + 1] : skill.name.replace('.md', '');
      console.log(`  ${Colors.success('✓')} ${skillName}`);
    });
    console.log();
  }

  // Configs
  if (result.configs?.length > 0) {
    console.log(chalk.cyan(`Configurations Found: ${result.configs.length}`));
    result.configs.forEach((config: any) => {
      console.log(`  ${Colors.success('✓')} ${config.name}`);
      const metadata = config.metadata as { mcpServers?: unknown[] } | undefined;
      if (metadata?.mcpServers) {
        const mcpCount = Array.isArray(metadata.mcpServers) 
          ? metadata.mcpServers.length 
          : Object.keys(metadata.mcpServers).length;
        console.log(`    ${chalk.gray(`${mcpCount} MCP server(s)`)}`);
      }
    });
    console.log();
  }

  // Stats
  console.log(chalk.gray(`Files Scanned: ${result.filesScanned}`));
  console.log(chalk.gray(`Duration: ${result.duration}ms`));
  console.log(chalk.gray(`Project Files: ${result.projectLevel?.length || 0}`));
  console.log(chalk.gray(`Global Files: ${result.globalLevel?.length || 0}`));

  if (result.errors?.length > 0) {
    console.log(chalk.yellow(`\n⚠ ${result.errors.length} error(s) encountered`));
    result.errors.forEach((err: any) => {
      console.log(chalk.gray(`  • ${err.path}: ${err.error}`));
    });
  }

  console.log();
}

/**
 * Save results to file
 */
async function saveResults(result: any, outputPath: string): Promise<void> {
  const fs = await import('fs/promises');
  
  try {
    await fs.writeFile(
      outputPath, 
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    console.log(Colors.success(`✓ Results saved to ${outputPath}\n`));
  } catch (error) {
    console.error(Colors.error(`✗ Failed to save results: ${error instanceof Error ? error.message : String(error)}\n`));
  }
}
