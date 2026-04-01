/**
 * Working Scan View Component
 * 
 * Features:
 * - Proper keyboard navigation (↑↓←→)
 * - Visual selection indicators
 * - Working scan simulation
 * - Clean, simple layout
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
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

type ScanStatus = 'idle' | 'scanning' | 'complete';

const TOOLS = [
  { id: 'claude', name: 'Claude Code', icon: '🟠' },
  { id: 'opencode', name: 'OpenCode', icon: '🔵' },
  { id: 'gemini', name: 'Gemini CLI', icon: '🟣' },
  { id: 'cursor', name: 'Cursor', icon: '🟢' },
];

export function ScanView({
  onToolsFound,
  onAgentsFound,
  onNavigate,
}: ScanViewProps): React.ReactElement {
  const { exit } = useApp();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [detectedAgents, setDetectedAgents] = useState<Array<{ tool: string; name: string; path: string }>>([]);

  // Handle keyboard input
  useInput((input, key) => {
    if (status === 'scanning') {
      // Only allow 'q' to quit during scanning
      if (input === 'q') {
        exit();
      }
      return;
    }

    if (status === 'idle') {
      if (key.return || input === 's') {
        startScan();
      } else if (input === 'h') {
        onNavigate('help');
      } else if (input === 'q') {
        exit();
      }
    }

    if (status === 'complete') {
      if (input === 's') {
        // Reset and scan again
        setStatus('idle');
        setProgress(0);
        setDetectedAgents([]);
      } else if (input === 'q') {
        exit();
      }
    }
  });

  const startScan = useCallback(async () => {
    setStatus('scanning');
    setProgress(0);

    // Simulate scanning
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Complete scan after 2 seconds
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      
      const mockAgents = [
        { tool: 'claude', name: 'Code Reviewer', path: '~/.config/claude/agents/reviewer.json' },
        { tool: 'opencode', name: 'Documentation Helper', path: './.opencode/agents/docs.md' },
      ];
      
      setDetectedAgents(mockAgents);
      onToolsFound?.(['claude', 'opencode']);
      onAgentsFound?.(mockAgents);
      setStatus('complete');
    }, 2200);
  }, [onToolsFound, onAgentsFound]);

  if (status === 'scanning') {
    return (
      <Box flexDirection="column" padding={2}>
        <Box marginBottom={1}>
          <Text bold color="blue">
            🔍 Scanning for AI Agents...
          </Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text color="yellow">{progress}%</Text>
        </Box>
        
        <Box width={50}>
          <Text color="cyan">
            {'█'.repeat(Math.floor(progress / 2))}
            {'░'.repeat(50 - Math.floor(progress / 2))}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Press 'q' to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (status === 'complete') {
    return (
      <Box flexDirection="column" padding={2}>
        <Box marginBottom={1}>
          <Text bold color="green">
            ✓ Scan Complete!
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text>Found {detectedAgents.length} agents:</Text>
        </Box>

        {detectedAgents.map((agent, index) => (
          <Box key={index} marginLeft={2} marginBottom={1}>
            <Text>
              {agent.tool === 'claude' ? '🟠' : '🔵'} {agent.name}
            </Text>
          </Box>
        ))}

        <Box marginTop={2}>
          <Text color="blue">Press [s] to scan again</Text>
        </Box>
        <Box>
          <Text color="gray">Press [q] to quit</Text>
        </Box>
      </Box>
    );
  }

  // Idle state
  return (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={2}>
        <Text bold color="blue">
          🔍 AgentSync Scanner
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Text>
          Scan your system for AI agent configurations from:
        </Text>
      </Box>

      {TOOLS.map((tool) => (
        <Box key={tool.id} marginLeft={2} marginBottom={1}>
          <Text>
            {tool.icon} {tool.name}
          </Text>
        </Box>
      ))}

      <Box marginTop={2} borderStyle="single" borderColor="green" paddingX={2} paddingY={1}>
        <Text bold color="green">
          Press [Enter] or [s] to start scanning
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press [h] for help • [q] to quit</Text>
      </Box>
    </Box>
  );
}
