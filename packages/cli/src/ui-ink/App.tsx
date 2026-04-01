import React, { useState } from 'react';
import { Box } from 'ink';
import { Layout } from './components/Layout.js';
import { ScanView } from './components/ScanView.js';
import { MigrationView } from './components/MigrationView.js';
import { HelpView } from './components/HelpView.js';

export type Route = 'scan' | 'migrate' | 'help' | 'welcome' | 'error';

export interface AppProps {
  initialRoute?: Route;
}

export function App({ initialRoute = 'scan' }: AppProps): React.ReactElement {
  const [currentRoute, setCurrentRoute] = useState<Route>(initialRoute);
  const [detectedAgents, setDetectedAgents] = useState<Array<{ tool: string; name: string; path: string }>>([]);

  const navigate = (route: Route) => {
    setCurrentRoute(route);
  };

  const handleAgentsDetected = (agents: Array<{ tool: string; name: string; path: string }>) => {
    setDetectedAgents(agents);
  };

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'scan':
        return (
          <ScanView 
            onNavigate={navigate} 
            onAgentsDetected={handleAgentsDetected}
          />
        );
      case 'migrate':
        return (
          <MigrationView
            detectedAgents={detectedAgents}
            onNavigate={navigate}
            onToolsSelected={(source, target) => {
              // Handle tool selection
            }}
            onMigrationComplete={(result) => {
              // Handle migration complete
            }}
          />
        );
      case 'help':
        return <HelpView onBack={() => navigate('scan')} />;
      default:
        return <ScanView onNavigate={navigate} onAgentsDetected={handleAgentsDetected} />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Layout currentRoute={currentRoute}>
        {renderCurrentView()}
      </Layout>
    </Box>
  );
}
