/**
 * useKeyboard Hook
 * Handle keyboard input for Ink components
 */

import { useEffect, useCallback } from 'react';
import { useInput, useApp } from 'ink';

export type KeyHandler = (key: string, input: string) => void;

interface KeyboardConfig {
  /** Handler for arrow up */
  onUp?: () => void;
  /** Handler for arrow down */
  onDown?: () => void;
  /** Handler for arrow left */
  onLeft?: () => void;
  /** Handler for arrow right */
  onRight?: () => void;
  /** Handler for enter/return */
  onEnter?: () => void;
  /** Handler for escape */
  onEscape?: () => void;
  /** Handler for 'q' key */
  onQuit?: () => void;
  /** Handler for 'h' key (help) */
  onHelp?: () => void;
  /** Handler for 's' key (scan) */
  onScan?: () => void;
  /** Handler for 'm' key (migrate) */
  onMigrate?: () => void;
  /** Handler for '/' key (command palette) */
  onCommandPalette?: () => void;
  /** Handler for backspace */
  onBackspace?: () => void;
  /** Handler for space */
  onSpace?: () => void;
  /** Handler for tab */
  onTab?: () => void;
  /** Generic handler for any key */
  onKey?: KeyHandler;
  /** Whether to exit on Ctrl+C */
  exitOnCtrlC?: boolean;
}

export function useKeyboard(config: KeyboardConfig): void {
  const { exit } = useApp();

  useInput((input, key) => {
    // Handle special keys first
    if (key.upArrow && config.onUp) {
      config.onUp();
      return;
    }

    if (key.downArrow && config.onDown) {
      config.onDown();
      return;
    }

    if (key.leftArrow && config.onLeft) {
      config.onLeft();
      return;
    }

    if (key.rightArrow && config.onRight) {
      config.onRight();
      return;
    }

    if (key.return && config.onEnter) {
      config.onEnter();
      return;
    }

    if (key.escape && config.onEscape) {
      config.onEscape();
      return;
    }

    if (key.tab && config.onTab) {
      config.onTab();
      return;
    }

    if (key.backspace && config.onBackspace) {
      config.onBackspace();
      return;
    }

    if (key.ctrl && input === 'c' && config.exitOnCtrlC !== false) {
      exit();
      return;
    }

    // Handle character keys
    switch (input.toLowerCase()) {
      case 'q':
        if (config.onQuit) {
          config.onQuit();
          return;
        }
        break;
      case 'h':
        if (config.onHelp) {
          config.onHelp();
          return;
        }
        break;
      case 's':
        if (config.onScan) {
          config.onScan();
          return;
        }
        break;
      case 'm':
        if (config.onMigrate) {
          config.onMigrate();
          return;
        }
        break;
      case '/':
        if (config.onCommandPalette) {
          config.onCommandPalette();
          return;
        }
        break;
      case ' ':
        if (config.onSpace) {
          config.onSpace();
          return;
        }
        break;
    }

    // Call generic key handler if provided
    if (config.onKey) {
      config.onKey(input, JSON.stringify(key));
    }
  });
}

/**
 * Hook for list navigation with arrow keys
 */
export function useListNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  wrap: boolean = true
): { selectedIndex: number; setSelectedIndex: (index: number) => void } {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useEffect(() => {
    // Clamp index when item count changes
    if (selectedIndex >= itemCount && itemCount > 0) {
      setSelectedIndex(itemCount - 1);
    }
  }, [itemCount, selectedIndex]);

  const handleUp = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev > 0) return prev - 1;
      return wrap ? itemCount - 1 : 0;
    });
  }, [itemCount, wrap]);

  const handleDown = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev < itemCount - 1) return prev + 1;
      return wrap ? 0 : itemCount - 1;
    });
  }, [itemCount, wrap]);

  useKeyboard({
    onUp: handleUp,
    onDown: handleDown,
    onEnter: () => onSelect(selectedIndex),
  });

  return { selectedIndex, setSelectedIndex };
}

// Need to import React for useState
import React from 'react';
