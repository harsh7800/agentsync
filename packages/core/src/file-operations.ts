import * as fs from 'fs/promises';
import * as path from 'path';

export class FileOperations {
  /**
   * Read and parse a JSON config file
   */
  async readConfigFile(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Config file not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Write config to file with proper formatting
   */
  async writeConfigFile(filePath: string, config: unknown): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write with pretty formatting
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Create a backup of an existing file with timestamp
   */
  async createBackup(filePath: string, backupDir: string): Promise<string> {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Cannot backup non-existent file: ${filePath}`);
    }

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basename = path.basename(filePath, '.json');
    const backupPath = path.join(backupDir, `${basename}-${timestamp}.json`);

    // Copy file to backup
    await fs.copyFile(filePath, backupPath);

    return backupPath;
  }

  /**
   * Write file atomically using temp file and rename
   */
  async atomicWrite(filePath: string, config: unknown): Promise<void> {
    const dir = path.dirname(filePath);
    const tempPath = path.join(dir, `.tmp-${Date.now()}.json`);

    try {
      // Write to temp file
      await this.writeConfigFile(tempPath, config);

      // Rename temp file to target (atomic operation)
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Detect if a tool config exists at the given path
   */
  async detectTool(configPath: string): Promise<boolean> {
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }
}