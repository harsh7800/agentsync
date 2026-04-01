/**
 * Error Boundary Component for Ink TUI
 * Catches errors and displays them without crashing
 */

import React from 'react';
import { Box, Text } from 'ink';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('TUI Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={2}>
          <Box marginBottom={1}>
            <Text bold color="red">
              ✗ Something went wrong
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text color="white">
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </Box>
          <Box>
            <Text color="gray">
              Press [r] to retry or [q] to quit
            </Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
