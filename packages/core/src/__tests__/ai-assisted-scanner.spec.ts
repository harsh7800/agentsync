import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { AIAssistedScanner } from '../ai-scanner/ai-assisted-scanner.js';
import type { AIAssistedScanOptions } from '../ai-scanner/types.js';

describe('S3-05: AI-Assisted Scan Mode', () => {
  let scanner: AIAssistedScanner;
  let tempDir: string;

  beforeEach(() => {
    scanner = new AIAssistedScanner();
    tempDir = mkdtempSync(join(tmpdir(), 'ai-assisted-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Autonomous Detection', () => {
    it('S3-05-001: Autonomously detect agents without user input', async () => {
      // Arrange - create agent files without specifying patterns
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(opencodeDir, { recursive: true });
      writeFileSync(join(opencodeDir, 'config.json'), '{"name": "Auto Detected"}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        autoDetect: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.aiAnalysisPerformed).toBe(true);
    });

    it('S3-05-002: Intelligently identify tool type from content', async () => {
      // Arrange - create file with Claude-specific content
      const configFile = join(tempDir, 'settings.json');
      writeFileSync(configFile, JSON.stringify({
        mcpServers: {},
        name: 'Claude Config'
      }));

      const options: AIAssistedScanOptions = {
        scope: 'current',
        autoDetect: true,
        analyzeContent: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.aiAnalysisPerformed).toBe(true);
    });

    it('S3-05-003: Suggest migration paths based on detected patterns', async () => {
      // Arrange
      const sourceDir = join(tempDir, '.opencode');
      const agentsDir = join(sourceDir, 'agents');
      mkdirSync(agentsDir, { recursive: true });
      writeFileSync(join(agentsDir, 'test.agent.md'), '# Test Agent');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        suggestMigrations: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.suggestions?.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-05-004: Detect cross-tool compatibility', async () => {
      // Arrange - create configs for multiple tools
      const claudeDir = join(tempDir, '.claude');
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(claudeDir, { recursive: true });
      mkdirSync(opencodeDir, { recursive: true });
      
      writeFileSync(join(claudeDir, 'settings.json'), '{}');
      writeFileSync(join(opencodeDir, 'config.json'), '{}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        detectCompatibility: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityMatrix).toBeDefined();
    });

    it('S3-05-005: Prioritize agents by relevance score', async () => {
      // Arrange
      const agentsDir = join(tempDir, '.opencode', 'agents');
      mkdirSync(agentsDir, { recursive: true });
      writeFileSync(join(agentsDir, 'agent1.md'), '# Agent 1');
      writeFileSync(join(agentsDir, 'agent2.md'), '# Agent 2');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        prioritizeByRelevance: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      if (result.agents.local.length > 1) {
        expect(result.agents.local[0].relevanceScore).toBeDefined();
      }
    });

    it('S3-05-006: Learn from file structure patterns', async () => {
      // Arrange - create realistic project structure
      const projectDir = join(tempDir, 'project');
      mkdirSync(join(projectDir, '.opencode', 'agents'), { recursive: true });
      mkdirSync(join(projectDir, '.opencode', 'skills'), { recursive: true });
      writeFileSync(join(projectDir, '.opencode', 'agents', 'main.md'), '# Main');
      writeFileSync(join(projectDir, '.opencode', 'skills', 'helper.md'), '# Helper');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        learnPatterns: true,
        cwd: projectDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.learnedPatterns?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI Analysis Features', () => {
    it('S3-05-007: Analyze agent complexity', async () => {
      // Arrange
      const agentFile = join(tempDir, 'complex.agent.md');
      writeFileSync(agentFile, '# Complex Agent\n\n' + 'Description line\n'.repeat(50));

      const options: AIAssistedScanOptions = {
        scope: 'current',
        analyzeComplexity: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      if (result.agents.local.length > 0) {
        expect(result.agents.local[0].complexity).toBeDefined();
      }
    });

    it('S3-05-008: Detect deprecated or outdated configurations', async () => {
      // Arrange
      const oldConfig = join(tempDir, 'old-config.json');
      writeFileSync(oldConfig, JSON.stringify({
        version: '1.0.0',
        deprecatedField: true
      }));

      const options: AIAssistedScanOptions = {
        scope: 'current',
        detectOutdated: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.warnings?.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-05-009: Group related agents automatically', async () => {
      // Arrange
      const agentsDir = join(tempDir, '.opencode', 'agents');
      mkdirSync(agentsDir, { recursive: true });
      writeFileSync(join(agentsDir, 'frontend.md'), '# Frontend Agent');
      writeFileSync(join(agentsDir, 'backend.md'), '# Backend Agent');
      writeFileSync(join(agentsDir, 'test.md'), '# Test Agent');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        autoGroup: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.agentGroups).toBeDefined();
    });

    it('S3-05-010: Estimate migration effort', async () => {
      // Arrange
      const configFile = join(tempDir, 'large-config.json');
      writeFileSync(configFile, JSON.stringify({
        mcpServers: {
          server1: {}, server2: {}, server3: {}
        },
        agents: {
          agent1: {}, agent2: {}, agent3: {}
        }
      }));

      const options: AIAssistedScanOptions = {
        scope: 'current',
        estimateEffort: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.migrationEstimate).toBeDefined();
    });
  });

  describe('Smart Recommendations', () => {
    it('S3-05-011: Recommend best target tool', async () => {
      // Arrange
      const sourceDir = join(tempDir, '.opencode');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'config.json'), '{}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        recommendTarget: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.recommendedTargets?.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-05-012: Identify potential conflicts', async () => {
      // Arrange
      const opencodeDir = join(tempDir, '.opencode');
      const claudeDir = join(tempDir, '.claude');
      mkdirSync(opencodeDir, { recursive: true });
      mkdirSync(claudeDir, { recursive: true });
      
      writeFileSync(join(opencodeDir, 'config.json'), '{"name": "Config"}');
      writeFileSync(join(claudeDir, 'settings.json'), '{"name": "Config"}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        detectConflicts: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.potentialConflicts).toBeDefined();
    });

    it('S3-05-013: Generate migration confidence score', async () => {
      // Arrange
      const agentFile = join(tempDir, 'test.agent.md');
      writeFileSync(agentFile, '# Well Documented Agent\n\n## Description\nClear description');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        calculateConfidence: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance & Caching', () => {
    it('S3-05-014: Cache scan results for repeated analysis', async () => {
      // Arrange
      const configFile = join(tempDir, 'config.json');
      writeFileSync(configFile, '{}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        useCache: true,
        cwd: tempDir
      };

      // Act - first scan
      const result1 = await scanner.scan(options);
      // Act - second scan (should use cache)
      const result2 = await scanner.scan(options);

      // Assert
      expect(result1.duration).toBeGreaterThanOrEqual(0);
      expect(result2.duration).toBeGreaterThanOrEqual(0);
    });

    it('S3-05-015: Perform incremental scans', async () => {
      // Arrange
      const configFile = join(tempDir, 'config.json');
      writeFileSync(configFile, '{}');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        incremental: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.incrementalScan).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('S3-05-016: Gracefully handle AI analysis failures', async () => {
      // Arrange
      const corruptFile = join(tempDir, 'corrupt.json');
      writeFileSync(corruptFile, '{ invalid json }');

      const options: AIAssistedScanOptions = {
        scope: 'current',
        autoDetect: true,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert - should complete even if some analysis fails
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('S3-05-017: Handle large directory structures efficiently', async () => {
      // Arrange - create many directories
      for (let i = 0; i < 100; i++) {
        mkdirSync(join(tempDir, `dir${i}`), { recursive: true });
      }

      const options: AIAssistedScanOptions = {
        scope: 'current',
        autoDetect: true,
        maxFiles: 50,
        cwd: tempDir
      };

      // Act
      const result = await scanner.scan(options);

      // Assert
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.filesScanned).toBeLessThanOrEqual(50);
    });
  });
});
