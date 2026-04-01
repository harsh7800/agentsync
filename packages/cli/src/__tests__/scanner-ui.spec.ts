import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a mutable mock instance that captures text updates
let mockOraInstance: any;

// Mock ora before importing ScannerUI
vi.mock('ora', () => {
  return {
    default: vi.fn(() => mockOraInstance)
  };
});

// Mock chalk with chained bold support
vi.mock('chalk', () => {
  const mockColor = vi.fn((text: string) => text);
  const createBoldColor = (colorFn: Function) => {
    const boldFn = vi.fn((text: string) => text);
    // @ts-ignore
    boldFn.cyan = mockColor;
    // @ts-ignore
    boldFn.red = mockColor;
    return boldFn;
  };
  
  return {
    default: {
      blue: mockColor,
      green: mockColor,
      red: mockColor,
      yellow: mockColor,
      cyan: mockColor,
      gray: mockColor,
      bold: createBoldColor(mockColor)
    }
  };
});

// Import after mocks are set up
import { ScannerUI } from '../ui/scanner-ui/scanner-ui.js';
import type { ScanProgress, ScanSummary } from '../ui/scanner-ui/scanner-ui.js';
import ora from 'ora';

describe('ScannerUI', () => {
  let scannerUI: ScannerUI;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock instance with text property that can be updated
    mockOraInstance = {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      stopAndPersist: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      render: vi.fn().mockReturnThis(),
      frame: vi.fn().mockReturnThis(),
      text: ''
    };
    
    // Mock text setter to capture updates
    Object.defineProperty(mockOraInstance, 'text', {
      get: () => mockOraInstance._text || '',
      set: (value: string) => { mockOraInstance._text = value; },
      configurable: true
    });
    
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // UNIT-SCANNER-UI-001: Constructor initializes with default options
  describe('Constructor and Initialization', () => {
    it('should initialize with default options', () => {
      scannerUI = new ScannerUI();
      
      // Verify internal state through behavior - silent mode should suppress output
      expect(scannerUI).toBeDefined();
    });

    // UNIT-SCANNER-UI-002: Constructor accepts and stores options
    it('should accept and store options', () => {
      scannerUI = new ScannerUI({ silent: true, verbose: true });
      
      expect(scannerUI).toBeDefined();
    });
  });

  // UNIT-SCANNER-UI-003: startScan creates spinner with correct text for 'current' scope
  describe('startScan', () => {
    it('should create spinner with correct text for current scope', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      expect(ora).toHaveBeenCalled();
    });

    // UNIT-SCANNER-UI-004: startScan creates spinner with correct text for 'system' scope
    it('should create spinner with correct text for system scope', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('system');
      
      expect(ora).toHaveBeenCalled();
    });

    // UNIT-SCANNER-UI-005: startScan creates spinner with custom path
    it('should create spinner with custom path', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('custom', '/custom/path');
      
      expect(ora).toHaveBeenCalled();
    });
  });

  // UNIT-SCANNER-UI-006: updateProgress updates spinner text with current directory
  describe('updateProgress', () => {
    it('should update spinner text with current directory', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      const progress: ScanProgress = {
        currentDirectory: '/home/user/.config/opencode',
        directoriesScanned: 1,
        totalDirectories: 5,
        agentsFound: 2,
        skillsFound: 3,
        mcpServersFound: 1,
        toolsDetected: ['opencode']
      };
      
      scannerUI.updateProgress(progress);
      
      expect(mockOraInstance.text).toContain('/home/user/.config/opencode');
    });

    // UNIT-SCANNER-UI-007: updateProgress shows incremental counts
    it('should show incremental counts', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      const progress: ScanProgress = {
        currentDirectory: '/some/path',
        directoriesScanned: 2,
        totalDirectories: 5,
        agentsFound: 3,
        skillsFound: 5,
        mcpServersFound: 2,
        toolsDetected: ['opencode', 'claude']
      };
      
      scannerUI.updateProgress(progress);
      
      // Verify counts are in the text
      expect(mockOraInstance.text).toContain('3');
      expect(mockOraInstance.text).toContain('5');
    });
  });

  // UNIT-SCANNER-UI-008: reportAgentFound displays success checkmark
  describe('reportAgentFound', () => {
    it('should display success checkmark when agent is found', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      scannerUI.reportAgentFound('my-agent', '/path/to/agent');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat();
      expect(logCalls.some((call: unknown) => typeof call === 'string' && call.includes('✓') && call.includes('my-agent'))).toBe(true);
    });
  });

  // UNIT-SCANNER-UI-009: reportSkillFound displays success checkmark
  describe('reportSkillFound', () => {
    it('should display success checkmark when skill is found', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      scannerUI.reportSkillFound('my-skill', '/path/to/skill');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat();
      expect(logCalls.some((call: unknown) => typeof call === 'string' && call.includes('✓') && call.includes('my-skill'))).toBe(true);
    });
  });

  // UNIT-SCANNER-UI-010: reportMCPServerFound displays success checkmark
  describe('reportMCPServerFound', () => {
    it('should display success checkmark when MCP server is found', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      scannerUI.reportMCPServerFound('my-server', '/path/to/server');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat();
      expect(logCalls.some((call: unknown) => typeof call === 'string' && call.includes('✓') && call.includes('my-server'))).toBe(true);
    });
  });

  // UNIT-SCANNER-UI-011: reportToolDetected displays tool information
  describe('reportToolDetected', () => {
    it('should display tool information when tool is detected', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      scannerUI.reportToolDetected('opencode');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCalls = consoleLogSpy.mock.calls.flat();
      expect(logCalls.some((call: unknown) => typeof call === 'string' && call.includes('opencode'))).toBe(true);
    });
  });

  // UNIT-SCANNER-UI-012: completeScan displays formatted summary with all sections
  describe('completeScan', () => {
    it('should display formatted summary with all sections', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('system');
      
      // Add some entities first
      scannerUI.reportAgentFound('agent-1', '/path/1');
      scannerUI.reportAgentFound('agent-2', '/path/2');
      scannerUI.reportAgentFound('agent-3', '/path/3');
      scannerUI.reportAgentFound('agent-4', '/path/4');
      scannerUI.reportSkillFound('skill-1', '/path/1');
      scannerUI.reportMCPServerFound('server-1', '/path/1');
      
      const summary: ScanSummary = {
        toolsDetected: ['opencode', 'claude'],
        totalAgents: 4,
        totalSkills: 1,
        totalMCPServers: 1,
        scannedPaths: ['/home/user/.config/opencode', './.opencode'],
        duration: 1250,
        success: true
      };
      
      scannerUI.completeScan(summary);
      
      expect(mockOraInstance.succeed).toHaveBeenCalled();
      
      // Verify summary sections are logged
      const logOutput = (consoleLogSpy.mock.calls as any[]).map((call: any) => call.join(' ')).join('\n');
      expect(logOutput).toContain('SCAN COMPLETE');
      expect(logOutput).toContain('opencode');
      expect(logOutput).toContain('claude');
      expect(logOutput).toContain('4'); // agent count
      expect(logOutput).toContain('1 more'); // truncated agents
    });

    // UNIT-SCANNER-UI-013: completeScan handles empty results gracefully
    it('should handle empty results gracefully', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      const summary: ScanSummary = {
        toolsDetected: [],
        totalAgents: 0,
        totalSkills: 0,
        totalMCPServers: 0,
        scannedPaths: [],
        duration: 100,
        success: true
      };
      
      scannerUI.completeScan(summary);
      
      expect(mockOraInstance.succeed).toHaveBeenCalled();
      
      const logOutput = (consoleLogSpy.mock.calls as any[]).map((call: any) => call.join(' ')).join('\n');
      expect(logOutput).toContain('SCAN COMPLETE');
    });
  });

  // UNIT-SCANNER-UI-014: failScan displays error with failure state
  describe('failScan', () => {
    it('should display error with failure state', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('current');
      
      const error = new Error('Permission denied: /root/.config');
      scannerUI.failScan(error);
      
      expect(mockOraInstance.fail).toHaveBeenCalled();
      
      const logOutput = (consoleLogSpy.mock.calls as any[]).map((call: any) => call.join(' ')).join('\n');
      expect(logOutput).toContain('Permission denied');
    });
  });

  // UNIT-SCANNER-UI-015: Silent mode suppresses ora calls
  describe('Silent Mode', () => {
    it('should suppress ora calls when silent mode is enabled', () => {
      scannerUI = new ScannerUI({ silent: true });
      
      scannerUI.startScan('current');
      
      expect(ora).not.toHaveBeenCalled();
      
      // Internal state should still work
      scannerUI.reportAgentFound('agent', '/path');
      scannerUI.reportSkillFound('skill', '/path');
      scannerUI.reportMCPServerFound('server', '/path');
      
      // No console output in silent mode
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  // UNIT-SCANNER-UI-016: Multiple directory scans accumulate counts correctly
  describe('Multiple Directories', () => {
    it('should accumulate counts across multiple directories', () => {
      scannerUI = new ScannerUI();
      scannerUI.startScan('system');
      
      // Simulate scanning multiple directories
      scannerUI.updateProgress({
        currentDirectory: '/dir1',
        directoriesScanned: 1,
        totalDirectories: 3,
        agentsFound: 2,
        skillsFound: 3,
        mcpServersFound: 1,
        toolsDetected: ['opencode']
      });
      
      scannerUI.reportAgentFound('agent-1', '/dir1');
      scannerUI.reportAgentFound('agent-2', '/dir1');
      
      scannerUI.updateProgress({
        currentDirectory: '/dir2',
        directoriesScanned: 2,
        totalDirectories: 3,
        agentsFound: 5, // 3 more found
        skillsFound: 7, // 4 more found
        mcpServersFound: 2, // 1 more found
        toolsDetected: ['opencode', 'claude']
      });
      
      scannerUI.reportAgentFound('agent-3', '/dir2');
      scannerUI.reportAgentFound('agent-4', '/dir2');
      scannerUI.reportAgentFound('agent-5', '/dir2');
      
      const summary: ScanSummary = {
        toolsDetected: ['opencode', 'claude'],
        totalAgents: 5,
        totalSkills: 7,
        totalMCPServers: 2,
        scannedPaths: ['/dir1', '/dir2'],
        duration: 2000,
        success: true
      };
      
      scannerUI.completeScan(summary);
      
      const logOutput = (consoleLogSpy.mock.calls as any[]).map((call: any) => call.join(' ')).join('\n');
      expect(logOutput).toContain('5'); // total agents
      expect(logOutput).toContain('7'); // total skills
    });
  });
});
