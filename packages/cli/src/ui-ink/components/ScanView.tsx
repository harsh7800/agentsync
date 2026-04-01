/**
 * Interactive Scan View Component
 * 
 * Features:
 * - Visible focus indicators with arrows
 * - Selection highlighting with background colors
 * - Visual feedback on navigation
 * - Border containers for visual hierarchy
 * - Keyboard-driven navigation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Route } from '../App.js';

interface ScanViewProps {
  scannedTools?: string[];
  detectedAgents?: Array<{
    tool: string;
    name: string;
    path: string;
  }>;
  onToolsFound?: (tools: string[]) => void;
  onAgentsFound?: (agents: Array<{ tool: string; name: string; path: string }>) => void;
  onNavigate: (route: Route) => void;
}

type ScanScope = 'current' | 'system' | 'custom';
type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';
type FocusArea = 'scope' | 'tools' | 'actions' | 'results';

const SUPPORTED_TOOLS = [
  { id: 'claude', name: 'Claude Code', icon: '🟠', color: '#D97706' },
  { id: 'opencode', name: 'OpenCode', icon: '🔵', color: '#3B82F6' },
  { id: 'gemini', name: 'Gemini CLI', icon: '🟣', color: '#8B5CF6' },
  { id: 'cursor', name: 'Cursor', icon: '🟢', color: '#10B981' },
];

const TOOL_ICONS: Record<string, string> = {
  claude: '🟠',
  opencode: '🔵',
  gemini: '🟣',
  cursor: '🟢',
};

const SCOPES: { id: ScanScope; label: string; icon: string; desc: string }[] = [
  { id: 'current', label: 'Current Directory', icon: '📁', desc: 'Scan current project' },
  { id: 'system', label: 'System-wide', icon: '🌐', desc: 'Scan entire system' },
  { id: 'custom', label: 'Custom Path', icon: '📂', desc: 'Specify location' },
];

export function ScanView({
  scannedTools = [],
  detectedAgents = [],
  onToolsFound,
  onAgentsFound,
  onNavigate,
}: ScanViewProps): React.ReactElement {
  const [scope, setScope] = useState<ScanScope>('current');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [focusArea, setFocusArea] = useState<FocusArea>('scope');
  const [selectedScopeIndex, setSelectedScopeIndex] = useState(0);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Handle keyboard input
  useInput((input, key) => {
    if (status === 'scanning') return; // Disable input during scan

    // Global shortcuts
    if (input === 'q') {
      // Let parent handle quit
      return;
    }

    if (input === 'm' && status === 'complete') {
      onNavigate('migrate');
      return;
    }

    if (input === 's' && status === 'complete') {
      // Reset and scan again
      setStatus('idle');
      setProgress(0);
      return;
    }

    // Arrow key navigation
    if (key.upArrow) {
      handleUp();
    } else if (key.downArrow) {
      handleDown();
    } else if (key.leftArrow) {
      handleLeft();
    } else if (key.rightArrow) {
      handleRight();
    } else if (key.return) {
      handleSelect();
    }
  });

  const handleUp = () => {
    switch (focusArea) {
      case 'scope':
        setSelectedScopeIndex(prev => Math.max(0, prev - 1));
        break;
      case 'results':
        setSelectedResultIndex(prev => Math.max(0, prev - 1));
        break;
    }
  };

  const handleDown = () => {
    switch (focusArea) {
      case 'scope':
        setSelectedScopeIndex(prev => Math.min(SCOPES.length - 1, prev + 1));
        break;
      case 'tools':
        // Tools are just display, move to actions
        setFocusArea('actions');
        break;
      case 'results':
        setSelectedResultIndex(prev => Math.min(detectedAgents.length - 1, prev + 1));
        break;
    }
  };

  const handleLeft = () => {
    if (focusArea === 'actions') {
      setFocusArea('tools');
    } else if (focusArea === 'tools') {
      setFocusArea('scope');
    }
  };

  const handleRight = () => {
    if (focusArea === 'scope') {
      setFocusArea('tools');
    } else if (focusArea === 'tools') {
      setFocusArea('actions');
    }
  };

  const handleSelect = () => {
    switch (focusArea) {
      case 'scope':
        setScope(SCOPES[selectedScopeIndex].id);
        setFocusArea('actions');
        break;
      case 'actions':
        if (status === 'idle') {
          handleScan();
        } else if (status === 'complete') {
          onNavigate('migrate');
        }
        break;
      case 'results':
        // Select an agent
        break;
    }
  };

  const handleScan = useCallback(async () => {
    setStatus('scanning');
    setProgress(0);
    setFocusArea('actions');

    // Simulate scanning progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Simulate found tools and agents
    const mockTools = ['claude', 'opencode'];
    const mockAgents = [
      { tool: 'claude', name: 'My Claude Agent', path: '~/.claude/agents/agent.json' },
      { tool: 'opencode', name: 'Code Helper', path: './.opencode/agents/code-helper.md' },
      { tool: 'opencode', name: 'Documentation Writer', path: './.opencode/agents/docs-writer.md' },
    ];

    onToolsFound?.(mockTools);
    onAgentsFound?.(mockAgents);
    setStatus('complete');
    setFocusArea('results');
  }, [onToolsFound, onAgentsFound]);

  // Update scope when selection changes
  useEffect(() => {
    setScope(SCOPES[selectedScopeIndex].id);
  }, [selectedScopeIndex]);

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      {/* Header with border */}
      <Box 
        borderStyle="round" 
        borderColor="blue"
        paddingX={2}
        marginBottom={2}
      >
        <Text bold color="blue">
          🔍 Scan for AI Agents
        </Text>
      </Box>

      {/* Scope Selection - Card Style */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold underline color="white">
            Select Scan Scope:
          </Text>
          {focusArea === 'scope' && (
            <Text color="yellow"> ← [Use ↑↓ arrows]</Text>
          )}
        </Box>

        <Box flexDirection="column">
          {SCOPES.map((s, index) => {
            const isSelected = selectedScopeIndex === index;
            const isActive = scope === s.id;
            
            return (
              <Box key={s.id} marginBottom={1}>
                <Box
                  borderStyle={isSelected ? "single" : undefined}
                  borderColor={isSelected ? "green" : undefined}
                  paddingX={1}
                >
                  <Text color={isSelected ? "green" : isActive ? "white" : "gray"}>
                    {isSelected ? '▶ ' : '  '}
                    <Text bold={isSelected || isActive}>
                      {s.icon} {s.label}
                    </Text>
                  </Text>
                </Box>
                <Box marginLeft={3}>
                  <Text color="gray" dimColor>
                    {s.desc}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Supported Tools - Grid Style */}
      <Box 
        flexDirection="column" 
        marginBottom={2}
        borderStyle={focusArea === 'tools' ? "single" : undefined}
        borderColor={focusArea === 'tools' ? "yellow" : undefined}
        padding={focusArea === 'tools' ? 1 : 0}
      >
        <Box marginBottom={1}>
          <Text bold color="white">
            Scanning For:
          </Text>
          {focusArea === 'tools' && (
            <Text color="yellow"> ← [Focused]</Text>
          )}
        </Box>

        <Box flexDirection="row" flexWrap="wrap">
          {SUPPORTED_TOOLS.map((tool, index) => (
            <Box 
              key={tool.id} 
              marginRight={2} 
              marginBottom={1}
              borderStyle={focusArea === 'tools' && selectedToolIndex === index ? "single" : undefined}
              borderColor="cyan"
              paddingX={1}
            >
              <Text color="white">
                {tool.icon} {tool.name}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Action Area - Big Button Style */}
      <Box 
        flexDirection="column" 
        marginBottom={2}
        borderStyle={focusArea === 'actions' ? "double" : "single"}
        borderColor={focusArea === 'actions' ? "green" : "gray"}
        padding={1}
      >
        {status === 'idle' && (
          <>
            <Box justifyContent="center">
              <Text 
                bold 
                color={focusArea === 'actions' ? "green" : "white"}
                backgroundColor={focusArea === 'actions' ? "green" : undefined}
              >
                {focusArea === 'actions' ? '▶ START SCAN' : '  START SCAN'}
              </Text>
            </Box>
            <Box justifyContent="center" marginTop={1}>
              <Text color="gray" dimColor>
                Press Enter to begin
              </Text>
            </Box>
          </>
        )}

        {status === 'scanning' && (
          <Box flexDirection="column">
            <Box justifyContent="center" marginBottom={1}>
              <Text bold color="yellow">
                ⠋ Scanning... {progress}%
              </Text>
            </Box>
            <Box width={50} justifyContent="center">
              <Text color="blue">
                {'█'.repeat(Math.floor(progress / 2))}
                {'░'.repeat(50 - Math.floor(progress / 2))}
              </Text>
            </Box>
            <Box justifyContent="center" marginTop={1}>
              <Text color="gray" dimColor>
                Searching {SCOPES.find(s => s.id === scope)?.label}...
              </Text>
            </Box>
          </Box>
        )}

        {status === 'complete' && (
          <>
            <Box justifyContent="center">
              <Text bold color="green">
                ✓ SCAN COMPLETE
              </Text>
            </Box>
            <Box justifyContent="center" marginTop={1}>
              <Text color="white">
                Found <Text bold color="green">{detectedAgents.length}</Text> agents
              </Text>
            </Box>
          </>
        )}
      </Box>

      {/* Results Area */}
      {detectedAgents.length > 0 && (
        <Box 
          flexDirection="column" 
          marginTop={1}
          borderStyle={focusArea === 'results' ? "single" : undefined}
          borderColor="cyan"
          padding={focusArea === 'results' ? 1 : 0}
        >
          <Box marginBottom={1}>
            <Text bold underline color="white">
              Detected Agents:
            </Text>
            {focusArea === 'results' && (
              <Text color="yellow"> ← [Use ↑↓ to navigate]</Text>
            )}
          </Box>

          {detectedAgents.map((agent, index) => {
            const isSelected = selectedResultIndex === index;
            return (
              <Box 
                key={index} 
                marginBottom={1}
                borderStyle={isSelected ? "single" : undefined}
                borderColor={isSelected ? "cyan" : undefined}
                paddingX={1}
              >
                <Text color={isSelected ? "black" : "white"}>
                  {isSelected ? '▶ ' : '  '}
                  {TOOL_ICONS[agent.tool] || '⚪'} <Text bold>{agent.name}</Text>
                </Text>
                <Text color={isSelected ? "black" : "gray"}>
                  {'  '}({agent.tool})
                </Text>
              </Box>
            );
          })}

          {/* Next Actions */}
          <Box marginTop={2} flexDirection="row" justifyContent="center">
            <Box 
              borderStyle="single" 
              borderColor="green"
              paddingX={2}
              marginRight={2}
            >
              <Text bold color="green">
                [m] Migrate Agents
              </Text>
            </Box>
            <Box 
              borderStyle="single" 
              borderColor="blue"
              paddingX={2}
            >
              <Text color="blue">
                [s] Scan Again
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Footer Help */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray" dimColor>
          Navigation: ↑↓←→ | Select: Enter | Quit: q | 
          {status === 'complete' ? 'Migrate: m | Rescan: s' : ''}
        </Text>
      </Box>
    </Box>
  );
}
