import { Command } from 'commander';
import chalk from 'chalk';
import { AIAssistedScanner, ManualScanController } from '@agent-sync/core';
import { Banner, Spinner, Colors } from '../ui/index.js';
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
    .option('-a, --ai', 'Use AI-assisted scan mode (autonomous)')
    .option('-s, --scope <scope>', 'Scan scope: current, home, or system', 'current')
    .option('-d, --depth <depth>', 'Scan depth (1-10)', '3')
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
      { name: '🤖 AI-Assisted (autonomous detection with smart suggestions)', value: 'ai' },
      { name: '👤 Manual (you control the scan scope and depth)', value: 'manual' }
    ]
  }]);

  return mode;
}

/**
 * Run AI-assisted scan
 */
async function runAIScan(options: ScanOptions): Promise<void> {
  const spinner = new Spinner();
  spinner.start('Initializing AI scanner...');

  try {
    const scanner = new AIAssistedScanner();
    
    spinner.setText('Scanning with AI assistance...');

    const result = await scanner.scan({
      scope: options.scope as 'current' | 'home' | 'custom',
      autoDetect: true,
      analyzeContent: true,
      suggestMigrations: true,
      detectCompatibility: true,
      prioritizeByRelevance: true,
      cwd: process.cwd()
    });

    spinner.succeed('Scan complete!');

    // Display results
    displayAIResults(result);

    // Optionally save to file
    if (options.output) {
      await saveResults(result, options.output);
    }

  } catch (error) {
    spinner.fail('Scan failed');
    console.error(Colors.error(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Run manual scan
 */
async function runManualScan(options: ScanOptions): Promise<void> {
  const controller = new ManualScanController();

  // Validate scope
  const scope = options.scope as 'current' | 'home' | 'custom';
  const depth = parseInt(options.depth || '3', 10);

  console.log(chalk.gray(`\nScanning with scope: ${scope}, depth: ${depth}\n`));

  const spinner = new Spinner();
  spinner.start('Scanning...');

  try {
    const result = await controller.scanWithUserOptions({
      scope,
      depth,
      cwd: process.cwd()
    });

    spinner.succeed('Scan complete!');

    // Display results
    displayManualResults(result);

    // Optionally save to file
    if (options.output) {
      await saveResults(result, options.output);
    }

  } catch (error) {
    spinner.fail('Scan failed');
    console.error(Colors.error(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Display AI scan results
 */
function displayAIResults(result: any): void {
  console.log(chalk.bold('\n📊 AI Scan Results\n'));

  // Agents found
  const localCount = result.agents?.local?.length || 0;
  const systemCount = result.agents?.system?.length || 0;

  console.log(`  ${Colors.success('✓')} Found ${localCount} local agents`);
  console.log(`  ${Colors.success('✓')} Found ${systemCount} system agents`);
  console.log(`  ${Colors.info('ℹ')} Files scanned: ${result.filesScanned}`);
  console.log(`  ${Colors.info('ℹ')} Duration: ${result.duration}ms`);

  // AI analysis
  if (result.aiAnalysisPerformed) {
    console.log(chalk.bold('\n🤖 AI Analysis:\n'));
    
    if (result.suggestions?.length > 0) {
      console.log(`  ${Colors.info('→')} ${result.suggestions.length} migration suggestions`);
    }
    
    if (result.confidenceScore !== undefined) {
      const confidenceColor = result.confidenceScore > 80 ? Colors.success : 
                             result.confidenceScore > 50 ? Colors.warning : Colors.error;
      console.log(`  ${Colors.info('→')} Overall confidence: ${confidenceColor(result.confidenceScore + '%')}`);
    }

    if (result.potentialConflicts?.length > 0) {
      console.log(`  ${Colors.warning('⚠')} ${result.potentialConflicts.length} potential conflicts detected`);
    }
  }

  console.log();
}

/**
 * Display manual scan results
 */
function displayManualResults(result: any): void {
  console.log(chalk.bold('\n📊 Manual Scan Results\n'));

  // Agents found
  const localCount = result.agents?.local?.length || 0;
  const systemCount = result.agents?.system?.length || 0;

  console.log(`  ${Colors.success('✓')} Found ${localCount} local agents`);
  console.log(`  ${Colors.success('✓')} Found ${systemCount} system agents`);
  console.log(`  ${Colors.info('ℹ')} Files scanned: ${result.filesScanned}`);
  console.log(`  ${Colors.info('ℹ')} Duration: ${result.duration}ms`);

  if (result.errors?.length > 0) {
    console.log(chalk.yellow(`\n  ⚠ ${result.errors.length} error(s) encountered`));
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
    console.log(Colors.success(`\n✓ Results saved to ${outputPath}\n`));
  } catch (error) {
    console.error(Colors.error(`\n✗ Failed to save results: ${error instanceof Error ? error.message : String(error)}\n`));
  }
}
