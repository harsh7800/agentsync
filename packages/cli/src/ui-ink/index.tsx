/**
 * Ink TUI Entry Point
 * Main entry for the React-based terminal UI
 */

import React from 'react';
import { render } from 'ink';
import { App, type Route } from './App.js';

export interface InkAppOptions {
  /** Initial route to render */
  initialRoute?: Route;
}

/**
 * Render the Ink TUI
 * @param options - Configuration options for the app
 * @returns Cleanup function to unmount the app
 */
export function renderInkApp(options: InkAppOptions = {}): () => void {
  const { initialRoute = 'scan' } = options;

  const app = render(
    <App
      initialRoute={initialRoute}
    />
  );

  // Return cleanup function
  return () => {
    app.clear();
    app.unmount();
  };
}

/**
 * Check if Ink TUI can be rendered
 * Returns false for non-TTY environments (CI, SSH, etc.)
 */
export function canRenderInk(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}

export { App } from './App.js';
