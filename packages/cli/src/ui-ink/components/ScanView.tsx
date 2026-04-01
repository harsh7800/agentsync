import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { AIDirectoryScanner } from '@agent-sync/core';
import type { DetectedFile } from '@agent-sync/core';
import type { Route } from '../App.js';
import { homedir } from 'os';
import { FileBrowser } from './FileBrowser.js';
import { Layout, Section, StatusBar } from './Layout.js';
import { 
  ActionsList, 
  SummaryTable,
  GroupedList,
  ProgressBar 
} from './UIComponents.js';

interface ScanViewProps {
  onNavigate: (route: Route) => void;
  onAgentsDetected?: (agents: Array<{ tool: string; name: string; path: string }>) => void;
}

type ScanPhase = 'scope-selection' | 'file-browser' | 'scanning' | 'results';
type ScanScope = 'current' | 'system' | 'custom';

interface ScanResult {
  tools: string[];
  agents: Array<{ name: string; tool: string; path: string }>;
  skills: Array<{ name: string; tool: string; path: string }>;
  mcps: Array<{ name: string; tool: string; path: string }>;
  paths: string[];
  duration: number;
}

const SCOPES: { id: ScanScope; label: string; desc: string }[] = [
  { id: 'current', label: '📁 Current Directory', desc: 'Scan current project' },
  { id: 'system', label: '🏠 Home Directory', desc: 'Scan global config (~/.config)' },
  { id: 'custom', label: '📂 Custom Path', desc: 'Browse and select directory' },
];

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

export function ScanView({ onNavigate, onAgentsDetected }: ScanViewProps): React.ReactElement {
  const { exit } = useApp();
  const [phase, setPhase] = useState<ScanPhase>('scope-selection');
  const [selectedScopeIndex, setSelectedScopeIndex] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Group items by tool
  const groupByTool = <T extends { tool: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
      const tool = item.tool || 'unknown';
      if (!acc[tool]) acc[tool] = [];
      acc[tool].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  useInput((input, key) => {
    if (phase === 'scanning') {
      if (input === 'q') exit();
      return;
    }

    if (phase === 'scope-selection') {
      if (key.upArrow) {
        setSelectedScopeIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedScopeIndex(prev => Math.min(SCOPES.length - 1, prev + 1));
      } else if (key.return) {
        const selected = SCOPES[selectedScopeIndex];
        if (selected.id === 'custom') {
          setPhase('file-browser');
        } else {
          startScan(selected.id);
        }
      } else if (input === 'q') {
        exit();
      }
    }

    if (phase === 'results' && scanResult) {
      const hasAgents = scanResult.agents.length > 0;
      const availableActions = hasAgents 
        ? [
            { id: 'migrate', label: 'Migrate Agents', shortcut: 'm', color: 'green' as const },
            { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
            { id: 'scan', label: 'New Scan', shortcut: 's', color: 'blue' as const },
            { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
          ]
        : [
            { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
            { id: 'scan', label: 'New Scan', shortcut: 's', color: 'blue' as const },
            { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
          ];

      if (key.upArrow) {
        setSelectedAction(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedAction(prev => Math.min(availableActions.length - 1, prev + 1));
      } else if (key.return) {
        const action = availableActions[selectedAction];
        handleResultAction(action.id);
      } else if (input === 'd') {
        setShowDetails(!showDetails);
      } else {
        const action = availableActions.find(a => a.shortcut === input);
        if (action) {
          handleResultAction(action.id);
        }
      }
    }
  });

  const handleResultAction = (actionId: string) => {
    if (!scanResult) return;
    
    switch (actionId) {
      case 'scan':
        setPhase('scope-selection');
        setScanResult(null);
        setSelectedAction(0);
        break;
      case 'sync':
        startScan('current');
        break;
      case 'migrate':
        if (onAgentsDetected) {
          onAgentsDetected(scanResult.agents);
        }
        onNavigate('migrate');
        break;
      case 'quit':
        exit();
        break;
    }
  };

  const startScan = useCallback(async (scope: ScanScope, customPathValue?: string) => {
    setPhase('scanning');
    setProgress(0);
    setStatusMessage('Initializing scanner...');

    const startTime = Date.now();
    
    try {
      const scanner = new AIDirectoryScanner({
        scope: scope === 'system' ? 'global' : scope === 'custom' ? 'project' : 'project',
        projectPath: scope === 'custom' ? customPathValue : scope === 'current' ? process.cwd() : undefined,
        globalPath: scope === 'system' ? homedir() : undefined,
      });

      setProgress(30);
      setStatusMessage('Scanning directories...');
      
      const result = await scanner.scan();

      setProgress(70);
      setStatusMessage('Processing results...');

      // Process results
      const agents: Array<{ name: string; tool: string; path: string }> = [];
      const skills: Array<{ name: string; tool: string; path: string }> = [];
      const mcps: Array<{ name: string; tool: string; path: string }> = [];
      const tools: string[] = [];
      const paths: string[] = [];

      result.files.forEach((file: DetectedFile) => {
        const directory = file.path.substring(0, file.path.lastIndexOf('/') + 1) || 
                         file.path.substring(0, file.path.lastIndexOf('\\') + 1) || '.';
        if (!paths.includes(directory)) {
          paths.push(directory);
        }

        const tool = file.tool || 'unknown';

        if (!tools.includes(tool) && tool !== 'unknown') {
          tools.push(tool);
        }

        switch (file.type) {
          case 'agent': {
            const agentMeta = file.metadata as { name?: string } | undefined;
            const name = agentMeta?.name || file.name.replace('.md', '').replace('.json', '');
            agents.push({ name, tool, path: file.path });
            break;
          }
          case 'skill': {
            const pathParts = file.path.split(/[\\/]/);
            const skillIndex = pathParts.indexOf('skills');
            const name = skillIndex >= 0 && pathParts[skillIndex + 1] 
              ? pathParts[skillIndex + 1] 
              : file.name.replace('.md', '');
            skills.push({ name, tool, path: file.path });
            break;
          }
          case 'config': {
            const configMeta = file.metadata as { mcpServers?: Array<{ name: string }> } | undefined;
            if (configMeta?.mcpServers) {
              configMeta.mcpServers.forEach(server => {
                mcps.push({ name: server.name, tool, path: file.path });
              });
            }
            break;
          }
        }
      });

      setProgress(100);
      
      const duration = Date.now() - startTime;
      
      setScanResult({
        tools,
        agents,
        skills,
        mcps,
        paths,
        duration
      });

      setTimeout(() => {
        setPhase('results');
      }, 500);

    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Scan failed'}`);
      setTimeout(() => {
        setPhase('scope-selection');
      }, 2000);
    }
  }, []);

  // Scope Selection Screen
  if (phase === 'scope-selection') {
    const scopeActions = SCOPES.map((scope, index) => ({
      id: scope.id,
      label: `${scope.label}  ${scope.desc}`,
      color: index === selectedScopeIndex ? 'cyan' : 'white' as 'cyan' | 'white',
    }));

    return (
      <Layout
        breadcrumb="AgentSync → Scan"
        actions={
          <ActionsList 
            actions={scopeActions.map((a, i) => ({ ...a, shortcut: i === 0 ? 'c' : i === 1 ? 'h' : 'u' }))}
            selectedIndex={selectedScopeIndex}
            title="Select Scan Location"
          />
        }
        statusBar={
          <StatusBar 
            shortcuts={['↑↓ Navigate', 'Enter Select', 'q Quit']}
          />
        }
      >
        <Section title="Scan Location">
          <Text color="gray">Choose where to scan for AI tool configurations:</Text>
        </Section>
      </Layout>
    );
  }

  // File Browser Screen
  if (phase === 'file-browser') {
    return (
      <FileBrowser
        initialPath={process.cwd()}
        onSelect={(path) => {
          startScan('custom', path);
        }}
        onCancel={() => {
          setPhase('scope-selection');
        }}
        title="Select directory to scan"
      />
    );
  }

  // Scanning Screen
  if (phase === 'scanning') {
    return (
      <Layout
        breadcrumb="AgentSync → Scan → In Progress"
        statusBar={
          <StatusBar 
            shortcuts={['q Cancel']}
          />
        }
      >
        <Section title="Scanning">
          <ProgressBar 
            progress={progress} 
            width={50}
            label={statusMessage}
          />
        </Section>
      </Layout>
    );
  }

  // Results Screen
  if (phase === 'results' && scanResult) {
    const { tools, agents, skills, mcps, duration } = scanResult;
    const hasAgents = agents.length > 0;
    
    const agentsByTool = groupByTool(agents);
    const skillsByTool = groupByTool(skills);
    
    const actions = hasAgents 
      ? [
          { id: 'migrate', label: 'Migrate Agents', shortcut: 'm', color: 'green' as const },
          { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
          { id: 'scan', label: 'New Scan', shortcut: 's', color: 'blue' as const },
          { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
        ]
      : [
          { id: 'sync', label: 'Sync Changes', shortcut: 'y', color: 'yellow' as const },
          { id: 'scan', label: 'New Scan', shortcut: 's', color: 'blue' as const },
          { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
        ];

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

  return (
    <Layout breadcrumb="AgentSync">
      <Text color="gray">Loading...</Text>
    </Layout>
  );
}
