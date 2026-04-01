import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Layout, Section, StatusBar } from '../components/Layout.js';
import { 
  ActionsList, 
  WizardSteps,
  SummaryTable,
  List 
} from '../components/UIComponents.js';

interface ConfirmMigrationScreenProps {
  sourceTool: string;
  targetTool: string;
  outputPath: string;
  agents: Array<{ name: string; tool: string; path: string }>;
  skills: Array<{ name: string; tool: string; path: string }>;
  mcps: Array<{ name: string; tool: string; path: string }>;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

export function ConfirmMigrationScreen({
  sourceTool,
  targetTool,
  outputPath,
  agents,
  skills,
  mcps,
  onConfirm,
  onBack,
  onCancel,
}: ConfirmMigrationScreenProps): React.ReactElement {
  const [selectedAction, setSelectedAction] = useState(0);

  const actions = [
    { id: 'start', label: 'Start Migration', shortcut: 's', color: 'green' as const },
    { id: 'back', label: 'Back', shortcut: 'b', color: 'gray' as const },
    { id: 'cancel', label: 'Cancel', shortcut: 'c', color: 'red' as const },
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
      case 'start':
        onConfirm();
        break;
      case 'back':
        onBack();
        break;
      case 'cancel':
        onCancel();
        break;
    }
  };

  const agentNames = agents.map(a => a.name);

  return (
    <Layout
      breadcrumb={`AgentSync → Migrate → Confirm`}
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
        currentStep={4}
        totalSteps={6}
        title="Confirm Migration"
        subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${sourceTool} → ${TOOL_ICONS[targetTool]} ${targetTool}`}
      />

      {/* Migration Details */}
      <Section title="Migration Details">
        <SummaryTable 
          items={[
            { label: 'Source Tool', value: `${TOOL_ICONS[sourceTool]} ${sourceTool}` },
            { label: 'Target Tool', value: `${TOOL_ICONS[targetTool]} ${targetTool}` },
            { label: 'Output Path', value: outputPath },
          ]}
        />
      </Section>

      {/* Agents to Migrate */}
      {agents.length > 0 && (
        <Section title={`Agents to Migrate (${agents.length})`}>
          <List items={agentNames} />
        </Section>
      )}

      {/* Summary */}
      <Section title="Summary">
        <SummaryTable 
          items={[
            { label: 'Total Agents', value: agents.length, color: 'white' },
            { label: 'Total Skills', value: skills.length, color: 'white' },
            { label: 'MCP Servers', value: mcps.length, color: 'white' },
          ]}
        />
      </Section>

      {/* Warning */}
      <Box marginTop={1}>
        <Text color="yellow">⚠ This will create files in the output directory.</Text>
        <Text color="gray">Existing configurations will be backed up.</Text>
      </Box>
    </Layout>
  );
}
