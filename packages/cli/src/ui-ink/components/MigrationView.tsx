/**
 * Migration View Component
 * Interface for migrating detected agents between tools
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import type { Route } from '../App.js';

interface MigrationViewProps {
  detectedAgents: Array<{
    tool: string;
    name: string;
    path: string;
  }>;
  selectedSourceTool?: string;
  selectedTargetTool?: string;
  migrationResult?: {
    success: boolean;
    files: string[];
    errors: string[];
  };
  onToolsSelected: (source?: string, target?: string) => void;
  onMigrationComplete: (result: MigrationViewProps['migrationResult']) => void;
  onNavigate: (route: Route) => void;
}

const ADAPTERS = [
  { id: 'claude', name: 'Claude Code', icon: '🟠', supported: true },
  { id: 'opencode', name: 'OpenCode', icon: '🔵', supported: true },
  { id: 'gemini', name: 'Gemini CLI', icon: '🟣', supported: false },
  { id: 'cursor', name: 'Cursor', icon: '🟢', supported: false },
];

export function MigrationView({
  detectedAgents,
  selectedSourceTool,
  selectedTargetTool,
  migrationResult,
  onToolsSelected,
  onMigrationComplete,
  onNavigate,
}: MigrationViewProps): React.ReactElement {
  const [step, setStep] = useState<'select-source' | 'select-target' | 'confirm' | 'migrating' | 'complete'>('select-source');

  const availableSourceTools = [...new Set(detectedAgents.map(a => a.tool))];
  
  const handleSourceSelect = (toolId: string) => {
    onToolsSelected(toolId, undefined);
    setStep('select-target');
  };

  const handleTargetSelect = (toolId: string) => {
    onToolsSelected(undefined, toolId);
    setStep('confirm');
  };

  const handleMigrate = async () => {
    setStep('migrating');
    
    // Simulate migration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onMigrationComplete({
      success: true,
      files: [
        `/migrated/${selectedTargetTool}/agent-config.json`,
        `/migrated/${selectedTargetTool}/skills/`,
      ],
      errors: [],
    });
    
    setStep('complete');
  };

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          ⇄ Migrate Agents
        </Text>
      </Box>

      {/* Step 1: Select Source */}
      {step === 'select-source' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 1: Select source tool
            </Text>
          </Box>

          <Box flexDirection="column">
            {availableSourceTools.map((toolId) => {
              const adapter = ADAPTERS.find(a => a.id === toolId);
              return (
                <Box key={toolId} marginBottom={1}>
                  <Text
                    backgroundColor={selectedSourceTool === toolId ? 'blue' : undefined}
                    color={selectedSourceTool === toolId ? 'white' : 'white'}
                  >
                    {' '}{adapter?.icon || '⚪'} {adapter?.name || toolId}{' '}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {availableSourceTools.length === 0 && (
            <Box marginTop={1}>
              <Text color="yellow">
                No agents detected. Please scan first.
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Step 2: Select Target */}
      {step === 'select-target' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 2: Select target tool
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="white">
              From: {ADAPTERS.find(a => a.id === selectedSourceTool)?.name}
            </Text>
          </Box>

          <Box flexDirection="column">
            {ADAPTERS.filter(a => a.supported && a.id !== selectedSourceTool).map((adapter) => (
              <Box key={adapter.id} marginBottom={1}>
                <Text
                  backgroundColor={selectedTargetTool === adapter.id ? 'blue' : undefined}
                  color={selectedTargetTool === adapter.id ? 'white' : 'white'}
                >
                  {' '}{adapter.icon} {adapter.name}{' '}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 3: Confirm migration
            </Text>
          </Box>

          <Box marginBottom={2}>
            <Text color="white">
              Migrate from: <Text bold>{ADAPTERS.find(a => a.id === selectedSourceTool)?.name}</Text>
            </Text>
            <Text color="white">
              Migrate to: <Text bold>{ADAPTERS.find(a => a.id === selectedTargetTool)?.name}</Text>
            </Text>
          </Box>

          <Box marginBottom={2}>
            <Text color="gray">
              Agents to migrate:
            </Text>
            {detectedAgents
              .filter(a => a.tool === selectedSourceTool)
              .map((agent, idx) => (
                <Box key={idx} marginLeft={2}>
                  <Text color="white">• {agent.name}</Text>
                </Box>
              ))}
          </Box>

          <Box>
            <Text color="green">
              Press [Enter] to start migration
            </Text>
          </Box>
        </Box>
      )}

      {/* Migrating */}
      {step === 'migrating' && (
        <Box flexDirection="column">
          <Text color="yellow">
            Migrating agents...
          </Text>
          <Box marginTop={1}>
            <Text color="blue">
              ⠋ Processing configuration files...
            </Text>
          </Box>
        </Box>
      )}

      {/* Complete */}
      {step === 'complete' && migrationResult && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="green">
              ✓ Migration complete!
            </Text>
          </Box>

          <Box marginBottom={2}>
            <Text color="gray">
              Migrated files:
            </Text>
            {migrationResult.files.map((file, idx) => (
              <Box key={idx} marginLeft={2}>
                <Text color="white">• {file}</Text>
              </Box>
            ))}
          </Box>

          <Box>
            <Text color="blue">
              Press [s] to scan more or [q] to quit
            </Text>
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={2}>
        <Text color="gray" dimColor>
          esc - Back • q - Quit
        </Text>
      </Box>
    </Box>
  );
}
