/**
 * Welcome View Component
 * Initial welcome screen with navigation options
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

interface WelcomeViewProps {
  onStart: () => void;
  onHelp: () => void;
}

export function WelcomeView({ onStart, onHelp }: WelcomeViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      {/* Logo */}
      <Box marginBottom={2}>
        <Text bold color="blue" backgroundColor="blueBright">
          {'  AgentSync  '}
        </Text>
      </Box>

      {/* Tagline */}
      <Box marginBottom={1}>
        <Text color="gray">
          AI Agent Configuration Migration Tool
        </Text>
      </Box>

      <Newline />

      {/* Description */}
      <Box marginBottom={2} width={60}>
        <Text color="white">
          Seamlessly migrate AI agent configurations between Claude Code, OpenCode, Gemini CLI, Cursor, and more.
        </Text>
      </Box>

      <Newline />

      {/* Options */}
      <Box flexDirection="column" alignItems="center">
        <Box marginBottom={1}>
          <Text color="green">
            [Enter]
          </Text>
          <Text> Start Scanning </Text>
          <Text color="gray">- Find your AI agents</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="yellow">
            [h]
          </Text>
          <Text> Help </Text>
          <Text color="gray">- View commands and shortcuts</Text>
        </Box>

        <Box>
          <Text color="red">
            [q]
          </Text>
          <Text> Quit </Text>
          <Text color="gray">- Exit AgentSync</Text>
        </Box>
      </Box>

      <Newline />
      <Newline />

      {/* Hint */}
      <Box>
        <Text color="gray" dimColor>
          Use the sidebar on the left to navigate between views
        </Text>
      </Box>
    </Box>
  );
}
