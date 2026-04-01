/**
 * Scan View Component
 * Interface for scanning and detecting AI agents
 */

import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
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

const SUPPORTED_TOOLS = [
  { id: 'claude', name: 'Claude Code', icon: '🟠' },
  { id: 'opencode', name: 'OpenCode', icon: '🔵' },
  { id: 'gemini', name: 'Gemini CLI', icon: '🟣' },
  { id: 'cursor', name: 'Cursor', icon: '🟢' },
];

const TOOL_ICONS: Record<string, string> = {
  claude: '🟠',
  opencode: '🔵',
  gemini: '🟣',
  cursor: '🟢',
};

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
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);

  const handleScan = useCallback(async () => {
    setStatus('scanning');
    setProgress(0);

    // Simulate scanning progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Simulate found tools and agents
    const mockTools = ['claude', 'opencode'];
    const mockAgents = [
      { tool: 'claude', name: 'My Claude Agent', path: '~/.claude/agents/agent.json' },
      { tool: 'opencode', name: 'Code Helper', path: './.opencode/agents/code-helper.md' },
    ];

    onToolsFound?.(mockTools);
    onAgentsFound?.(mockAgents);
    setStatus('complete');
  }, [onToolsFound, onAgentsFound]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text bold color="blue">
          🔍 Scan for AI Agents
        </Text>
      </Box>

      {/* Scope Selection */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text color="gray">
            Select scan scope:
          </Text>
        </Box>

        <Box flexDirection="row">
          {(['current', 'system', 'custom'] as ScanScope[]).map((s) => (
            <Box key={s} marginRight={2}>
              <Text
                backgroundColor={scope === s ? 'blue' : undefined}
                color={scope === s ? 'white' : 'gray'}
              >
                {' '}{s === 'current' ? '📁 Current Directory' : s === 'system' ? '🌐 System-wide' : '📂 Custom Path'}{' '}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Supported Tools */}
      <Box flexDirection="column" marginBottom={2}>
        <Box marginBottom={1}>
          <Text color="gray">
            Scanning for:
          </Text>
        </Box>

        <Box flexDirection="row" flexWrap="wrap">
          {SUPPORTED_TOOLS.map((tool, index) => (
            <Box key={tool.id} marginRight={2} marginBottom={1}>
              <Text
                backgroundColor={selectedToolIndex === index ? 'blue' : undefined}
                color={selectedToolIndex === index ? 'white' : 'white'}
              >
                {tool.icon} {tool.name}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Scan Button or Progress */}
      <Box marginBottom={2}>
        {status === 'idle' && (
          <Text color="green">
            Press [Enter] to start scanning
          </Text>
        )}

        {status === 'scanning' && (
          <Box flexDirection="column">
            <Text color="yellow">
              Scanning... {progress}%
            </Text>
            <Box width={40} marginTop={1}>
              <Text color="blue">
                {'█'.repeat(Math.floor(progress / 5))}
                {'░'.repeat(20 - Math.floor(progress / 5))}
              </Text>
            </Box>
          </Box>
        )}

        {status === 'complete' && (
          <Text color="green">
            ✓ Scan complete! Found {detectedAgents.length} agent(s)
          </Text>
        )}
      </Box>

      {/* Results */}
      {detectedAgents.length > 0 && (
        <Box flexDirection="column" marginTop={2}>
          <Box marginBottom={1}>
            <Text bold color="white">
              Detected Agents:
            </Text>
          </Box>

          {detectedAgents.map((agent, index) => (
            <Box key={index} marginBottom={1}>
              <Text color="white">
                • {TOOL_ICONS[agent.tool] || '⚪'} <Text bold>{agent.name}</Text>
              </Text>
              <Text color="gray"> ({agent.tool})</Text>
            </Box>
          ))}

          <Box marginTop={2}>
            <Text color="blue">
              Press [m] to migrate or [s] to scan again
            </Text>
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={2}>
        <Text color="gray" dimColor>
          Use arrow keys to navigate • Enter to select • q to quit
        </Text>
      </Box>
    </Box>
  );
}
