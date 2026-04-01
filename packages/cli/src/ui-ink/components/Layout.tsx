/**
 * Simplified Layout Component
 * No sidebar, just clean content area
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Route } from '../App.js';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: Route;
}

export function Layout({ children, currentRoute }: LayoutProps): React.ReactElement {
  const getRouteTitle = () => {
    switch (currentRoute) {
      case 'scan': return 'Scan';
      case 'migrate': return 'Migrate';
      case 'help': return 'Help';
      case 'error': return 'Error';
      default: return '';
    }
  };

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="blue">
          AgentSync {getRouteTitle() && `- ${getRouteTitle()}`}
        </Text>
      </Box>

      {/* Content */}
      <Box flexGrow={1}>
        {children}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          [s] Scan • [m] Migrate • [h] Help • [q] Quit
        </Text>
      </Box>
    </Box>
  );
}
