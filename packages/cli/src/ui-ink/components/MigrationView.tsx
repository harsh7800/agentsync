/**
 * Migration View Component
 * Interface for migrating detected agents between tools
 */

import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { homedir } from 'os';
import { MigrationService } from '@agent-sync/core';
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
  selectedSourceTool: propSourceTool,
  selectedTargetTool: propTargetTool,
  migrationResult,
  onToolsSelected,
  onMigrationComplete,
  onNavigate,
}: MigrationViewProps): React.ReactElement {
  const { exit } = useApp();
  const [step, setStep] = useState<'select-source' | 'select-target' | 'select-output-path' | 'confirm' | 'migrating' | 'complete' | 'error'>('select-source');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sourceTool, setSourceTool] = useState<string | undefined>(propSourceTool);
  const [targetTool, setTargetTool] = useState<string | undefined>(propTargetTool);
  const [outputPath, setOutputPath] = useState<string>(process.cwd());
  const [localMigrationResult, setLocalMigrationResult] = useState<typeof migrationResult>(migrationResult);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const OUTPUT_PATHS = [
    { id: 'current', label: '📁 Current Directory', path: process.cwd() },
    { id: 'home', label: '🏠 Home Directory', path: homedir() },
    { id: 'config', label: '⚙️  Default Config Location', path: homedir() + '/.config' },
  ];

  const availableSourceTools = [...new Set(detectedAgents.map(a => a.tool))];
  const availableTargetTools = ADAPTERS.filter(a => a.supported && a.id !== sourceTool);
  
  useInput((input, key) => {
    if (step === 'migrating') return;

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const maxIndex = step === 'select-source' ? availableSourceTools.length - 1 :
                      step === 'select-target' ? availableTargetTools.length - 1 :
                      step === 'select-output-path' ? OUTPUT_PATHS.length - 1 : 0;
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    } else if (key.return) {
      if (step === 'select-source') {
        handleSourceSelect(availableSourceTools[selectedIndex]);
        setSelectedIndex(0);
      } else if (step === 'select-target') {
        if (availableTargetTools[selectedIndex]) {
          handleTargetSelect(availableTargetTools[selectedIndex].id);
        }
      } else if (step === 'select-output-path') {
        handleOutputPathSelect(OUTPUT_PATHS[selectedIndex].path);
      } else if (step === 'confirm') {
        handleMigrate();
      } else if (step === 'complete') {
        onNavigate('scan');
      }
    } else if (input === 'q') {
      exit();
    } else if (key.escape) {
      if (step === 'select-target') {
        setStep('select-source');
        setSelectedIndex(0);
      } else if (step === 'select-output-path') {
        setStep('select-target');
        setSelectedIndex(0);
      } else if (step === 'confirm') {
        setStep('select-output-path');
        setSelectedIndex(0);
      } else if (step === 'error') {
        setStep('select-source');
        setSelectedIndex(0);
        setErrorMessage('');
      }
    }
  });
  
  const handleSourceSelect = (toolId: string) => {
    setSourceTool(toolId);
    onToolsSelected(toolId, undefined);
    setStep('select-target');
  };

  const handleTargetSelect = (toolId: string) => {
    setTargetTool(toolId);
    onToolsSelected(sourceTool, toolId);
    setStep('select-output-path');
    setSelectedIndex(0);
  };

  const handleOutputPathSelect = (path: string) => {
    setOutputPath(path);
    setStep('confirm');
    setSelectedIndex(0);
  };

  const handleMigrate = async () => {
    if (!sourceTool || !targetTool) return;
    
    setStep('migrating');
    
    try {
      // Create migration service
      const migrationService = new MigrationService({ useCommonSchema: true });
      
      // Determine source path based on tool
      const sourcePath = sourceTool === 'opencode' 
        ? process.cwd() + '/.opencode'
        : homedir() + '/.config/' + sourceTool;
      
      // Perform actual migration
      const result = await migrationService.migrate({
        sourceTool: sourceTool as any,
        targetTool: targetTool as any,
        sourcePath,
        targetPath: outputPath,
        backupDir: outputPath + '/.backup',
        dryRun: false,
        verbose: false
      });
      
      const displayResult = {
        success: result.success,
        files: result.success 
          ? [
              `${outputPath}/${targetTool}/settings.json`,
              `${outputPath}/${targetTool}/agents/`,
              `${outputPath}/${targetTool}/skills/`,
            ]
          : [],
        errors: result.errors
      };
      
      setLocalMigrationResult(displayResult);
      onMigrationComplete(displayResult);
      setStep('complete');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Migration failed';
      setErrorMessage(errorMsg);
      setStep('error');
      return;
    }
    
    setSelectedIndex(0);
  };

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          ⇄ Migrate Agents
        </Text>
      </Box>

      {/* Step 1: Select Source Tool */}
      {step === 'select-source' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 1: Select source tool
            </Text>
          </Box>

          <Box flexDirection="column">
            {availableSourceTools.map((toolId, index) => {
              const adapter = ADAPTERS.find(a => a.id === toolId);
              const isSelected = selectedIndex === index;
              return (
                <Box 
                  key={toolId} 
                  marginBottom={1}
                  borderStyle={isSelected ? "single" : undefined}
                  borderColor={isSelected ? "green" : undefined}
                  paddingX={1}
                >
                  <Text color={isSelected ? 'green' : 'white'}>
                    {isSelected ? '▶ ' : '  '}
                    <Text bold={isSelected}>{adapter?.icon || '⚪'} {adapter?.name || toolId}</Text>
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

          <Box marginTop={2}>
            <Text color="gray">Use ↑↓ to select, Enter to confirm, q to quit</Text>
          </Box>
        </Box>
      )}

      {/* Step 2: Select Target Tool */}
      {step === 'select-target' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 2: Select target tool
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="white">
              From: {ADAPTERS.find(a => a.id === sourceTool)?.name}
            </Text>
          </Box>

          <Box flexDirection="column">
            {ADAPTERS.filter(a => a.supported && a.id !== sourceTool).map((adapter, index) => {
              const isSelected = selectedIndex === index;
              return (
                <Box 
                  key={adapter.id} 
                  marginBottom={1}
                  borderStyle={isSelected ? "single" : undefined}
                  borderColor={isSelected ? "green" : undefined}
                  paddingX={1}
                >
                  <Text color={isSelected ? 'green' : 'white'}>
                    {isSelected ? '▶ ' : '  '}
                    <Text bold={isSelected}>{adapter.icon} {adapter.name}</Text>
                  </Text>
                </Box>
              );
            })}
          </Box>

          <Box marginTop={2}>
            <Text color="gray">Use ↑↓ to select, Enter to confirm, Esc to go back, q to quit</Text>
          </Box>
        </Box>
      )}

      {/* Step 3: Select Output Path */}
      {step === 'select-output-path' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 3: Select output location
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="white">
              Migration: {ADAPTERS.find(a => a.id === sourceTool)?.name} → {ADAPTERS.find(a => a.id === targetTool)?.name}
            </Text>
          </Box>

          <Box flexDirection="column">
            {OUTPUT_PATHS.map((option, index) => {
              const isSelected = selectedIndex === index;
              return (
                <Box 
                  key={option.id} 
                  marginBottom={1}
                  borderStyle={isSelected ? "single" : undefined}
                  borderColor={isSelected ? "green" : undefined}
                  paddingX={1}
                >
                  <Text color={isSelected ? 'green' : 'white'}>
                    {isSelected ? '▶ ' : '  '}
                    <Text bold={isSelected}>{option.label}</Text>
                  </Text>
                  <Box marginLeft={4}>
                    <Text color="gray" dimColor>{option.path}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box marginTop={2}>
            <Text color="gray">Use ↑↓ to select, Enter to confirm, Esc to go back, q to quit</Text>
          </Box>
        </Box>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Step 4: Confirm migration
            </Text>
          </Box>

          <Box marginBottom={2} borderStyle="single" padding={1}>
            <Text color="white">
              From: <Text bold>{ADAPTERS.find(a => a.id === sourceTool)?.name}</Text>
            </Text>
            <Text color="white">
              To: <Text bold>{ADAPTERS.find(a => a.id === targetTool)?.name}</Text>
            </Text>
            <Text color="white">
              Output: <Text bold color="cyan">{outputPath}</Text>
            </Text>
          </Box>

          <Box marginBottom={2}>
            <Text color="gray">
              Agents to migrate:
            </Text>
            {detectedAgents
              .filter(a => a.tool === sourceTool)
              .map((agent, idx) => (
                <Box key={idx} marginLeft={2}>
                  <Text color="white">• {agent.name}</Text>
                </Box>
              ))}
          </Box>

          <Box marginTop={1}>
            <Text color="green">
              Press [Enter] to start migration
            </Text>
          </Box>
          <Box>
            <Text color="gray">
              Press [Esc] to go back, [q] to quit
            </Text>
          </Box>
        </Box>
      )}

      {/* Migrating */}
      {step === 'migrating' && (
        <Box flexDirection="column" padding={2}>
          <Box marginBottom={1}>
            <Text bold color="yellow">
              🔄 Migrating agents...
            </Text>
          </Box>
          
          <Box marginBottom={1}>
            <Text color="cyan">
              {ADAPTERS.find(a => a.id === sourceTool)?.icon} {ADAPTERS.find(a => a.id === sourceTool)?.name}
            </Text>
            <Text color="gray">↓</Text>
            <Text color="cyan">
              {ADAPTERS.find(a => a.id === targetTool)?.icon} {ADAPTERS.find(a => a.id === targetTool)?.name}
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color="blue">
              ⠋ Processing configuration files...
            </Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color="gray">Please wait, this may take a moment</Text>
          </Box>
        </Box>
      )}

      {/* Complete */}
      {step === 'complete' && localMigrationResult && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="green">
              ✓ Migration complete!
            </Text>
          </Box>

          <Box marginBottom={2} borderStyle="single" padding={1}>
            <Text color="gray">
              Migrated files:
            </Text>
            {localMigrationResult.files.map((file, idx) => (
              <Box key={idx} marginLeft={2}>
                <Text color="cyan">• {file}</Text>
              </Box>
            ))}
          </Box>

          <Box marginTop={1}>
            <Text color="blue">
              Press [Enter] to scan more or [q] to quit
            </Text>
          </Box>
        </Box>
      )}

      {/* Error */}
      {step === 'error' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="red">
              ✗ Migration failed!
            </Text>
          </Box>

          <Box marginBottom={2} borderStyle="single" borderColor="red" padding={1}>
            <Text color="red">
              Error: {errorMessage}
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color="gray">
              Press [Enter] or [Esc] to go back
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
