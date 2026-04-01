import type { CommandContext, CommandResult } from '../types.js';

/**
 * Available command definitions
 */
export const AVAILABLE_COMMANDS = [
  {
    name: 'scan',
    description: 'Scan for agents and tools',
    usage: '/scan [current|system|custom]'
  },
  {
    name: 'migrate',
    description: 'Start migration workflow',
    usage: '/migrate'
  },
  {
    name: 'detect',
    description: 'Detect installed tools',
    usage: '/detect'
  },
  {
    name: 'status',
    description: 'Show current session state',
    usage: '/status'
  },
  {
    name: 'clear',
    description: 'Clear the screen',
    usage: '/clear'
  },
  {
    name: 'help',
    description: 'Show this help message',
    usage: '/help'
  },
  {
    name: 'exit',
    description: 'Exit Agent Mode',
    usage: '/exit'
  }
];

/**
 * Formats help text for display
 */
export function formatHelpText(): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════');
  lines.push('       AVAILABLE COMMANDS');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  
  AVAILABLE_COMMANDS.forEach(cmd => {
    lines.push(`  /${cmd.name.padEnd(10)} ${cmd.description}`);
  });
  
  lines.push('');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push('Tip: Use /scan first to detect your agents,');
  lines.push('     then /migrate to start migration.');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Main help command handler
 */
export async function helpHandler(context: CommandContext): Promise<CommandResult> {
  const helpText = formatHelpText();
  console.log(helpText);
  
  return {
    success: true,
    message: `Type any /command to execute. Use /exit to quit.`
  };
}
