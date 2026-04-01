import React from 'react';
import { Box, Text } from 'ink';

interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  breadcrumb?: string;
  actions?: React.ReactNode;
  statusBar?: React.ReactNode;
}

export function Layout({ 
  children, 
  header, 
  breadcrumb,
  actions, 
  statusBar 
}: LayoutProps): React.ReactElement {
  return (
    <Box 
      flexDirection="column" 
      height="100%"
      padding={1}
    >
      {/* Header */}
      {header || <DefaultHeader />}

      {/* Breadcrumb */}
      {breadcrumb && (
        <Box marginY={1}>
          <Text color="gray">{breadcrumb}</Text>
        </Box>
      )}

      {/* Separator */}
      <Box>
        <Text color="gray">{'─'.repeat(60)}</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="column" flexGrow={1} marginY={1}>
        {children}
      </Box>

      {/* Actions */}
      {actions && (
        <>
          <Box>
            <Text color="gray">{'─'.repeat(60)}</Text>
          </Box>
          <Box marginTop={1}>
            {actions}
          </Box>
        </>
      )}

      {/* Status Bar */}
      {statusBar && (
        <>
          <Box>
            <Text color="gray">{'─'.repeat(60)}</Text>
          </Box>
          <Box marginTop={1}>
            {statusBar}
          </Box>
        </>
      )}
    </Box>
  );
}

function DefaultHeader(): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">AgentSync</Text>
      <Text color="gray">AI Agent Environment Migration Tool</Text>
    </Box>
  );
}

export function PageTitle({ title }: { title: string }): React.ReactElement {
  return (
    <Box marginBottom={1}>
      <Text bold color="white">{title}</Text>
    </Box>
  );
}

export function Section({ 
  title, 
  children,
  border = false 
}: { 
  title?: string; 
  children: React.ReactNode;
  border?: boolean;
}): React.ReactElement {
  return (
    <Box 
      flexDirection="column" 
      marginY={1}
      borderStyle={border ? "single" : undefined}
      borderColor={border ? "gray" : undefined}
      paddingX={border ? 1 : 0}
    >
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
        </Box>
      )}
      {children}
    </Box>
  );
}

export function Panel({ 
  children,
  title 
}: { 
  children: React.ReactNode;
  title?: string;
}): React.ReactElement {
  return (
    <Box 
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      marginY={1}
    >
      {title && (
        <Box marginBottom={1}>
          <Text bold color="white">{title}</Text>
        </Box>
      )}
      {children}
    </Box>
  );
}

export function StatusBar({ 
  shortcuts,
  info 
}: { 
  shortcuts?: string[];
  info?: string;
}): React.ReactElement {
  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Box>
        {shortcuts && (
          <Text color="gray">
            {shortcuts.map((s, i) => (
              <Text key={i}>
                <Text color="cyan">{s}</Text>
                {i < shortcuts.length - 1 && <Text color="gray"> • </Text>}
              </Text>
            ))}
          </Text>
        )}
      </Box>
      {info && (
        <Box>
          <Text color="gray">{info}</Text>
        </Box>
      )}
    </Box>
  );
}

export function Breadcrumb({ 
  items 
}: { 
  items: string[];
}): React.ReactElement {
  return (
    <Box marginY={1}>
      <Text color="gray">
        {items.map((item, index) => (
          <Text key={index}>
            {index > 0 && <Text color="gray"> → </Text>}
            <Text color={index === items.length - 1 ? "white" : "gray"}>{item}</Text>
          </Text>
        ))}
      </Text>
    </Box>
  );
}
