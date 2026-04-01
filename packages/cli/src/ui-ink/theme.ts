/**
 * Theme configuration for Ink TUI
 * Dark, minimal color scheme matching Cloud/OpenCode aesthetic
 */

export const theme = {
  colors: {
    // Primary colors
    primary: '#3B82F6',      // Blue 500
    primaryBright: '#60A5FA', // Blue 400
    primaryDim: '#1E40AF',    // Blue 800
    
    // Background colors
    bg: '#0F172A',           // Slate 900
    bgSecondary: '#1E293B',  // Slate 800
    bgTertiary: '#334155',   // Slate 700
    
    // Text colors
    text: '#F8FAFC',         // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#64748B',    // Slate 500
    
    // Border colors
    border: '#334155',       // Slate 700
    borderBright: '#475569', // Slate 600
    
    // Status colors
    success: '#22C55E',      // Green 500
    successDim: '#15803D',   // Green 700
    warning: '#F59E0B',      // Amber 500
    warningDim: '#B45309',   // Amber 700
    error: '#EF4444',        // Red 500
    errorDim: '#B91C1C',     // Red 700
    info: '#3B82F6',         // Blue 500
    
    // Accent colors for different tools
    claude: '#D97706',       // Amber 600
    opencode: '#3B82F6',     // Blue 500
    gemini: '#8B5CF6',       // Violet 500
    cursor: '#10B981',       // Emerald 500
    copilot: '#6B7280',      // Gray 500
  },
  
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },
  
  borders: {
    single: '│',
    double: '║',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors;
