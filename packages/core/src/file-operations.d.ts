export declare class FileOperations {
    /**
     * Read and parse a JSON config file
     */
    readConfigFile(filePath: string): Promise<unknown>;
    /**
     * Write config to file with proper formatting
     */
    writeConfigFile(filePath: string, config: unknown): Promise<void>;
    /**
     * Create a backup of an existing file with timestamp
     */
    createBackup(filePath: string, backupDir: string): Promise<string>;
    /**
     * Write file atomically using temp file and rename
     */
    atomicWrite(filePath: string, config: unknown): Promise<void>;
    /**
     * Detect if a tool config exists at the given path
     */
    detectTool(configPath: string): Promise<boolean>;
}
//# sourceMappingURL=file-operations.d.ts.map