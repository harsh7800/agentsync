import React from 'react';
import { Box, Text } from 'ink';

interface Action {
  id: string;
  label: string;
  shortcut?: string;
  color?: 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'white' | 'cyan';
  disabled?: boolean;
}

interface ActionsListProps {
  actions: Action[];
  selectedIndex: number;
  title?: string;
}

export function ActionsList({ 
  actions, 
  selectedIndex,
  title = "Actions"
}: ActionsListProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="white">{title}</Text>
      </Box>
      {actions.map((action, index) => {
        const isSelected = index === selectedIndex;
        const color = action.disabled ? 'gray' : (action.color || 'white');
        
        return (
          <Box key={action.id} marginY={0}>
            <Text color={isSelected ? color : 'gray'}>
              {isSelected ? '▸ ' : '  '}
              <Text bold={isSelected} color={isSelected ? color : 'white'}>
                {action.label}
              </Text>
              {action.shortcut && (
                <Text color="gray"> [{action.shortcut}]</Text>
              )}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

interface ProgressBarProps {
  progress: number;
  width?: number;
  label?: string;
}

export function ProgressBar({ 
  progress, 
  width = 40,
  label 
}: ProgressBarProps): React.ReactElement {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  
  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text color="gray">{label}</Text>
        </Box>
      )}
      <Box>
        <Text color="cyan">{'█'.repeat(filled)}</Text>
        <Text color="gray">{'░'.repeat(empty)}</Text>
        <Text color="gray">  {progress}%</Text>
      </Box>
    </Box>
  );
}

interface WizardStepsProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
}

export function WizardSteps({ 
  currentStep, 
  totalSteps, 
  title,
  subtitle 
}: WizardStepsProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="white">{title}</Text>
      </Box>
      {subtitle && (
        <Box marginTop={1}>
          <Text color="cyan">{subtitle}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="gray">Step {currentStep} of {totalSteps}</Text>
      </Box>
      <Box marginTop={1}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <Text key={i}>
            <Text color={i < currentStep ? 'green' : i === currentStep - 1 ? 'cyan' : 'gray'}>
              {i === currentStep - 1 ? '●' : i < currentStep ? '✓' : '○'}
            </Text>
            <Text color="gray"> </Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}

interface SummaryTableProps {
  items: { label: string; value: string | number; color?: string }[];
}

export function SummaryTable({ items }: SummaryTableProps): React.ReactElement {
  const maxLabelLength = Math.max(...items.map(i => i.label.length));
  
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index} marginY={0}>
          <Text color="gray">{item.label.padEnd(maxLabelLength + 2)}</Text>
          <Text bold color={item.color || 'white'}>{item.value}</Text>
        </Box>
      ))}
    </Box>
  );
}

interface ListProps {
  items: string[];
  bullet?: string;
  color?: string;
}

export function List({ items, bullet = "•", color = "white" }: ListProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index} marginY={0}>
          <Text color="gray">{bullet} </Text>
          <Text color={color}>{item}</Text>
        </Box>
      ))}
    </Box>
  );
}

interface GroupedListProps {
  groups: { title: string; items: string[] }[];
}

export function GroupedList({ groups }: GroupedListProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      {groups.map((group, groupIndex) => (
        <Box key={groupIndex} flexDirection="column" marginY={1}>
          <Box marginBottom={1}>
            <Text bold color="cyan">{group.title}</Text>
          </Box>
          <Box marginLeft={2}>
            {group.items.map((item, itemIndex) => (
              <Box key={itemIndex} marginY={0}>
                <Text color="gray">• </Text>
                <Text color="white">{item}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

interface LogsPanelProps {
  logs: string[];
  maxLines?: number;
}

export function LogsPanel({ logs, maxLines = 10 }: LogsPanelProps): React.ReactElement {
  const displayLogs = logs.slice(-maxLines);
  
  return (
    <Box 
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="gray">Logs</Text>
      </Box>
      {displayLogs.map((log, index) => (
        <Box key={index} marginY={0}>
          <Text color="gray">{log}</Text>
        </Box>
      ))}
    </Box>
  );
}
