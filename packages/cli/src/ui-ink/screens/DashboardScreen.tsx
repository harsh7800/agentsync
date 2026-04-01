import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Layout, PageTitle, Section, StatusBar } from '../components/Layout.js';
import { ActionsList } from '../components/UIComponents.js';
import type { Route } from '../App.js';

interface DashboardScreenProps {
  onNavigate: (route: Route) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps): React.ReactElement {
  const { exit } = useApp();
  const [selectedAction, setSelectedAction] = useState(0);

  const actions = [
    { id: 'scan', label: 'Scan for AI Tools', shortcut: 's', color: 'green' as const },
    { id: 'migrate', label: 'Migrate Configuration', shortcut: 'm', color: 'blue' as const },
    { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
    { id: 'help', label: 'Help', shortcut: 'h', color: 'gray' as const },
    { id: 'quit', label: 'Quit', shortcut: 'q', color: 'red' as const },
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedAction(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedAction(prev => Math.min(actions.length - 1, prev + 1));
    } else if (key.return) {
      const action = actions[selectedAction];
      handleAction(action.id);
    } else {
      // Shortcut keys
      const action = actions.find(a => a.shortcut === input);
      if (action) {
        handleAction(action.id);
      }
    }
  });

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'scan':
        onNavigate('scan');
        break;
      case 'migrate':
        onNavigate('migrate');
        break;
      case 'sync':
        // Handle sync
        break;
      case 'help':
        onNavigate('help');
        break;
      case 'quit':
        exit();
        break;
    }
  };

  return (
    <Layout
      breadcrumb="AgentSync"
      actions={
        <ActionsList 
          actions={actions} 
          selectedIndex={selectedAction}
          title="Select Action"
        />
      }
      statusBar={
        <StatusBar 
          shortcuts={['↑↓ Navigate', 'Enter Select', 'q Quit']}
        />
      }
    >
      <PageTitle title="Dashboard" />
      
      <Section title="Welcome to AgentSync">
        <Text color="gray">
          Migrate AI agent configurations between development tools.
        </Text>
        <Text color="gray">
          Supports: Claude Code, OpenCode, Gemini CLI, Cursor, GitHub Copilot
        </Text>
      </Section>

      <Section title="Quick Stats">
        <Text color="gray">Last Scan: Never</Text>
        <Text color="gray">Tools Detected: 0</Text>
      </Section>
    </Layout>
  );
}
