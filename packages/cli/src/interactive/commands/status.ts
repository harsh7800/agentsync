import type { CommandContext, CommandResult, SessionState } from '../types.js';

/**
 * Formats session state into a display string
 */
export function formatSessionStatus(session: SessionState): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════');
  lines.push('         CURRENT SESSION');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  
  const hasData = session.hasScanned || session.scannedTools.length > 0;
  
  if (!hasData) {
    lines.push('Scan Status: ○ Not scanned');
    lines.push('');
    lines.push('No scan data available.');
    lines.push('Run /scan to detect tools and agents.');
  } else {
    lines.push(`Scan Status: ${session.hasScanned ? '✔ Complete' : '○ Not scanned'}`);
    if (session.scanTimestamp) {
      lines.push(`Last Scan: ${session.scanTimestamp.toLocaleString()}`);
    }
    lines.push('');
    lines.push(`Tools Detected: ${session.scannedTools.length}`);
    session.scannedTools.forEach(tool => {
      lines.push(`  • ${tool}`);
    });
    lines.push('');
    lines.push(`Agents: ${session.detectedAgents.length}`);
    if (Array.isArray(session.detectedAgents) && session.detectedAgents.length > 0) {
      session.detectedAgents.forEach(agent => {
        const name = typeof agent === 'string' ? agent : agent.name;
        lines.push(`  • ${name}`);
      });
    }
    lines.push('');
    lines.push(`Skills: ${session.detectedSkills.length}`);
    lines.push(`MCP Servers: ${session.detectedMCPs.length}`);
    lines.push('');
    lines.push('Scanned Paths:');
    session.scanPaths.forEach(path => {
      lines.push(`  ${path}`);
    });
  }
  
  lines.push('');
  if (session.selectedTargetTool) {
    lines.push(`Target Tool: ${session.selectedTargetTool}`);
  } else {
    lines.push('Target Tool: Not selected');
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Main status command handler
 */
export async function statusHandler(context: CommandContext): Promise<CommandResult> {
  const statusDisplay = formatSessionStatus(context.session);
  console.log(statusDisplay);
  
  return {
    success: true,
    message: `Session status displayed. Tools: ${context.session.scannedTools.length}, Agents: ${context.session.detectedAgents.length}`
  };
}
