import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';

interface FileBrowserProps {
  initialPath?: string;
  onSelect: (path: string) => void;
  onCancel: () => void;
  title?: string;
}

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSelected: boolean;
}

export function FileBrowser({ 
  initialPath = process.cwd(), 
  onSelect, 
  onCancel,
  title = 'Select Directory'
}: FileBrowserProps): React.ReactElement {
  const { exit } = useApp();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState('');

  const loadDirectory = useCallback((path: string) => {
    try {
      if (!existsSync(path)) {
        setError(`Path does not exist: ${path}`);
        return;
      }

      const items = readdirSync(path, { withFileTypes: true });
      const fileEntries: FileEntry[] = [];

      // Add ".." entry if not at root
      if (path !== homedir() && path !== '/') {
        fileEntries.push({
          name: '..',
          path: dirname(path),
          isDirectory: true,
          isSelected: false
        });
      }

      // Sort directories first, then files
      const dirs = items
        .filter(item => item.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const files = items
        .filter(item => !item.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));

      // Add directories
      dirs.forEach(dir => {
        fileEntries.push({
          name: dir.name + '/',
          path: join(path, dir.name),
          isDirectory: true,
          isSelected: false
        });
      });

      // Add files (optional - for visibility)
      files.forEach(file => {
        fileEntries.push({
          name: file.name,
          path: join(path, file.name),
          isDirectory: false,
          isSelected: false
        });
      });

      setEntries(fileEntries);
      setSelectedIndex(0);
      setError('');
    } catch (err) {
      setError(`Cannot read directory: ${err instanceof Error ? err.message : String(err)}`);
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(entries.length - 1, prev + 1));
    } else if (key.return) {
      const selected = entries[selectedIndex];
      if (selected) {
        if (selected.isDirectory) {
          setCurrentPath(selected.path);
        } else {
          // Selected a file, use its directory
          onSelect(dirname(selected.path));
        }
      }
    } else if (key.tab) {
      // Select current directory
      onSelect(currentPath);
    } else if (key.escape || input === 'q') {
      onCancel();
    } else if (input === 'h') {
      // Go to home
      setCurrentPath(homedir());
    } else if (input === 'r') {
      // Go to root
      setCurrentPath(process.platform === 'win32' ? 'C:\\' : '/');
    } else if (input === 'c') {
      // Go to current working directory
      setCurrentPath(process.cwd());
    }
  });

  const visibleEntries = entries.slice(0, 15); // Show max 15 items
  const hasMore = entries.length > 15;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="cyan">{title}</Text>
      </Box>

      {/* Current Path */}
      <Box 
        borderStyle="single" 
        borderColor="gray" 
        paddingX={1}
        marginBottom={1}
      >
        <Text color="gray">Path: </Text>
        <Text color="white">{currentPath}</Text>
      </Box>

      {/* Error */}
      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {/* File List */}
      <Box flexDirection="column" marginY={1}>
        {visibleEntries.map((entry, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={entry.path}>
              <Text color={isSelected ? 'cyan' : 'white'}>
                {isSelected ? '▸ ' : '  '}
                <Text bold={isSelected}>
                  {entry.isDirectory ? '📁 ' : '📄 '}
                  {entry.name}
                </Text>
              </Text>
            </Box>
          );
        })}
        
        {hasMore && (
          <Box marginLeft={2}>
            <Text color="gray">... and {entries.length - 15} more items</Text>
          </Box>
        )}

        {entries.length === 0 && !error && (
          <Box>
            <Text color="gray">(empty directory)</Text>
          </Box>
        )}
      </Box>

      {/* Shortcuts */}
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Shortcuts:</Text>
        <Box marginLeft={2}>
          <Text color="gray">h - Home  •  r - Root  •  c - Current Dir</Text>
        </Box>
      </Box>

      {/* Instructions */}
      <Box marginTop={1}>
        <Text color="gray">
          ↑↓ Navigate  •  Enter Open/Select  •  Tab Select Current  •  Esc Cancel
        </Text>
      </Box>
    </Box>
  );
}
