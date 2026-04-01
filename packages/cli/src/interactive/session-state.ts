import type { SessionState as ISessionState, CommandContext } from './types.js';

/**
 * SessionState class
 * 
 * Manages the session state for the Agent Loop REPL.
 * Maintains scan results, migration state, and session metadata.
 */
export class SessionState {
  private state: ISessionState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ISessionState {
    const now = new Date();
    return {
      scannedTools: [],
      detectedAgents: [],
      detectedSkills: [],
      detectedMCPs: [],
      scanPaths: [],
      selectedSourceTool: null,
      selectedTargetTool: null,
      sessionId: this.generateSessionId(),
      startTime: now,
      lastActivity: now,
      hasScanned: false,
      scanTimestamp: null
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets the current session state
   */
  getState(): ISessionState {
    return { ...this.state };
  }

  /**
   * Updates the session state with partial values
   */
  update(updates: Partial<ISessionState>): void {
    this.state = {
      ...this.state,
      ...updates,
      lastActivity: new Date()
    };
  }

  /**
   * Clears all session data except sessionId
   */
  clear(): void {
    const sessionId = this.state.sessionId;
    this.state = {
      ...this.getInitialState(),
      sessionId
    };
  }
}

/**
 * Creates a new empty session state
 */
export function createSessionState(): ISessionState {
  return {
    scannedTools: [],
    detectedAgents: [],
    detectedSkills: [],
    detectedMCPs: [],
    scanPaths: [],
    selectedSourceTool: null,
    selectedTargetTool: null,
    scanTimestamp: null,
    hasScanned: false
  };
}

/**
 * Updates a session state with partial updates
 */
export function updateSessionState(
  current: ISessionState,
  updates: Partial<ISessionState>
): ISessionState {
  return {
    ...current,
    ...updates
  };
}

/**
 * Creates a cleared session state (preserves some fields)
 */
export function clearSessionState(): ISessionState {
  return createSessionState();
}

/**
 * Creates a command context from session state
 */
export function createCommandContext(initialState?: ISessionState): CommandContext {
  const session = initialState ?? createSessionState();
  return {
    session,
    args: [],
    flags: {}
  };
}

/**
 * SessionStateManager class for managing session state
 */
export class SessionStateManager {
  private state: ISessionState;

  constructor(initialState?: ISessionState) {
    this.state = initialState ?? createSessionState();
  }

  /**
   * Get current state (readonly)
   */
  getState(): Readonly<ISessionState> {
    return this.state;
  }

  /**
   * Update state with partial updates
   */
  update(updates: Partial<ISessionState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Clear state (reset to defaults)
   */
  clear(): void {
    this.state = createSessionState();
  }

  /**
   * Check if scan data exists
   */
  hasScanData(): boolean {
    return this.state.hasScanned === true || this.state.scannedTools.length > 0;
  }

  /**
   * Get formatted status display
   */
  getStatusDisplay(): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('         CURRENT SESSION');
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    
    if (!this.hasScanData()) {
      lines.push('No scan data available.');
      lines.push('Run /scan to detect tools and agents.');
    } else {
      lines.push(`Scan Status: ${this.state.hasScanned ? '✔ Complete' : '○ Not scanned'}`);
      if (this.state.scanTimestamp) {
        lines.push(`Last Scan: ${this.state.scanTimestamp.toLocaleString()}`);
      }
      lines.push('');
      lines.push(`Tools Detected: ${this.state.scannedTools.length}`);
      this.state.scannedTools.forEach(tool => {
        lines.push(`  • ${tool}`);
      });
      lines.push('');
      lines.push(`Agents: ${this.state.detectedAgents.length}`);
      lines.push(`Skills: ${this.state.detectedSkills.length}`);
      lines.push(`MCP Servers: ${this.state.detectedMCPs.length}`);
    }
    
    lines.push('');
    lines.push('═══════════════════════════════════════════');
    
    return lines.join('\n');
  }
}
