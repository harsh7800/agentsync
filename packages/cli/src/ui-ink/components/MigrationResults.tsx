/**
 * MigrationResults Component
 * Display migration results with exact file paths
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import type { Route } from '../App.js';

interface MigrationResultsProps {
  /** Migration result data */
  result: {
    success: boolean;
    sourceTool: string;
    targetTool: string;
    migratedAgents: Array<{
      name: string;
      sourcePath: string;
      targetPath: string;
      status: 'success' | 'error' | 'skipped';
      error?: string;
    }>;
    createdFiles: string[];
    errors: string[];
    backupPath?: string;
  };
  /** Callback to navigate */
  onNavigate: (route: Route) => void;
  /** Callback to start new migration */
  onNewMigration: () => void;
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

export function MigrationResults({
  result,
  onNavigate,
  onNewMigration,
}: MigrationResultsProps): React.ReactElement {
  const successCount = result.migratedAgents.filter(a => a.status === 'success').length;
  const errorCount = result.migratedAgents.filter(a => a.status === 'error').length;
  const skippedCount = result.migratedAgents.filter(a => a.status === 'skipped').length;

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          ✓ Migration Complete
        </Text>
      </Box>

      {/* Summary */}
      <Box marginBottom={2} borderStyle="single" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="white">
            Migration Summary
          </Text>
        </Box>

        <Box flexDirection="row" marginBottom={1}>
          <Text color="gray">From: </Text>
          <Text color="white">
            {TOOL_ICONS[result.sourceTool] || '⚪'} {TOOL_NAMES[result.sourceTool] || result.sourceTool}
          </Text>
        </Box>

        <Box flexDirection="row" marginBottom={1}>
          <Text color="gray">To: </Text>
          <Text color="white">
            {TOOL_ICONS[result.targetTool] || '⚪'} {TOOL_NAMES[result.targetTool] || result.targetTool}
          </Text>
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Box marginRight={3}>
            <Text color="green">
              ✓ {successCount} Success
            </Text>
          </Box>
          {errorCount > 0 && (
            <Box marginRight={3}>
              <Text color="red">
                ✗ {errorCount} Failed
              </Text>
            </Box>
          )}
          {skippedCount > 0 && (
            <Box>
              <Text color="yellow">
                ○ {skippedCount} Skipped
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Migrated Agents */}
      {result.migratedAgents.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Box marginBottom={1}>
            <Text bold color="white">
              Migrated Agents:
            </Text>
          </Box>

          {result.migratedAgents.map((agent, index) => (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Text color={agent.status === 'success' ? 'green' : agent.status === 'error' ? 'red' : 'yellow'}>
                  {agent.status === 'success' ? '✓' : agent.status === 'error' ? '✗' : '○'}
                </Text>
                <Box marginLeft={1}>
                  <Text color="white" bold>
                    {agent.name}
                  </Text>
                </Box>
              </Box>

              <Box marginLeft={3}>
                <Text color="gray" dimColor>
                  Source: {agent.sourcePath}
                </Text>
              </Box>

              {agent.status === 'success' && (
                <Box marginLeft={3}>
                  <Text color="cyan" dimColor>
                    Target: {agent.targetPath}
                  </Text>
                </Box>
              )}

              {agent.error && (
                <Box marginLeft={3}>
                  <Text color="red" dimColor>
                    Error: {agent.error}
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Created Files */}
      {result.createdFiles.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Box marginBottom={1}>
            <Text bold color="white">
              Created Files:
            </Text>
          </Box>

          {result.createdFiles.map((file, index) => (
            <Box key={index} marginLeft={2}>
              <Text color="cyan">
                📄 {file}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Backup Info */}
      {result.backupPath && (
        <Box marginBottom={2}>
          <Text color="gray">
            💾 Backup created: 
          </Text>
          <Text color="cyan" dimColor>
            {result.backupPath}
          </Text>
        </Box>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <Box flexDirection="column" marginBottom={2}>
          <Box marginBottom={1}>
            <Text bold color="red">
              Errors:
            </Text>
          </Box>

          {result.errors.map((error, index) => (
            <Box key={index} marginLeft={2}>
              <Text color="red" dimColor>
                • {error}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Newline />

      {/* Actions */}
      <Box flexDirection="row" marginTop={1}>
        <Box marginRight={3}>
          <Text color="blue">
            [Enter] Done
          </Text>
        </Box>
        <Box marginRight={3}>
          <Text color="green">
            [m] New Migration
          </Text>
        </Box>
        <Box>
          <Text color="gray">
            [s] Scan Again
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
