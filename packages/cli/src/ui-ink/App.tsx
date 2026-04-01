/**
 * Main App Component for Ink TUI
 * Handles routing, state management, and layout
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Layout } from './components/Layout.js';
import { ScanView } from './components/ScanView.js';
import { MigrationView } from './components/MigrationView.js';
import { HelpView } from './components/HelpView.js';
import { WelcomeView } from './components/WelcomeView.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';

export type Route = 'welcome' | 'scan' | 'migrate' | 'help' | 'error';

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
  error?: {
    message: string;
    stack?: string;
  };
}

// Error view component
interface ErrorViewProps {
  error?: AppState['error'];
  onRetry: () => void;
  onQuit: () => void;
}

function ErrorView({ error, onRetry, onQuit }: ErrorViewProps): React.ReactElement {
  useInput((input) => {
    if (input === 'r') {
      onRetry();
    } else if (input === 'q') {
      onQuit();
    }
  });

  return (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={1}>
        <Text bold color="red">
          ✗ Error Occurred
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="white">
          {error?.message || 'An unexpected error occurred'}
        </Text>
      </Box>
      {error?.stack && (
        <Box marginBottom={1}>
          <Text color="gray" dimColor>
            {error.stack}
          </Text>
        </Box>
      )}
      <Box marginTop={2}>
        <Text color="green">
          [r] Retry
        </Text>
        <Text color="gray">  </Text>
        <Text color="red">
          [q] Quit
        </Text>
      </Box>
    </Box>
  );
}

export function App({ initialRoute = 'scan', showWelcome = true, sessionData }: AppProps): React.ReactElement {
  const { exit } = useApp();
  
  const [state, setState] = useState<AppState>({
    currentRoute: showWelcome ? 'welcome' : initialRoute,
    scannedTools: sessionData?.scannedTools || [],
    detectedAgents: sessionData?.detectedAgents || [],
  });

  // Handle global keyboard shortcuts
  useInput((input, key) => {
    // Global quit handler
    if (input === 'q' || (key.ctrl && input === 'c')) {
      // Use exit() instead of process.exit() for graceful shutdown
      exit();
      return;
    }

    // Global help handler
    if (input === 'h' && state.currentRoute !== 'help') {
      navigate('help');
      return;
    }

    // Global scan handler
    if (input === 's' && state.currentRoute !== 'scan') {
      navigate('scan');
      return;
    }

    // Global migrate handler
    if (input === 'm' && state.currentRoute !== 'migrate') {
      navigate('migrate');
      return;
    }
  });

  const navigate = useCallback((route: Route) => {
    setState(prev => ({ ...prev, currentRoute: route, error: undefined }));
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

  const setError = useCallback((error: AppState['error']) => {
    setState(prev => ({ ...prev, error, currentRoute: 'error' }));
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined, currentRoute: 'scan' }));
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
      
      case 'error':
        return (
          <ErrorView
            error={state.error}
            onRetry={resetError}
            onQuit={exit}
          />
        );
      
      default:
        return <ScanView onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary onReset={resetError}>
      <Box flexDirection="column" height="100%">
        <Layout currentRoute={state.currentRoute} onNavigate={navigate}>
          {renderCurrentView()}
        </Layout>
      </Box>
    </ErrorBoundary>
  );
}
