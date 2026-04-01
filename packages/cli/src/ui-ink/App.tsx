/**
 * Main App Component for Ink TUI
 * Handles routing, state management, and layout
 */

import React, { useState, useCallback } from 'react';
import { Box } from 'ink';
import { Layout } from './components/Layout.js';
import { ScanView } from './components/ScanView.js';
import { MigrationView } from './components/MigrationView.js';
import { HelpView } from './components/HelpView.js';
import { WelcomeView } from './components/WelcomeView.js';

export type Route = 'welcome' | 'scan' | 'migrate' | 'help';

export interface AppProps {
  initialRoute?: Route;
  showWelcome?: boolean;
  sessionData?: {
    scannedTools?: string[];
    detectedAgents?: Array<{
      tool: string;
      name: string;
      path: string;
    }>;
  };
}

export interface AppState {
  currentRoute: Route;
  scannedTools: string[];
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
}

export function App({ initialRoute = 'scan', showWelcome = true, sessionData }: AppProps): React.ReactElement {
  const [state, setState] = useState<AppState>({
    currentRoute: showWelcome ? 'welcome' : initialRoute,
    scannedTools: sessionData?.scannedTools || [],
    detectedAgents: sessionData?.detectedAgents || [],
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

  const updateSelectedTools = useCallback((source?: string, target?: string) => {
    setState(prev => ({
      ...prev,
      selectedSourceTool: source ?? prev.selectedSourceTool,
      selectedTargetTool: target ?? prev.selectedTargetTool,
    }));
  }, []);

  const updateMigrationResult = useCallback((result: AppState['migrationResult']) => {
    setState(prev => ({ ...prev, migrationResult: result }));
  }, []);

  const renderCurrentView = (): React.ReactElement => {
    switch (state.currentRoute) {
      case 'welcome':
        return (
          <WelcomeView
            onStart={() => navigate('scan')}
            onHelp={() => navigate('help')}
          />
        );
      
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
      
      case 'migrate':
        return (
          <MigrationView
            detectedAgents={state.detectedAgents}
            selectedSourceTool={state.selectedSourceTool}
            selectedTargetTool={state.selectedTargetTool}
            migrationResult={state.migrationResult}
            onToolsSelected={updateSelectedTools}
            onMigrationComplete={updateMigrationResult}
            onNavigate={navigate}
          />
        );
      
      case 'help':
        return (
          <HelpView
            onBack={() => navigate(state.scannedTools.length > 0 ? 'scan' : 'welcome')}
          />
        );
      
      default:
        return <ScanView onNavigate={navigate} />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Layout currentRoute={state.currentRoute} onNavigate={navigate}>
        {renderCurrentView()}
      </Layout>
    </Box>
  );
}
