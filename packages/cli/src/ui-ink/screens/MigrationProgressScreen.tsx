import React from 'react';
import { Box, Text } from 'ink';
import { Layout, Section, StatusBar } from '../components/Layout.js';
import { 
  ProgressBar, 
  WizardSteps,
  LogsPanel 
} from '../components/UIComponents.js';

interface MigrationProgressScreenProps {
  sourceTool: string;
  targetTool: string;
  progress: number;
  currentAgent?: string;
  logs: string[];
}

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

export function MigrationProgressScreen({
  sourceTool,
  targetTool,
  progress,
  currentAgent,
  logs,
}: MigrationProgressScreenProps): React.ReactElement {
  return (
    <Layout
      breadcrumb="AgentSync → Migrate → Progress"
      statusBar={
        <StatusBar 
          info="Migration in progress..."
        />
      }
    >
      <WizardSteps
        currentStep={5}
        totalSteps={6}
        title="Migration Progress"
        subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${sourceTool} → ${TOOL_ICONS[targetTool]} ${targetTool}`}
      />

      {/* Progress Section */}
      <Section title="Progress">
        <ProgressBar 
          progress={progress} 
          width={50}
          label="Migrating agents..."
        />
      </Section>

      {/* Current Agent */}
      {currentAgent && (
        <Section title="Current Agent">
          <Text color="cyan">{currentAgent}</Text>
        </Section>
      )}

      {/* Logs */}
      <Section title="Activity Log">
        <LogsPanel logs={logs} maxLines={8} />
      </Section>

      {/* Please Wait */}
      <Box marginTop={1}>
        <Text color="yellow">⏳ Please wait, this may take a moment...</Text>
      </Box>
    </Layout>
  );
}
