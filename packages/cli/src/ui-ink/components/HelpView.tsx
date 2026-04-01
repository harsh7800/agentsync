/**
 * Help View Component
 * Display keyboard shortcuts and command reference
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

interface HelpViewProps {
  onBack: () => void;
}

const COMMANDS = [
  { key: '/', description: 'Open command palette' },
  { key: 's', description: 'Go to Scan view' },
  { key: 'm', description: 'Go to Migrate view' },
  { key: 'h', description: 'Show this help' },
  { key: 'q', description: 'Quit AgentSync' },
  { key: 'esc', description: 'Go back / Cancel' },
  { key: '↑ ↓', description: 'Navigate up/down' },
  { key: '← →', description: 'Navigate left/right' },
  { key: 'Enter', description: 'Select / Confirm' },
];

const NAVIGATION = [
  { route: 'Scan', description: 'Find AI agents on your system' },
  { route: 'Migrate', description: 'Migrate agents between tools' },
  { route: 'Help', description: 'View commands and shortcuts' },
];

export function HelpView({ onBack }: HelpViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          ? Help & Shortcuts
        </Text>
      </Box>

      {/* Navigation */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="white">
            Navigation:
          </Text>
        </Box>

        {NAVIGATION.map((item) => (
          <Box key={item.route} marginBottom={1}>
            <Box width={12}>
              <Text color="blue">
                {item.route}
              </Text>
            </Box>
            <Text color="gray">
              {item.description}
            </Text>
          </Box>
        ))}
      </Box>

      <Newline />

      {/* Keyboard Shortcuts */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="white">
            Keyboard Shortcuts:
          </Text>
        </Box>

        {COMMANDS.map((cmd) => (
          <Box key={cmd.key} marginBottom={1}>
            <Box width={12}>
              <Text color="green">
                {cmd.key}
              </Text>
            </Box>
            <Text color="white">
              {cmd.description}
            </Text>
          </Box>
        ))}
      </Box>

      <Newline />

      {/* Tips */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="white">
            Tips:
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="gray">
            • Use the sidebar on the left to quickly switch between views
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="gray">
            • Press '/' at any time to open the command palette
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="gray">
            • Use Tab and Shift+Tab to navigate between interactive elements
          </Text>
        </Box>
      </Box>

      <Newline />

      {/* Footer */}
      <Box>
        <Text color="blue">
          Press [esc] or [q] to go back
        </Text>
      </Box>
    </Box>
  );
}
