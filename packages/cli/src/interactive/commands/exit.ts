import type { CommandContext, CommandResult } from '../types.js';

/**
 * Main exit command handler
 */
export async function exitHandler(context: CommandContext): Promise<CommandResult> {
  console.log('Goodbye! 👋');
  
  return {
    success: true,
    message: 'Exiting AgentSync Interactive Mode.',
    shouldExit: true
  };
}
