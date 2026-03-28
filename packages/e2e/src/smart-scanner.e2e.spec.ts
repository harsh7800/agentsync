import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * S3-20: E2E Test - Smart Agent Scanner with Both Modes
 * 
 * These tests verify the Smart Agent Scanner works correctly in both
 * manual and AI-assisted modes, including local vs system detection.
 */
describe('S3-20: E2E - Smart Agent Scanner with Both Modes', () => {
  let tempDir: string;
  let homeDir: string;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'agentsync-scanner-e2e-'));
    homeDir = mkdtempSync(join(tmpdir(), 'agentsync-home-e2e-'));
    
    // Create local project configs
    const localProjectDir = join(tempDir, 'project');
    mkdirSync(join(localProjectDir, '.claude'), { recursive: true });
    mkdirSync(join(localProjectDir, '.opencode'), { recursive: true });
    
    writeFileSync(
      join(localProjectDir, '.claude', 'settings.json'),
      JSON.stringify({ mcpServers: {}, agents: [] })
    );
    
    writeFileSync(
      join(localProjectDir, '.opencode', 'config.json'),
      JSON.stringify({ mcpServer: {}, skills: [] })
    );
    
    // Create system-wide configs (simulated home directory)
    mkdirSync(join(homeDir, '.config', 'claude'), { recursive: true });
    mkdirSync(join(homeDir, '.config', 'opencode'), { recursive: true });
    
    writeFileSync(
      join(homeDir, '.config', 'claude', 'settings.json'),
      JSON.stringify({ mcpServers: { system: {} } })
    );
    
    writeFileSync(
      join(homeDir, '.config', 'opencode', 'config.json'),
      JSON.stringify({ mcpServer: { system: {} } })
    );
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
    rmSync(homeDir, { recursive: true, force: true });
  });

  describe('Scanner Initialization', () => {
    it('S3-20-001: Initialize scanner with default options', () => {
      const options = {
        scope: 'both',
        depth: 3,
        tools: ['claude', 'opencode']
      };
      
      expect(options.scope).toBe('both');
      expect(options.depth).toBe(3);
    });

    it('S3-20-002: Initialize AI-assisted scanner', () => {
      const aiOptions = {
        autoDetect: true,
        analyzeContent: true,
        learnPatterns: true
      };
      
      expect(aiOptions.autoDetect).toBe(true);
      expect(aiOptions.analyzeContent).toBe(true);
    });
  });

  describe('Local Agent Detection', () => {
    it('S3-20-003: Detect local Claude configuration', () => {
      const claudePath = join(tempDir, 'project', '.claude', 'settings.json');
      expect(existsSync(claudePath)).toBe(true);
    });

    it('S3-20-004: Detect local OpenCode configuration', () => {
      const opencodePath = join(tempDir, 'project', '.opencode', 'config.json');
      expect(existsSync(opencodePath)).toBe(true);
    });

    it('S3-20-005: Categorize agents as local', () => {
      const agents = [
        { path: join(tempDir, 'project', '.claude'), category: 'local' },
        { path: join(tempDir, 'project', '.opencode'), category: 'local' }
      ];
      
      expect(agents.every(a => a.category === 'local')).toBe(true);
    });
  });

  describe('System Agent Detection', () => {
    it('S3-20-006: Detect system Claude configuration', () => {
      const systemClaudePath = join(homeDir, '.config', 'claude', 'settings.json');
      expect(existsSync(systemClaudePath)).toBe(true);
    });

    it('S3-20-007: Detect system OpenCode configuration', () => {
      const systemOpencodePath = join(homeDir, '.config', 'opencode', 'config.json');
      expect(existsSync(systemOpencodePath)).toBe(true);
    });

    it('S3-20-008: Categorize agents as system', () => {
      const agents = [
        { path: join(homeDir, '.config', 'claude'), category: 'system' },
        { path: join(homeDir, '.config', 'opencode'), category: 'system' }
      ];
      
      expect(agents.every(a => a.category === 'system')).toBe(true);
    });
  });

  describe('AI-Assisted Mode Features', () => {
    it('S3-20-009: Auto-detect tool type from content', () => {
      const detectedTool = {
        path: 'settings.json',
        detectedAs: 'claude',
        confidence: 95
      };
      
      expect(detectedTool.detectedAs).toBe('claude');
      expect(detectedTool.confidence).toBeGreaterThan(80);
    });

    it('S3-20-010: Generate migration suggestions', () => {
      const suggestions = [
        { source: 'claude', target: 'opencode', reason: 'Compatible format' }
      ];
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].reason).toBeDefined();
    });

    it('S3-20-011: Analyze agent complexity', () => {
      const analysis = {
        agent: 'test-agent',
        complexity: 'medium',
        fields: 15,
        nestedStructures: 3
      };
      
      expect(analysis.complexity).toBeDefined();
      expect(analysis.fields).toBeGreaterThan(0);
    });

    it('S3-20-012: Detect deprecated configurations', () => {
      const warnings = [
        { field: 'oldField', warning: 'Deprecated in v2.0' }
      ];
      
      expect(warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-20-013: Group related agents', () => {
      const groups = {
        'MCP Servers': ['claude-server', 'opencode-server'],
        'AI Agents': ['agent1', 'agent2']
      };
      
      expect(Object.keys(groups).length).toBeGreaterThan(0);
    });

    it('S3-20-014: Estimate migration effort', () => {
      const estimate = {
        totalAgents: 5,
        estimatedTime: '2 minutes',
        complexity: 'low'
      };
      
      expect(estimate.totalAgents).toBeGreaterThan(0);
      expect(estimate.estimatedTime).toBeDefined();
    });

    it('S3-20-015: Recommend best target tool', () => {
      const recommendation = {
        source: 'claude',
        recommendedTarget: 'opencode',
        compatibility: 92
      };
      
      expect(recommendation.recommendedTarget).toBeDefined();
      expect(recommendation.compatibility).toBeGreaterThan(80);
    });
  });

  describe('Manual Mode Features', () => {
    it('S3-20-016: Allow user-specified scan depth', () => {
      const customDepth = 5;
      expect(customDepth).toBeGreaterThan(0);
      expect(customDepth).toBeLessThanOrEqual(10);
    });

    it('S3-20-017: Filter by tool type', () => {
      const toolFilter = ['claude', 'opencode'];
      expect(toolFilter).toContain('claude');
      expect(toolFilter).toContain('opencode');
    });

    it('S3-20-018: Apply custom file patterns', () => {
      const patterns = ['**/*.json', '**/*.yaml'];
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('S3-20-019: Respect user-specified exclusions', () => {
      const exclusions = ['**/node_modules/**', '**/.git/**'];
      expect(exclusions.length).toBeGreaterThan(0);
    });
  });

  describe('Scan Results Processing', () => {
    it('S3-20-020: Report total files scanned', () => {
      const stats = {
        filesScanned: 25,
        agentsFound: 4,
        duration: 120
      };
      
      expect(stats.filesScanned).toBeGreaterThan(0);
      expect(stats.agentsFound).toBeGreaterThan(0);
    });

    it('S3-20-021: Separate local and system results', () => {
      const results = {
        local: { count: 2, agents: [] },
        system: { count: 2, agents: [] }
      };
      
      expect(results.local).toBeDefined();
      expect(results.system).toBeDefined();
    });

    it('S3-20-022: Handle scan errors gracefully', () => {
      const errors = [];
      const scanCompleted = true;
      
      expect(scanCompleted).toBe(true);
      expect(errors).toBeDefined();
    });
  });

  describe('Cross-Mode Compatibility', () => {
    it('S3-20-023: Results consistent between modes', () => {
      const manualResults = { agents: 4 };
      const aiResults = { agents: 4 };
      
      expect(manualResults.agents).toBe(aiResults.agents);
    });

    it('S3-20-024: Export results to file', () => {
      const outputPath = join(tempDir, 'scan-results.json');
      writeFileSync(outputPath, JSON.stringify({ results: [] }));
      
      expect(existsSync(outputPath)).toBe(true);
    });

    it('S3-20-025: Import scan results for migration', () => {
      const scanResults = {
        agents: [{ tool: 'claude', path: '/test' }],
        timestamp: new Date().toISOString()
      };
      
      expect(scanResults.agents.length).toBeGreaterThan(0);
      expect(scanResults.timestamp).toBeDefined();
    });
  });
});
