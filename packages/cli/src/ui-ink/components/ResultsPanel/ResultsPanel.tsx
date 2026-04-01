/**
 * ResultsPanel Component
 * Unified display for scan and migration results
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

export type ResultsMode = 'scan' | 'migration';

export interface DetectedTool {
  id: string;
  name: string;
  icon: string;
  version?: string;
}

export interface DetectedAgent {
  name: string;
  tool: string;
  path: string;
  description?: string;
}

export interface DetectedSkill {
  name: string;
  tool: string;
  path: string;
  description?: string;
}

export interface DetectedMCP {
  name: string;
  tool: string;
  path: string;
  type: 'local' | 'remote';
}

export interface ScanResultData {
  duration: number;
  tools: DetectedTool[];
  agents: DetectedAgent[];
  skills: DetectedSkill[];
  mcps: DetectedMCP[];
  paths: string[];
  timestamp: string;
  filesScanned: number;
}

export interface MigratedAgent {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface MigratedSkill {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface MigratedMCP {
  name: string;
  sourcePath: string;
  targetPath: string;
  status: 'success' | 'error' | 'skipped';
}

export interface CreatedFile {
  path: string;
  type: 'config' | 'agent' | 'skill' | 'mcp' | 'backup';
  size?: number;
}

export interface MigrationError {
  message: string;
  context?: string;
  recoverable: boolean;
}

export interface BackupInfo {
  path: string;
  timestamp: string;
  size: number;
}

export interface MigrationResultData {
  success: boolean;
  sourceTool: string;
  targetTool: string;
  duration: number;
  migratedAgents: MigratedAgent[];
  migratedSkills: MigratedSkill[];
  migratedMCPs: MigratedMCP[];
  createdFiles: CreatedFile[];
  errors: MigrationError[];
  warnings: string[];
  backup?: BackupInfo;
  timestamp: string;
}

export type ResultsAction = 
  | { type: 'continue' }
  | { type: 'new-migration' }
  | { type: 'scan-again' }
  | { type: 'view-files'; paths: string[] }
  | { type: 'export'; format: 'json' | 'markdown' };

export interface ResultsPanelProps {
  mode: ResultsMode;
  scanResult?: ScanResultData;
  migrationResult?: MigrationResultData;
  onAction: (action: ResultsAction) => void;
  onExit: () => void;
  title?: string;
  autoFocus?: boolean;
}

const TOOL_ICONS: Record<string, string> = {
  claude: '🟠',
  opencode: '🔵',
  gemini: '🟣',
  cursor: '🟢',
  copilot: '⚪',
};

const TOOL_NAMES: Record<string, string> = {
  claude: 'Claude Code',
  opencode: 'OpenCode',
  gemini: 'Gemini CLI',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
};

export function ResultsPanel({
  mode,
  scanResult,
  migrationResult,
  onAction,
  onExit,
  title,
}: ResultsPanelProps): React.ReactElement {
  const { exit } = useApp();
  const [scrollOffset, setScrollOffset] = useState(0);

  useInput((input, key) => {
    // Exit
    if (input === 'q') {
      onExit();
      return;
    }

    // Continue / Done
    if (key.return) {
      onAction({ type: 'continue' });
      return;
    }

    // Start new migration
    if (input === 'm') {
      onAction({ type: 'new-migration' });
      return;
    }

    // Scan again
    if (input === 's') {
      onAction({ type: 'scan-again' });
      return;
    }

    // Export
    if (input === 'e') {
      onAction({ type: 'export', format: 'json' });
      return;
    }

    // Scrolling
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset(prev => prev + 1);
    }
  });

  if (mode === 'scan' && !scanResult) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text color="red">Error: No scan results available</Text>
        <Text color="gray">Press Enter to continue or q to exit</Text>
      </Box>
    );
  }

  if (mode === 'migration' && !migrationResult) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text color="red">Error: No migration results available</Text>
        <Text color="gray">Press Enter to continue or q to exit</Text>
      </Box>
    );
  }

  if (mode === 'scan' && scanResult) {
    return <ScanResultsView result={scanResult} onAction={onAction} onExit={onExit} scrollOffset={scrollOffset} />;
  }

  if (mode === 'migration' && migrationResult) {
    return <MigrationResultsView result={migrationResult} onAction={onAction} onExit={onExit} scrollOffset={scrollOffset} />;
  }

  return (
    <Box flexDirection="column" padding={2}>
      <Text color="red">Error: Invalid mode or missing data</Text>
    </Box>
  );
}

interface ScanResultsViewProps {
  result: ScanResultData;
  onAction: (action: ResultsAction) => void;
  onExit: () => void;
  scrollOffset: number;
}

function ScanResultsView({ result, onAction, onExit, scrollOffset }: ScanResultsViewProps): React.ReactElement {
  const hasEntities = result.agents.length > 0 || result.skills.length > 0 || result.mcps.length > 0;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="green">
          ✓ Scan Complete
        </Text>
      </Box>

      {/* Summary */}
      <Box marginBottom={1}>
        <Text color="gray">
          Duration: {(result.duration / 1000).toFixed(2)}s • Files scanned: {result.filesScanned}
        </Text>
      </Box>

      {/* Tools Detected */}
      {result.tools.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Tools Detected:</Text>
          </Box>
          {result.tools.map((tool, idx) => (
            <Box key={idx}>
              <Text>{tool.icon || TOOL_ICONS[tool.id] || '⚪'} {tool.name}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Agents Found */}
      {result.agents.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Agents Found ({result.agents.length}):</Text>
          </Box>
          {result.agents.slice(0, 5).map((agent, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Text>• {TOOL_ICONS[agent.tool] || '⚪'} {agent.name}</Text>
              </Box>
              <Box marginLeft={2}>
                <Text color="gray" dimColor>{agent.path}</Text>
              </Box>
            </Box>
          ))}
          {result.agents.length > 5 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.agents.length - 5} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Skills Found */}
      {result.skills.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Skills Found ({result.skills.length}):</Text>
          </Box>
          {result.skills.slice(0, 3).map((skill, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Text>• {skill.name}</Text>
              </Box>
              <Box marginLeft={2}>
                <Text color="gray" dimColor>{skill.path}</Text>
              </Box>
            </Box>
          ))}
          {result.skills.length > 3 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.skills.length - 3} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* MCP Servers */}
      {result.mcps.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>MCP Servers ({result.mcps.length}):</Text>
          </Box>
          {result.mcps.slice(0, 3).map((mcp, idx) => (
            <Box key={idx}>
              <Text>• {mcp.name}</Text>
            </Box>
          ))}
          {result.mcps.length > 3 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.mcps.length - 3} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Empty State */}
      {!hasEntities && (
        <Box marginBottom={1}>
          <Text color="yellow">No agents, skills, or MCPs found.</Text>
        </Box>
      )}

      {/* Action Bar */}
      <Box marginTop={1} flexDirection="row">
        {result.agents.length > 0 && (
          <Box marginRight={3}>
            <Text color="green">[m] Start Migration</Text>
          </Box>
        )}
        <Box marginRight={3}>
          <Text color="blue">[s] Scan Again</Text>
        </Box>
        <Box>
          <Text color="gray">[Enter] Continue</Text>
        </Box>
      </Box>
    </Box>
  );
}

interface MigrationResultsViewProps {
  result: MigrationResultData;
  onAction: (action: ResultsAction) => void;
  onExit: () => void;
  scrollOffset: number;
}

function MigrationResultsView({ result, onAction, onExit, scrollOffset }: MigrationResultsViewProps): React.ReactElement {
  const successCount = result.migratedAgents.filter(a => a.status === 'success').length +
                       result.migratedSkills.filter(s => s.status === 'success').length +
                       result.migratedMCPs.filter(m => m.status === 'success').length;
  const errorCount = result.migratedAgents.filter(a => a.status === 'error').length +
                     result.migratedSkills.filter(s => s.status === 'error').length +
                     result.migratedMCPs.filter(m => m.status === 'error').length;
  const skippedCount = result.migratedAgents.filter(a => a.status === 'skipped').length +
                       result.migratedSkills.filter(s => s.status === 'skipped').length +
                       result.migratedMCPs.filter(m => m.status === 'skipped').length;

  const hasErrors = errorCount > 0 || result.errors.length > 0;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={hasErrors ? 'yellow' : 'green'}>
          {hasErrors ? '⚠ Migration Completed with Errors' : '✓ Migration Complete'}
        </Text>
      </Box>

      {/* Summary */}
      <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
        <Box marginBottom={1}>
          <Text bold>Migration Summary:</Text>
        </Box>
        
        <Box flexDirection="row" marginBottom={1}>
          <Text color="gray">From: </Text>
          <Text>
            {TOOL_ICONS[result.sourceTool] || '⚪'} {TOOL_NAMES[result.sourceTool] || result.sourceTool}
          </Text>
        </Box>

        <Box flexDirection="row" marginBottom={1}>
          <Text color="gray">To: </Text>
          <Text>
            {TOOL_ICONS[result.targetTool] || '⚪'} {TOOL_NAMES[result.targetTool] || result.targetTool}
          </Text>
        </Box>

        <Box flexDirection="row">
          <Box marginRight={2}>
            <Text color="green">✓ {successCount} Success</Text>
          </Box>
          {errorCount > 0 && (
            <Box marginRight={2}>
              <Text color="red">✗ {errorCount} Failed</Text>
            </Box>
          )}
          {skippedCount > 0 && (
            <Box>
              <Text color="yellow">○ {skippedCount} Skipped</Text>
            </Box>
          )}
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Duration: {(result.duration / 1000).toFixed(2)}s</Text>
        </Box>
      </Box>

      {/* Migrated Agents */}
      {result.migratedAgents.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Migrated Agents ({result.migratedAgents.length}):</Text>
          </Box>
          {result.migratedAgents.slice(0, 5).map((agent, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Text color={agent.status === 'success' ? 'green' : agent.status === 'error' ? 'red' : 'yellow'}>
                  {agent.status === 'success' ? '✓' : agent.status === 'error' ? '✗' : '○'} {agent.name}
                </Text>
              </Box>
              {agent.status === 'success' && (
                <>
                  <Box marginLeft={2}>
                    <Text color="gray" dimColor>Source: {agent.sourcePath}</Text>
                  </Box>
                  <Box marginLeft={2}>
                    <Text color="cyan" dimColor>Target: {agent.targetPath}</Text>
                  </Box>
                </>
              )}
              {agent.error && (
                <Box marginLeft={2}>
                  <Text color="red" dimColor>Error: {agent.error}</Text>
                </Box>
              )}
            </Box>
          ))}
          {result.migratedAgents.length > 5 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.migratedAgents.length - 5} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Migrated Skills */}
      {result.migratedSkills.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Migrated Skills ({result.migratedSkills.length}):</Text>
          </Box>
          {result.migratedSkills.slice(0, 3).map((skill, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Text color={skill.status === 'success' ? 'green' : skill.status === 'error' ? 'red' : 'yellow'}>
                  {skill.status === 'success' ? '✓' : skill.status === 'error' ? '✗' : '○'} {skill.name}
                </Text>
              </Box>
            </Box>
          ))}
          {result.migratedSkills.length > 3 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.migratedSkills.length - 3} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Created Files */}
      {result.createdFiles.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Box marginBottom={1}>
            <Text bold>Created Files:</Text>
          </Box>
          {result.createdFiles.slice(0, 5).map((file, idx) => (
            <Box key={idx} marginLeft={2}>
              <Text color="cyan">
                {file.path.endsWith('/') ? '📁' : '📄'} {file.path}
              </Text>
            </Box>
          ))}
          {result.createdFiles.length > 5 && (
            <Box marginLeft={2}>
              <Text color="gray">... and {result.createdFiles.length - 5} more</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Backup Info */}
      {result.backup && (
        <Box marginBottom={1}>
          <Text color="gray">
            💾 Backup created: 
          </Text>
          <Text color="cyan" dimColor>
            {result.backup.path}
          </Text>
        </Box>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="red" padding={1}>
          <Box marginBottom={1}>
            <Text bold color="red">Errors:</Text>
          </Box>
          {result.errors.map((error, idx) => (
            <Box key={idx} marginLeft={2} marginBottom={1}>
              <Text color="red" dimColor>
                • {error.message}
              </Text>
              {error.context && (
                <Text color="gray" dimColor>
                  Context: {error.context}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="yellow">Warnings:</Text>
          </Box>
          {result.warnings.map((warning, idx) => (
            <Box key={idx} marginLeft={2}>
              <Text color="yellow" dimColor>
                • {warning}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Action Bar */}
      <Box marginTop={1} flexDirection="row">
        <Box marginRight={3}>
          <Text color="blue">[Enter] Done</Text>
        </Box>
        <Box marginRight={3}>
          <Text color="green">[m] New Migration</Text>
        </Box>
        <Box>
          <Text color="gray">[s] Scan Again</Text>
        </Box>
      </Box>
    </Box>
  );
}
