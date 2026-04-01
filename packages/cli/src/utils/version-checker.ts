/**
 * Version checker utility
 * Checks for updates by comparing current version with npm registry
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updateType: 'major' | 'minor' | 'patch' | null;
}

/**
 * Get current installed version from package.json
 */
export function getCurrentVersion(): string {
  try {
    // Look for package.json in the CLI package
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    // Fallback: try to read from root
    try {
      const rootPackageJsonPath = join(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
      return packageJson.version;
    } catch {
      return '0.0.0';
    }
  }
}

/**
 * Get latest version from npm registry
 */
export async function getLatestVersion(packageName: string = '@agent-sync/cli'): Promise<string | null> {
  try {
    const result = execSync(`npm view ${packageName} version --json`, {
      encoding: 'utf-8',
      timeout: 5000
    });
    return JSON.parse(result);
  } catch {
    return null;
  }
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Determine update type based on version difference
 */
export function getUpdateType(current: string, latest: string): UpdateInfo['updateType'] {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  if (latestParts[2] > currentParts[2]) return 'patch';
  
  return null;
}

/**
 * Check if an update is available
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();
  
  if (!latestVersion) {
    return {
      currentVersion,
      latestVersion: currentVersion,
      updateAvailable: false,
      updateType: null
    };
  }
  
  const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;
  const updateType = updateAvailable ? getUpdateType(currentVersion, latestVersion) : null;
  
  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    updateType
  };
}

/**
 * Get color for update type
 */
function getUpdateColor(type: UpdateInfo['updateType']): string {
  switch (type) {
    case 'major': return '#ff0000'; // Red for major
    case 'minor': return '#ffaa00'; // Orange for minor
    case 'patch': return '#00aa00'; // Green for patch
    default: return '#ffffff';
  }
}

/**
 * Get update type label
 */
function getUpdateTypeLabel(type: UpdateInfo['updateType']): string {
  switch (type) {
    case 'major': return 'MAJOR';
    case 'minor': return 'MINOR';
    case 'patch': return 'PATCH';
    default: return '';
  }
}

/**
 * Display update notification
 */
export function displayUpdateNotification(info: UpdateInfo): void {
  if (!info.updateAvailable) return;
  
  const color = getUpdateColor(info.updateType);
  const typeLabel = getUpdateTypeLabel(info.updateType);
  
  const message = `
${chalk.hex(color).bold(`Update available: ${typeLabel}`)}

${chalk.white('Current:')} ${chalk.gray(info.currentVersion)}
${chalk.white('Latest:')}  ${chalk.green(info.latestVersion)}

Run ${chalk.cyan('agentsync update')} or ${chalk.cyan('/update')} to update.
  `;
  
  console.log(boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: color
  }));
}

/**
 * Display update status (for /update command)
 */
export function displayUpdateStatus(info: UpdateInfo): void {
  if (!info.updateAvailable) {
    console.log(chalk.green('✓ You are running the latest version!'));
    console.log(chalk.gray(`  Current version: ${info.currentVersion}`));
    return;
  }
  
  const color = getUpdateColor(info.updateType);
  const typeLabel = getUpdateTypeLabel(info.updateType);
  
  console.log(chalk.hex(color).bold(`⚡ Update available: ${typeLabel}`));
  console.log();
  console.log(chalk.white('Current version:'), chalk.gray(info.currentVersion));
  console.log(chalk.white('Latest version:'), chalk.green(info.latestVersion));
  console.log();
  console.log(chalk.yellow('To update, run one of the following:'));
  console.log(chalk.cyan('  npm install -g @agent-sync/cli@latest'));
  console.log(chalk.cyan('  pnpm add -g @agent-sync/cli@latest'));
  console.log(chalk.cyan('  yarn global add @agent-sync/cli@latest'));
}

/**
 * Perform update (if running via npm/pnpm)
 */
export async function performUpdate(): Promise<boolean> {
  const info = await checkForUpdate();
  
  if (!info.updateAvailable) {
    console.log(chalk.green('✓ Already up to date!'));
    return true;
  }
  
  console.log(chalk.blue('Updating AgentSync CLI...'));
  console.log(chalk.gray(`From ${info.currentVersion} to ${info.latestVersion}`));
  console.log();
  
  try {
    // Try npm first, then pnpm
    try {
      execSync('npm install -g @agent-sync/cli@latest', {
        stdio: 'inherit',
        timeout: 60000
      });
    } catch {
      // Try pnpm
      execSync('pnpm add -g @agent-sync/cli@latest', {
        stdio: 'inherit',
        timeout: 60000
      });
    }
    
    console.log();
    console.log(chalk.green('✓ Update successful!'));
    console.log(chalk.gray('Please restart AgentSync to use the new version.'));
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Update failed'));
    console.log(chalk.gray(String(error)));
    console.log();
    console.log(chalk.yellow('You can manually update with:'));
    console.log(chalk.cyan('  npm install -g @agent-sync/cli@latest'));
    return false;
  }
}
