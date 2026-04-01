import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Layout, Section, StatusBar } from '../components/Layout.js';
import { 
  ActionsList, 
  SummaryTable,
  GroupedList 
} from '../components/UIComponents.js';
import type { Route } from '../App.js';

interface ScanResult {
  tools: string[];
  agents: Array<{ name: string; tool: string; path: string }>;
  skills: Array<{ name: string; tool: string; path: string }>;
  mcps: Array<{ name: string; tool: string; path: string }>;
  duration: number;
}

interface ScanResultsScreenProps {
  scanResult: ScanResult;
  onNavigate: (route: Route) => void;
  onAgentsDetected?: (agents: Array<{ tool: string; name: string; path: string }>) => void;
}

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

export function ScanResultsScreen({ 
  scanResult, 
  onNavigate,
  onAgentsDetected 
}: ScanResultsScreenProps): React.ReactElement {
  const [selectedAction, setSelectedAction] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const { tools, agents, skills, mcps, duration } = scanResult;
  const hasAgents = agents.length > 0;

  // Group by tool
  const groupByTool = <T extends { tool: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
      const tool = item.tool || 'unknown';
      if (!acc[tool]) acc[tool] = [];
      acc[tool].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  const agentsByTool = groupByTool(agents);
  const skillsByTool = groupByTool(skills);

  const actions = [
    ...(hasAgents ? [{ id: 'migrate', label: 'Migrate Agents', shortcut: 'm', color: 'green' as const }] : []),
    { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
    { id: 'scan', label: 'New Scan', shortcut: 's', color: 'blue' as const },
    { id: 'back', label: 'Back', shortcut: 'b', color: 'gray' as const },
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedAction(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedAction(prev => Math.min(actions.length - 1, prev + 1));
    } else if (key.return) {
      handleAction(actions[selectedAction].id);
    } else if (input === 'd') {
      setShowDetails(!showDetails);
    } else {
      const action = actions.find(a => a.shortcut === input);
      if (action) {
        handleAction(action.id);
      }
    }
  });

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'migrate':
        if (onAgentsDetected) {
          onAgentsDetected(agents);
        }
        onNavigate('migrate');
        break;
      case 'sync':
        // Trigger sync
        break;
      case 'scan':
        onNavigate('scan');
        break;
      case 'back':
        onNavigate('scan');
        break;
    }
  };

  // Build provider summary
  const providerItems = tools.map(tool => {
    const toolAgents = agentsByTool[tool]?.length || 0;
    const toolSkills = skillsByTool[tool]?.length || 0;
    return {
      label: `${TOOL_ICONS[tool] || '⚪'} ${tool}`,
      value: `Agents: ${toolAgents.toString().padStart(2)}   Skills: ${toolSkills.toString().padStart(2)}`,
    };
  });

  // Build agent groups
  const agentGroups = Object.entries(agentsByTool).map(([tool, toolAgents]) => ({
    title: `${TOOL_ICONS[tool] || '⚪'} ${tool}`,
    items: toolAgents.map(a => a.name),
  }));

  return (
    <Layout
      breadcrumb="AgentSync → Scan → Results"
      actions={
        <ActionsList 
          actions={actions} 
          selectedIndex={selectedAction}
          title="Actions"
        />
      }
      statusBar={
        <StatusBar 
          shortcuts={['↑↓ Navigate', 'Enter Select', 'd Toggle Details']}
          info={`Scan Time: ${(duration / 1000).toFixed(2)}s`}
        />
      }
    >
      <Box marginBottom={1}>
        <Text bold color="green">✓ Scan Complete</Text>
      </Box>

      {/* Summary Section */}
      <Section title="Summary">
        <SummaryTable 
          items={[
            { label: 'Tools Found', value: tools.length, color: 'cyan' },
            { label: 'Agents Found', value: agents.length, color: 'white' },
            { label: 'Skills Found', value: skills.length, color: 'white' },
            { label: 'MCP Servers', value: mcps.length, color: 'white' },
          ]}
        />
      </Section>

      {/* Providers Section */}
      <Section title="Providers">
        <SummaryTable items={providerItems} />
      </Section>

      {/* Agents Section */}
      {agents.length > 0 && (
        <Section title={`Agents (${agents.length})`}>
          {showDetails ? (
            <GroupedList groups={agentGroups} />
          ) : (
            <Box>
              <Text color="gray">Press 'd' to show agent details</Text>
              {Object.entries(agentsByTool).map(([tool, toolAgents]) => (
                <Box key={tool} marginY={0}>
                  <Text>
                    {TOOL_ICONS[tool] || '⚪'} <Text bold>{tool}</Text>
                    <Text color="gray">: {toolAgents.length} agent{toolAgents.length > 1 ? 's' : ''}</Text>
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Section>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <Section title={`Skills (${skills.length})`}>
          {Object.entries(skillsByTool).map(([tool, toolSkills]) => (
            <Box key={tool} marginY={0}>
              <Text>
                {TOOL_ICONS[tool] || '⚪'} <Text bold>{tool}</Text>
                <Text color="gray">: {toolSkills.length} skill{toolSkills.length > 1 ? 's' : ''}</Text>
              </Text>
            </Box>
          ))}
        </Section>
      )}
    </Layout>
  );
}
