/**
 * Simplified App Component
 * Clean, working implementation
 */

import React, { useState, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import { Layout } from './components/Layout.js';
import { ScanView } from './components/ScanView.js';
import { HelpView } from './components/HelpView.js';

export type Route = 'welcome' | 'scan' | 'migrate' | 'help' | 'error';

export interface AppProps {
  initialRoute?: Route;
}

export interface AppState {
  currentRoute: Route;
  scannedTools: string[];
  detectedAgents: Array<{
    tool: string;
    name: string;
    path: string;
  }>;
}

export function App({ initialRoute = 'scan' }: AppProps): React.ReactElement {
  const { exit } = useApp();
  
  const [state, setState] = useState<AppState>({
    currentRoute: initialRoute,
    scannedTools: [],
    detectedAgents: [],
  });

  const navigate = useCallback((route: Route) => {
    setState(prev => ({ ...prev, currentRoute: route }));
  }, []);

  const updateScannedTools = useCallback((tools: string[]) => {
    setState(prev => ({ ...prev, scannedTools: tools }));
  }, []);

  const updateDetectedAgents = useCallback((agents: Array<{ tool: string; name: string; path: string }>) => {
    setState(prev => ({ ...prev, detectedAgents: agents }));
  }, []);

  // Global keyboard shortcuts
  useInput((input) => {
    if (input === 'q') {
      exit();
    }
  });

  const renderCurrentView = (): React.ReactElement => {
    switch (state.currentRoute) {
      case 'scan':
        return (
          <ScanView
            scannedTools={state.scannedTools}
            detectedAgents={state.detectedAgents}
            onToolsFound={updateScannedTools}
            onAgentsFound={updateDetectedAgents}
            onNavigate={navigate}
          />
        );
      
      case 'help':
        return (
          <HelpView
            onBack={() => navigate('scan')}
          />
        );
      
      default:
        return (
          <ScanView
            onToolsFound={updateScannedTools}
            onAgentsFound={updateDetectedAgents}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Layout currentRoute={state.currentRoute}>
        {renderCurrentView()}
      </Layout>
    </Box>
  );
}
