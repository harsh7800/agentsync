/**
 * PathSelector Component
 * Select output location for migration
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { FileBrowser } from './FileBrowser.js';

interface PathSelectorProps {
  /** Default path suggestion */
  defaultPath?: string;
  /** Whether this is for output or input */
  mode?: 'output' | 'input';
  /** Description of what we're selecting */
  description?: string;
  /** Callback when path is selected */
  onSelect: (path: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

type SelectorStep = 'preset' | 'custom' | 'browser';

const PRESET_PATHS = [
  { id: 'default', label: 'Default Location', path: '~/.agentsync/migrations', description: 'Standard migration output directory' },
  { id: 'project', label: 'Project Directory', path: './.agentsync', description: 'Local project folder' },
  { id: 'custom', label: 'Custom Path...', path: '', description: 'Choose your own location' },
];

export function PathSelector({
  defaultPath = '~/.agentsync/migrations',
  mode = 'output',
  description = 'Select where to save the migrated files',
  onSelect,
  onCancel,
}: PathSelectorProps): React.ReactElement {
  const [step, setStep] = useState<SelectorStep>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customPath, setCustomPath] = useState('');

  const handlePresetSelect = () => {
    const preset = PRESET_PATHS[selectedPresetIndex];
    if (preset.id === 'custom') {
      setStep('browser');
    } else {
      onSelect(preset.path);
    }
  };

  const handleBrowserSelect = (path: string) => {
    onSelect(path);
  };

  if (step === 'browser') {
    return (
      <FileBrowser
        initialPath={process.cwd()}
        onSelect={handleBrowserSelect}
        onCancel={() => setStep('preset')}
        title="Select output directory"
      />
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          📍 Select Output Location
        </Text>
      </Box>

      {/* Description */}
      <Box marginBottom={2}>
        <Text color="gray">
          {description}
        </Text>
      </Box>

      {/* Preset Options */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="white">
            Choose a location:
          </Text>
        </Box>

        {PRESET_PATHS.map((preset, index) => {
          const isSelected = index === selectedPresetIndex;
          return (
            <Box key={preset.id} marginBottom={1}>
              <Box>
                <Text
                  backgroundColor={isSelected ? 'blue' : undefined}
                  color={isSelected ? 'white' : 'white'}
                  bold={isSelected}
                >
                  {' '}{isSelected ? '▶' : ' '}{' '}
                </Text>
              </Box>
              <Box flexDirection="column" marginLeft={1}>
                <Text
                  color={isSelected ? 'blue' : 'white'}
                  bold={isSelected}
                >
                  {preset.label}
                </Text>
                <Text color="gray" dimColor>
                  {preset.path || 'Browse for custom location'}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Selected Path Preview */}
      <Box marginTop={2} marginBottom={2} borderStyle="single">
        <Box marginLeft={1} marginRight={1}>
          <Text color="gray">Selected: </Text>
          <Text color="green">
            {PRESET_PATHS[selectedPresetIndex].path || 'Custom path (browse)'}
          </Text>
        </Box>
      </Box>

      {/* Instructions */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate • Enter: Select • Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
}
