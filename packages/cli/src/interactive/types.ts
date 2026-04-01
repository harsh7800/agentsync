/**
 * Type definitions for Interactive Agent Mode
 */

export interface AgentLoopConfig {
  /** REPL prompt symbol (default: "> ") */
  prompt: string;
  /** Entry banner message */
  welcomeMessage: string;
  /** Commands that exit REPL */
  exitCommands: string[];
  /** Optional history persistence */
  historyFile?: string;
}

export interface CommandContext {
  /** Current session state */
  session: SessionState;
  /** Command arguments */
  args: string[];
  /** Parsed flags */
  flags: Record<string, boolean>;
}

export interface CommandResult {
  /** Whether command succeeded */
  success: boolean;
  /** Optional message to display */
  message?: string;
  /** Whether to exit REPL */
  shouldExit?: boolean;
  /** Session updates */
  updatedSession?: Partial<SessionState>;
}

export interface SlashCommand {
  /** Command name (e.g., "scan") */
  name: string;
  /** Short description for /help */
  description: string;
  /** Usage example */
  usage: string;
  /** Optional aliases (e.g., ["s"]) */
  aliases?: string[];
  /** Execute function */
  execute: (context: CommandContext) => Promise<CommandResult>;
}

export interface SessionState {
  /** Names of detected tools */
  scannedTools: string[];
  /** Detected agents */
  detectedAgents: Agent[] | string[];
  /** Detected skills */
  detectedSkills: Skill[] | string[];
  /** Detected MCP servers */
  detectedMCPs: MCPServer[] | string[];
  /** Paths that were scanned */
  scanPaths: string[];
  /** Selected source tool */
  selectedSourceTool?: string | null;
  /** Selected target tool */
  selectedTargetTool: string | null;
  /** Last migration result */
  migrationResult?: MigrationResult;
  /** Unique session ID */
  sessionId?: string;
  /** Session start time */
  startTime?: Date;
  /** Last command timestamp */
  lastActivity?: Date;
  /** When the scan was performed */
  scanTimestamp?: Date | null;
  /** Whether a scan has been performed */
  hasScanned?: boolean;
}

export interface Agent {
  name: string;
  description?: string;
  path?: string;
}

export interface Skill {
  name: string;
  description?: string;
  path?: string;
}

export interface MCPServer {
  name: string;
  command?: string;
  args?: string[];
}

export interface MigrationResult {
  sourceTool: string;
  targetTool: string;
  migratedAgents: number;
  migratedSkills: number;
  timestamp: Date;
}

export class CommandAlreadyExistsError extends Error {
  constructor(commandName: string) {
    super(`Command "${commandName}" already exists`);
    this.name = 'CommandAlreadyExistsError';
  }
}

export class InvalidCommandNameError extends Error {
  constructor(commandName: string) {
    super(`Invalid command name: "${commandName}". Command names must start with a letter and contain only alphanumeric characters.`);
    this.name = 'InvalidCommandNameError';
  }
}
