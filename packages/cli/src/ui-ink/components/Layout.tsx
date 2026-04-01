/**
 * Layout Component
 * Main layout wrapper with sidebar navigation and content area
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { Route } from '../App.js';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: Route;
  onNavigate: (route: Route) => void;
}

interface NavItem {
  route: Route;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { route: 'scan', label: 'Scan', icon: '🔍' },
  { route: 'migrate', label: 'Migrate', icon: '⇄' },
  { route: 'help', label: 'Help', icon: '?' },
];

export function Layout({ children, currentRoute, onNavigate }: LayoutProps): React.ReactElement {
  return (
    <Box flexDirection="row" height="100%">
      {/* Sidebar */}
      <Box
        flexDirection="column"
        width={20}
        padding={1}
        borderStyle="single"
      >
        {/* Logo/Title */}
        <Box marginBottom={2}>
          <Text bold color="blue">
            AgentSync
          </Text>
        </Box>

        {/* Navigation Items */}
        <Box flexDirection="column">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <Box
                key={item.route}
                paddingX={1}
                paddingY={1}
              >
                <Text
                  color={isActive ? 'blue' : 'gray'}
                  bold={isActive}
                >
                  {item.icon} {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Spacer */}
        <Box flexGrow={1} />

        {/* Keyboard shortcuts hint */}
        <Box flexDirection="column" marginTop={2}>
          <Text color="gray" dimColor>
            Shortcuts:
          </Text>
          <Text color="gray" dimColor>
            / - Commands
          </Text>
          <Text color="gray" dimColor>
            q - Quit
          </Text>
          <Text color="gray" dimColor>
            esc - Back
          </Text>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box flexDirection="column" flexGrow={1} padding={2}>
        {children}
      </Box>
    </Box>
  );
}
