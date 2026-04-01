import { Command } from 'commander';
import chalk from 'chalk';
import { toolPathRegistry } from '@agent-sync/core';
import { Banner, Colors } from '../ui/index.js';
import * as path from 'path';
import * as os from 'os';
import { access, stat, readdir } from 'fs/promises';

/**
 * Tool structure definitions for verification
 */
const TOOL_STRUCTURES: Record<string, {
  displayName: string;
  expectedFiles: string[];
  expectedDirs: string[];
  configPattern: RegExp;
  description: string;
}> = {
  claude: {
    displayName: 'Claude Code',
    expectedFiles: ['settings.json'],
    expectedDirs: [],
    configPattern: /settings\.json$/,
    description: 'Claude Code stores configuration in ~/.config/claude/settings.json'
  },
  opencode: {
    displayName: 'OpenCode',
    expectedFiles: ['opencode.json'],
    expectedDirs: ['agents', 'skills'],
    configPattern: /opencode\.json$/,
    description: 'OpenCode uses .opencode/ directory with agents/, skills/, and opencode.json'
  },
  gemini: {
    displayName: 'Gemini CLI',
    expectedFiles: ['config.json'],
    expectedDirs: [],
    configPattern: /config\.json$/,
    description: 'Gemini CLI stores configuration in ~/.config/gemini/config.json'
  },
  cursor: {
    displayName: 'Cursor',
    expectedFiles: ['.cursorrules'],
    expectedDirs: [],
    configPattern: /\.cursorrules$/,
    description: 'Cursor uses .cursorrules file in project root'
  },
  copilot: {
    displayName: 'GitHub Copilot CLI',
    expectedFiles: ['config.json'],
    expectedDirs: [],
    configPattern: /config\.json$/,
    description: 'Copilot stores configuration in ~/.config/github-copilot/config.json'
  }
};

/**
 * Create the verify command
 */
export function createVerifyCommand(): Command {
  const command = new Command('verify')
    .alias('check')
    .description('Verify AI tool installation structure and detect issues')
    .option('-t, --tool <tool>', 'Specific tool to verify (claude, opencode, etc.)')
    .option('-v, --verbose', 'Show detailed structure information')
    .action(async (options) => {
      try {
        await runVerification(options);
      } catch (error) {
        console.error(Colors.error(`Verification failed: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });

  return command;
}

/**
 * Run verification process
 */
async function runVerification(options: { tool?: string; verbose?: boolean }): Promise<void> {
  Banner.show();
  
  console.log(chalk.bold('\n🔍 Verifying AI Tool Structure\n'));
  console.log(chalk.gray('This command checks if your AI tool configurations are correctly structured.\n'));

  const toolsToVerify = options.tool 
    ? [options.tool.toLowerCase()]
    : Object.keys(TOOL_STRUCTURES);

  let totalIssues = 0;
  let totalVerified = 0;

  for (const toolId of toolsToVerify) {
    const toolInfo = TOOL_STRUCTURES[toolId];
    
    if (!toolInfo) {
      console.log(chalk.yellow(`⚠️  Unknown tool: ${toolId}`));
      continue;
    }

    console.log(chalk.bold(`\n${toolInfo.displayName}`));
    console.log(chalk.gray('─'.repeat(50)));

    const result = await verifyTool(toolId, toolInfo, options.verbose);
    
    if (result.verified) {
      totalVerified++;
      console.log(Colors.success(`  ✓ Structure valid`));
    } else {
      totalIssues += result.issues.length;
      console.log(chalk.red(`  ✗ Structure has issues`));
      
      for (const issue of result.issues) {
        console.log(chalk.red(`    • ${issue}`));
      }
    }

    if (options.verbose || !result.verified) {
      console.log(chalk.gray(`  ${toolInfo.description}`));
      
      if (result.foundPaths.length > 0) {
        console.log(chalk.gray(`  Detected at:`));
        for (const foundPath of result.foundPaths) {
          console.log(chalk.gray(`    ${foundPath}`));
        }
      }
    }
  }

  // Summary
  console.log(chalk.bold('\n' + '─'.repeat(50)));
  console.log(chalk.bold('Verification Summary'));
  console.log('─'.repeat(50));
  
  if (totalIssues === 0) {
    console.log(Colors.success(`\n✓ All ${totalVerified} tool(s) have valid structure`));
    console.log(chalk.gray('\nYour tools are correctly configured and ready for migration!'));
  } else {
    console.log(chalk.yellow(`\n⚠️  Found ${totalIssues} issue(s) in ${toolsToVerify.length - totalVerified} tool(s)`));
    console.log(chalk.gray('\nPlease review the issues above and fix them before migrating.'));
    console.log(chalk.gray('Use --verbose for more details about expected structure.'));
  }

  console.log();
}

/**
 * Verify a specific tool
 */
async function verifyTool(
  toolId: string,
  toolInfo: typeof TOOL_STRUCTURES[string],
  verbose: boolean
): Promise<{ verified: boolean; issues: string[]; foundPaths: string[] }> {
  const issues: string[] = [];
  const foundPaths: string[] = [];
  let verified = true;

  // Get expected paths
  const defaultPath = toolPathRegistry.getDefaultPath(toolId as any, true);
  const projectPath = toolPathRegistry.getDefaultPath(toolId as any, false);

  // Check global config
  try {
    const globalPath = defaultPath.startsWith('~') 
      ? path.join(os.homedir(), defaultPath.slice(1))
      : defaultPath;
    
    await access(globalPath);
    const stats = await stat(globalPath);
    
    if (stats.isDirectory()) {
      foundPaths.push(globalPath);
      
      // Check for expected files
      for (const expectedFile of toolInfo.expectedFiles) {
        const filePath = path.join(globalPath, expectedFile);
        try {
          await access(filePath);
          if (verbose) {
            console.log(chalk.gray(`  ✓ Found ${expectedFile}`));
          }
        } catch {
          issues.push(`Missing expected file: ${expectedFile}`);
          verified = false;
        }
      }

      // Check for expected directories
      for (const expectedDir of toolInfo.expectedDirs) {
        const dirPath = path.join(globalPath, expectedDir);
        try {
          const dirStats = await stat(dirPath);
          if (dirStats.isDirectory()) {
            if (verbose) {
              console.log(chalk.gray(`  ✓ Found directory: ${expectedDir}/`));
            }
            
            // For OpenCode, check if agents and skills have content
            if (toolId === 'opencode' && expectedDir === 'agents') {
              const agents = await readdir(dirPath);
              if (agents.length === 0) {
                issues.push('agents/ directory is empty');
              } else if (verbose) {
                console.log(chalk.gray(`    ${agents.length} agent(s) found`));
              }
            }
            
            if (toolId === 'opencode' && expectedDir === 'skills') {
              const skills = await readdir(dirPath);
              if (skills.length === 0) {
                issues.push('skills/ directory is empty');
              } else if (verbose) {
                console.log(chalk.gray(`    ${skills.length} skill(s) found`));
              }
            }
          } else {
            issues.push(`${expectedDir} exists but is not a directory`);
            verified = false;
          }
        } catch {
          issues.push(`Missing expected directory: ${expectedDir}/`);
          verified = false;
        }
      }
    } else {
      // It's a file (like .cursorrules)
      foundPaths.push(globalPath);
    }
  } catch {
    // Global config not found, check project-level
    try {
      const projectFullPath = path.isAbsolute(projectPath) 
        ? projectPath 
        : path.join(process.cwd(), projectPath);
      
      await access(projectFullPath);
      foundPaths.push(projectFullPath);
      
      if (verbose) {
        console.log(chalk.gray(`  ✓ Found project-level config`));
      }
    } catch {
      issues.push(`No configuration found (checked global and project-level)`);
      verified = false;
    }
  }

  return { verified, issues, foundPaths };
}
