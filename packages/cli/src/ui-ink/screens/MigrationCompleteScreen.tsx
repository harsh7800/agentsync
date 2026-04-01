import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Layout, Section, StatusBar } from '../components/Layout.js';
import { 
  ActionsList, 
  WizardSteps,
  List 
} from '../components/UIComponents.js';

interface MigrationCompleteScreenProps {
  sourceTool: string;
  targetTool: string;
  migratedCount: number;
  outputFiles: string[];
  onNewScan: () => void;
  onMigrateAgain: () => void;
  onQuit: () => void;
}

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

export function MigrationCompleteScreen({
  sourceTool,
  targetTool,
  migratedCount,
  outputFiles,
  onNewScan,
  onMigrateAgain,
  onQuit,
}: MigrationCompleteScreenProps): React.ReactElement {
  const [selectedAction, setSelectedAction] = useState(0);

  const actions = [
    { id: 'scan', label: 'Run New Scan', shortcut: 's', color: 'blue' as const },
    { id: 'migrate', label: 'Migrate Again', shortcut: 'm', color: 'green' as const },
    { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedAction(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedAction(prev => Math.min(actions.length - 1, prev + 1));
    } else if (key.return) {
      handleAction(actions[selectedAction].id);
    } else {
      const action = actions.find(a => a.shortcut === input);
      if (action) {
        handleAction(action.id);
      }
    }
  });

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'scan':
        onNewScan();
        break;
      case 'migrate':
        onMigrateAgain();
        break;
      case 'quit':
        onQuit();
        break;
    }
  };

  return (
    <Layout
      breadcrumb="AgentSync → Migrate → Complete"
      actions={
        <ActionsList 
          actions={actions} 
          selectedIndex={selectedAction}
          title="Actions"
        />
      }
      statusBar={
        <StatusBar 
          shortcuts={['↑↓ Navigate', 'Enter Select']}
        />
      }
    >
      <WizardSteps
        currentStep={6}
        totalSteps={6}
        title="Migration Complete"
        subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${sourceTool} → ${TOOL_ICONS[targetTool]} ${targetTool}`}
      />

      {/* Success Message */}
      <Section>
        <Box>
          <Text bold color="green">✓ Successfully migrated {migratedCount} agent{migratedCount > 1 ? 's' : ''}</Text>
        </Box>
      </Section>

      {/* Output Files */}
      {outputFiles.length > 0 && (
        <Section title="Output Files">
          <List items={outputFiles} bullet="•" color="cyan" />
        </Section>
      )}

      {/* Next Steps */}
      <Section title="Next Steps">
        <Text color="gray">You can now use your migrated agents in {targetTool}.</Text>
        <Text color="gray">Run a new scan to verify the migration or migrate more agents.</Text>
      </Section>
    </Layout>
  );
}
