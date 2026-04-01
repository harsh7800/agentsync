/**
 * StatusBar Component
 * Bottom status bar showing current state and shortcuts
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Route } from '../App.js';

interface StatusBarProps {
  currentRoute: Route;
  scannedTools: string[];
  detectedAgents: number;
  isScanning?: boolean;
  isMigrating?: boolean;
}

export function StatusBar({
  currentRoute,
  scannedTools,
  detectedAgents,
  isScanning,
  isMigrating,
}: StatusBarProps): React.ReactElement {
  const getStatusText = (): string => {
    if (isScanning) return 'Scanning...';
    if (isMigrating) return 'Migrating...';
    if (detectedAgents > 0) return `${detectedAgents} agents detected`;
    if (scannedTools.length > 0) return `${scannedTools.length} tools scanned`;
    return 'Ready';
  };

  const getRouteText = (): string => {
    switch (currentRoute) {
      case 'welcome':
        return 'Welcome';
      case 'scan':
        return 'Scan';
      case 'migrate':
        return 'Migrate';
      case 'help':
        return 'Help';
      default:
        return '';
    }
  };

  return (
    <Box
      flexDirection="row"
      height={1}
      paddingLeft={1}
      paddingRight={1}
      borderStyle="single"
    >
      {/* Left: Current Route */}
      <Box width={15}>
        <Text color="blue" bold>
          {getRouteText()}
        </Text>
      </Box>

      {/* Center: Status */}
      <Box flexGrow={1} justifyContent="center">
        <Text color="gray" dimColor>
          {getStatusText()}
        </Text>
      </Box>

      {/* Right: Shortcuts */}
      <Box width={35} justifyContent="flex-end">
        <Text color="gray" dimColor>
          /:commands q:quit
        </Text>
      </Box>
    </Box>
  );
}
