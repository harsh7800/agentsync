/**
 * FileBrowser Component
 * Navigate directories with arrow keys for path selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';

interface FileBrowserProps {
  /** Initial path to start from */
  initialPath?: string;
  /** Whether to select files or directories */
  selectType?: 'file' | 'directory' | 'both';
  /** Callback when path is selected */
  onSelect: (path: string) => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Filter function for items */
  filter?: (name: string, isDirectory: boolean) => boolean;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isParent: boolean;
}

export function FileBrowser({
  initialPath = homedir(),
  selectType = 'directory',
  onSelect,
  onCancel,
  filter,
}: FileBrowserProps): React.ReactElement {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load directory contents
  useEffect(() => {
    try {
      if (!existsSync(currentPath)) {
        setError(`Path does not exist: ${currentPath}`);
        setItems([]);
        return;
      }

      const stats = statSync(currentPath);
      if (!stats.isDirectory()) {
        setError(`Not a directory: ${currentPath}`);
        setItems([]);
        return;
      }

      setError(null);
      const entries = readdirSync(currentPath, { withFileTypes: true });
      
      // Build items list with parent directory
      const fileItems: FileItem[] = [
        { name: '..', path: dirname(currentPath), isDirectory: true, isParent: true },
      ];

      // Add directories first
      entries
        .filter(entry => entry.isDirectory())
        .filter(entry => !filter || filter(entry.name, true))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(entry => {
          fileItems.push({
            name: entry.name,
            path: join(currentPath, entry.name),
            isDirectory: true,
            isParent: false,
          });
        });

      // Add files if selecting files
      if (selectType === 'file' || selectType === 'both') {
        entries
          .filter(entry => entry.isFile())
          .filter(entry => !filter || filter(entry.name, false))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(entry => {
            fileItems.push({
              name: entry.name,
              path: join(currentPath, entry.name),
              isDirectory: false,
              isParent: false,
            });
          });
      }

      setItems(fileItems);
      setSelectedIndex(0);
    } catch (err) {
      setError(`Error reading directory: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setItems([]);
    }
  }, [currentPath, selectType, filter]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (key: string) => {
      switch (key) {
        case 'up':
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'down':
          setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
          break;
        case 'return':
        case 'enter':
          if (items[selectedIndex]) {
            const item = items[selectedIndex];
            if (item.isDirectory) {
              if (selectType === 'directory' || selectType === 'both') {
                // Allow selecting directories
                setCurrentPath(item.path);
              } else {
                // Just navigate into directory
                setCurrentPath(item.path);
              }
            } else {
              // Select file
              onSelect(item.path);
            }
          }
          break;
        case 'space':
          // Select current item and confirm
          if (items[selectedIndex] && (selectType === 'directory' || selectType === 'both')) {
            const item = items[selectedIndex];
            if (item.isDirectory && !item.isParent) {
              onSelect(item.path);
            }
          }
          break;
        case 'escape':
        case 'q':
          onCancel();
          break;
      }
    };

    // Note: In a real implementation, you'd use ink's useInput hook
    // This is a simplified version for the structure
    return () => {};
  }, [items, selectedIndex, selectType, onSelect, onCancel]);

  // Format path for display
  const displayPath = currentPath.replace(homedir(), '~');

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="blue">
          📂 File Browser
        </Text>
      </Box>

      {/* Current Path */}
      <Box marginBottom={1}>
        <Text color="gray">Location: </Text>
        <Text color="white" wrap="end">
          {displayPath}
        </Text>
      </Box>

      {/* Error Message */}
      {error && (
        <Box marginBottom={1}>
          <Text color="red">⚠ {error}</Text>
        </Box>
      )}

      {/* Instructions */}
      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          ↑↓ Navigate • Enter: Open/Select • Space: Select Dir • Esc: Cancel
        </Text>
      </Box>

      {/* File List */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const icon = item.isParent 
            ? '⬆' 
            : item.isDirectory 
              ? '📁' 
              : '📄';
          
          return (
            <Box key={item.path}>
              <Text
                backgroundColor={isSelected ? 'blue' : undefined}
                color={isSelected ? 'white' : item.isDirectory ? 'cyan' : 'white'}
              >
                {' '}{icon} {item.name}{item.isDirectory ? '/' : ''}{' '}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {items.length - 1} items • {selectType === 'directory' ? 'Select a directory' : 'Select a file'}
        </Text>
      </Box>
    </Box>
  );
}
