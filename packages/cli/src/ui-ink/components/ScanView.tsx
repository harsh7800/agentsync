import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { AIDirectoryScanner } from '@agent-sync/core';
import type { DetectedFile } from '@agent-sync/core';
import type { Route } from '../App.js';
import { homedir } from 'os';
import { FileBrowser } from './FileBrowser.js';

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
  { id: 'current', label: '📁', desc: 'Current Directory' },
  { id: 'system', label: '🏠', desc: 'Home Directory' },
  { id: 'custom', label: '📂', desc: 'Custom Path' },
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
  const [expandedAgents, setExpandedAgents] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);

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

    // File browser handles its own input via its own useInput hook
    if (phase === 'file-browser') {
      return;
    }

    if (phase === 'results') {
      const hasAgents = scanResult && scanResult.agents.length > 0;
      const availableActions = hasAgents 
        ? [
            { id: 'migrate', label: 'Migrate', key: 'm', color: 'green' },
            { id: 'scan', label: 'Scan', key: 's', color: 'blue' },
            { id: 'quit', label: 'Quit', key: 'q', color: 'gray' },
          ]
        : [
            { id: 'scan', label: 'Scan', key: 's', color: 'blue' },
            { id: 'quit', label: 'Quit', key: 'q', color: 'gray' },
          ];

      if (key.leftArrow) {
        setSelectedAction(prev => {
          const newIndex = Math.max(0, prev - 1);
          return newIndex;
        });
      } else if (key.rightArrow) {
        setSelectedAction(prev => {
          const newIndex = Math.min(availableActions.length - 1, prev + 1);
          return newIndex;
        });
      } else if (key.return) {
        const action = availableActions[selectedAction];
        if (action.id === 'scan') {
          setPhase('scope-selection');
          setScanResult(null);
          setSelectedAction(0);
        } else if (action.id === 'sync') {
          // Re-run scan with same scope
          if (scanResult) {
            startScan('current'); // Sync current directory by default
          }
        } else if (action.id === 'migrate' && scanResult) {
          if (onAgentsDetected) {
            onAgentsDetected(scanResult.agents);
          }
          onNavigate('migrate');
          return;
        } else if (action.id === 'quit') {
          exit();
        }
      } else if (input === 's') {
        setPhase('scope-selection');
        setScanResult(null);
        setSelectedAction(0);
      } else if (input === 'y') {
        // Sync shortcut
        if (scanResult) {
          startScan('current');
        }
      } else if (input === 'm' && hasAgents) {
        if (onAgentsDetected) {
          onAgentsDetected(scanResult.agents);
        }
        onNavigate('migrate');
        return;
      } else if (input === 'q') {
        exit();
      } else if (input === 'a') {
        setExpandedAgents(prev => !prev);
      } else if (input === 'k') {
        setExpandedSkills(prev => !prev);
      }
    }
  });

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

  // Scope Selection
  if (phase === 'scope-selection') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">Select scan location</Text>
        </Box>
        
        <Box flexDirection="column">
          {SCOPES.map((scope, index) => {
            const isSelected = selectedScopeIndex === index;
            return (
              <Box 
                key={scope.id} 
                marginY={1}
                borderStyle={isSelected ? "round" : "single"}
                borderColor={isSelected ? "cyan" : "gray"}
                paddingX={2}
                paddingY={1}
              >
                <Text color={isSelected ? 'cyan' : 'white'}>
                  {isSelected ? '▸ ' : '  '}
                  <Text bold={isSelected}>{scope.label}</Text>
                  <Text>  {scope.desc}</Text>
                </Text>
              </Box>
            );
          })}
        </Box>

        <Box marginTop={2}>
          <Text color="gray">↑↓ Select  •  Enter Confirm  •  q Quit</Text>
        </Box>
      </Box>
    );
  }

  // File Browser
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

  // Scanning
  if (phase === 'scanning') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">Scanning...</Text>
        </Box>
        
        <Box marginY={1}>
          <Text color="gray">{statusMessage}</Text>
        </Box>
        
        <Box width={40} marginY={1}>
          <Text color="cyan">
            {'█'.repeat(Math.floor(progress / 2.5))}
            {'░'.repeat(40 - Math.floor(progress / 2.5))}
          </Text>
        </Box>

        <Box>
          <Text color="gray">{progress}%</Text>
        </Box>
      </Box>
    );
  }

  // Group items by tool
  const groupByTool = <T extends { tool: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
      const tool = item.tool || 'unknown';
      if (!acc[tool]) acc[tool] = [];
      acc[tool].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  // Results
  if (phase === 'results' && scanResult) {
    const { tools, agents, skills, mcps, duration } = scanResult;
    const hasAgents = agents.length > 0;
    
    // Group by tool
    const agentsByTool = groupByTool(agents);
    const skillsByTool = groupByTool(skills);
    
    const actions = hasAgents 
      ? [
          { id: 'migrate', label: 'Migrate', key: 'm', color: 'green' },
          { id: 'sync', label: 'Sync', key: 'y', color: 'yellow' },
          { id: 'scan', label: 'New Scan', key: 's', color: 'blue' },
          { id: 'quit', label: 'Quit', key: 'q', color: 'gray' },
        ]
      : [
          { id: 'sync', label: 'Sync', key: 'y', color: 'yellow' },
          { id: 'scan', label: 'New Scan', key: 's', color: 'blue' },
          { id: 'quit', label: 'Quit', key: 'q', color: 'gray' },
        ];

    return (
      <Box flexDirection="column" padding={1}>
        {/* Header */}
        <Box marginBottom={1} borderStyle="single" paddingX={1}>
          <Text bold color="green">✓ Scan Complete</Text>
          <Text color="gray">  ({(duration / 1000).toFixed(2)}s)</Text>
          <Text>  |  </Text>
          <Text bold color="white">{agents.length}</Text>
          <Text color="gray"> Agents  </Text>
          <Text bold color="white">{skills.length}</Text>
          <Text color="gray"> Skills  </Text>
          <Text bold color="white">{mcps.length}</Text>
          <Text color="gray"> MCPs</Text>
        </Box>

        {/* Tools Summary Table */}
        {tools.length > 0 && (
          <Box marginBottom={1} flexDirection="column">
            <Text bold color="cyan" underline>Detected Tools</Text>
            <Box marginLeft={1}>
              {tools.map(tool => {
                const toolAgents = agentsByTool[tool]?.length || 0;
                const toolSkills = skillsByTool[tool]?.length || 0;
                return (
                  <Box key={tool} marginY={0}>
                    <Text>
                      {TOOL_ICONS[tool] || '⚪'} <Text bold>{tool.padEnd(12)}</Text>
                      <Text color="gray">Agents: </Text>
                      <Text bold color="white">{toolAgents.toString().padStart(2)}</Text>
                      <Text color="gray">  Skills: </Text>
                      <Text bold color="white">{toolSkills.toString().padStart(2)}</Text>
                    </Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Agents by Tool */}
        {agents.length > 0 && (
          <Box marginY={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="cyan" underline>
                Agents by Provider {expandedAgents ? '▼' : '▶'}
              </Text>
              <Text color="gray">  Press 'a' to {expandedAgents ? 'collapse' : 'expand'}</Text>
            </Box>
            
            {expandedAgents ? (
              // Expanded view - show all grouped by tool
              Object.entries(agentsByTool).map(([tool, toolAgents]) => (
                <Box key={tool} marginLeft={1} marginY={1} flexDirection="column">
                  <Text bold>
                    {TOOL_ICONS[tool] || '⚪'} {tool} ({toolAgents.length})
                  </Text>
                  {toolAgents.map((agent, idx) => (
                    <Box key={idx} marginLeft={3}>
                      <Text color="gray">├─</Text>
                      <Text> {agent.name}</Text>
                      <Text color="gray">  ({agent.path.substring(0, 40)}...)</Text>
                    </Box>
                  ))}
                </Box>
              ))
            ) : (
              // Collapsed view - summary
              <Box marginLeft={1}>
                {Object.entries(agentsByTool).map(([tool, toolAgents]) => (
                  <Box key={tool} marginY={0}>
                    <Text>
                      {TOOL_ICONS[tool] || '⚪'} <Text bold>{tool}</Text>
                      <Text color="gray">: </Text>
                      <Text>{toolAgents.length} agent{toolAgents.length > 1 ? 's' : ''}</Text>
                      <Text color="gray">  ({toolAgents.slice(0, 2).map(a => a.name).join(', ')}{toolAgents.length > 2 ? '...' : ''})</Text>
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Skills by Tool */}
        {skills.length > 0 && (
          <Box marginY={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="cyan" underline>
                Skills by Provider {expandedSkills ? '▼' : '▶'}
              </Text>
              <Text color="gray">  Press 'k' to {expandedSkills ? 'collapse' : 'expand'}</Text>
            </Box>
            
            {expandedSkills ? (
              // Expanded view - show all grouped by tool
              Object.entries(skillsByTool).map(([tool, toolSkills]) => (
                <Box key={tool} marginLeft={1} marginY={1} flexDirection="column">
                  <Text bold>
                    {TOOL_ICONS[tool] || '⚪'} {tool} ({toolSkills.length})
                  </Text>
                  <Box marginLeft={3} flexDirection="row" flexWrap="wrap">
                    {toolSkills.map((skill, idx) => (
                      <Box key={idx} marginRight={2}>
                        <Text color="gray">{idx === 0 ? '└─ ' : '   '}</Text>
                        <Text>{skill.name}</Text>
                        {idx < toolSkills.length - 1 && <Text color="gray">,</Text>}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))
            ) : (
              // Collapsed view - summary
              <Box marginLeft={1}>
                {Object.entries(skillsByTool).map(([tool, toolSkills]) => (
                  <Box key={tool} marginY={0}>
                    <Text>
                      {TOOL_ICONS[tool] || '⚪'} <Text bold>{tool}</Text>
                      <Text color="gray">: </Text>
                      <Text>{toolSkills.length} skill{toolSkills.length > 1 ? 's' : ''}</Text>
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Empty state */}
        {agents.length === 0 && skills.length === 0 && mcps.length === 0 && (
          <Box marginY={1} borderStyle="single" borderColor="yellow" paddingX={2} paddingY={1}>
            <Text color="yellow">⚠ No AI tool configurations found</Text>
            <Text color="gray">Try scanning a different directory</Text>
          </Box>
        )}

        {/* Actions */}
        <Box marginTop={2} flexDirection="column">
          <Text bold color="white">Actions:</Text>
          <Box flexDirection="row" marginTop={1} flexWrap="wrap">
            {actions.map((action, index) => {
              const isSelected = selectedAction === index;
              const color = action.color as 'green' | 'yellow' | 'blue' | 'gray';
              return (
                <Box 
                  key={action.id}
                  marginRight={2}
                  marginBottom={1}
                  borderStyle={isSelected ? "round" : "single"}
                  borderColor={isSelected ? color : "gray"}
                  paddingX={2}
                  paddingY={0}
                >
                  <Text color={isSelected ? color : 'white'}>
                    {isSelected ? '▸ ' : '  '}
                    <Text bold={isSelected}>[{action.key}] {action.label}</Text>
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">←→ Navigate  •  Enter Select  •  y Sync  •  a/k Toggle  •  q Quit</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="gray">Loading...</Text>
    </Box>
  );
}
