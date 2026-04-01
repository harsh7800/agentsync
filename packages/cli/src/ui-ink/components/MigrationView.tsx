/**
 * Migration View Component
 * Wizard-style interface for migrating agents between tools
 */

import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { homedir } from 'os';
import { MigrationService } from '@agent-sync/core';
import type { Route } from '../App.js';
import { Layout, Section, StatusBar } from './Layout.js';
import {
  ActionsList,
  WizardSteps,
  SummaryTable,
  List,
  ProgressBar,
  LogsPanel
} from './UIComponents.js';
import { FileBrowser } from './FileBrowser.js';

interface MigrationViewProps {
  detectedAgents: Array<{
    tool: string;
    name: string;
    path: string;
  }>;
  onNavigate: (route: Route) => void;
}

type MigrationStep =
  | 'select-source'
  | 'select-target'
  | 'select-output'
  | 'file-browser'
  | 'confirm'
  | 'migrating'
  | 'complete'
  | 'error';

const TOOL_ICONS: Record<string, string> = {
  opencode: '🔵',
  claude: '🟠',
  cursor: '🟢',
  gemini: '🟣',
  copilot: '⚪',
};

const TOOL_NAMES: Record<string, string> = {
  opencode: 'OpenCode',
  claude: 'Claude Code',
  cursor: 'Cursor',
  gemini: 'Gemini CLI',
  copilot: 'GitHub Copilot',
};

const OUTPUT_OPTIONS = [
  { id: 'current', label: '📁 Current Directory', path: process.cwd() },
  { id: 'home', label: '🏠 Home Directory', path: homedir() },
  { id: 'config', label: '⚙️  Default Config', path: homedir() + '/.config' },
  { id: 'custom', label: '📂 Browse Custom Path', path: '' },
];

export function MigrationView({
  detectedAgents,
  onNavigate,
}: MigrationViewProps): React.ReactElement {
  const { exit } = useApp();
  const [step, setStep] = useState<MigrationStep>('select-source');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sourceTool, setSourceTool] = useState<string>('');
  const [targetTool, setTargetTool] = useState<string>('');
  const [outputPath, setOutputPath] = useState<string>(process.cwd());
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [migratedFiles, setMigratedFiles] = useState<string[]>([]);

  // Get unique tools from detected agents
  const availableSourceTools = [...new Set(detectedAgents.map(a => a.tool))];
  const availableTargetTools = Object.keys(TOOL_NAMES).filter(t => t !== sourceTool);
  
  // Get agents for selected source tool
  const agentsToMigrate = detectedAgents.filter(a => a.tool === sourceTool);

  // Wizard step configuration
  const getStepNumber = () => {
    switch (step) {
      case 'select-source': return 1;
      case 'select-target': return 2;
      case 'select-output': return 3;
      case 'confirm': return 4;
      case 'migrating': return 5;
      case 'complete': return 6;
      case 'error': return 5;
      default: return 1;
    }
  };

  const getBreadcrumb = () => {
    switch (step) {
      case 'select-source': return 'AgentSync → Migrate → Source';
      case 'select-target': return 'AgentSync → Migrate → Target';
      case 'select-output': return 'AgentSync → Migrate → Output';
      case 'confirm': return 'AgentSync → Migrate → Confirm';
      case 'migrating': return 'AgentSync → Migrate → Progress';
      case 'complete': return 'AgentSync → Migrate → Complete';
      case 'error': return 'AgentSync → Migrate → Error';
      default: return 'AgentSync → Migrate';
    }
  };

  useInput((input, key) => {
    if (step === 'migrating') return;

    const maxIndex = 
      step === 'select-source' ? availableSourceTools.length - 1 :
      step === 'select-target' ? availableTargetTools.length - 1 :
      step === 'select-output' ? OUTPUT_OPTIONS.length - 1 :
      step === 'confirm' ? 2 :
      step === 'complete' ? 2 : 0;

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    } else if (key.return) {
      handleSelect();
    } else if (key.escape) {
      handleBack();
    } else if (input === 'q') {
      exit();
    }
  });

  const handleSelect = () => {
    switch (step) {
      case 'select-source':
        if (availableSourceTools[selectedIndex]) {
          setSourceTool(availableSourceTools[selectedIndex]);
          setStep('select-target');
          setSelectedIndex(0);
        }
        break;
      case 'select-target':
        if (availableTargetTools[selectedIndex]) {
          setTargetTool(availableTargetTools[selectedIndex]);
          setStep('select-output');
          setSelectedIndex(0);
        }
        break;
      case 'select-output':
        if (OUTPUT_OPTIONS[selectedIndex].id === 'custom') {
          setStep('file-browser');
        } else {
          setOutputPath(OUTPUT_OPTIONS[selectedIndex].path);
          setStep('confirm');
          setSelectedIndex(0);
        }
        break;
      case 'confirm':
        if (selectedIndex === 0) {
          startMigration();
        } else if (selectedIndex === 1) {
          handleBack();
        } else {
          exit();
        }
        break;
      case 'complete':
        if (selectedIndex === 0) {
          onNavigate('scan');
        } else if (selectedIndex === 1) {
          resetWizard();
        } else {
          exit();
        }
        break;
      case 'error':
        if (selectedIndex === 0) {
          setStep('confirm');
          setSelectedIndex(0);
        } else {
          exit();
        }
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'select-target':
        setStep('select-source');
        setSelectedIndex(0);
        break;
      case 'select-output':
        setStep('select-target');
        setSelectedIndex(0);
        break;
      case 'file-browser':
        setStep('select-output');
        setSelectedIndex(0);
        break;
      case 'confirm':
        setStep('select-output');
        setSelectedIndex(0);
        break;
    }
  };

  const resetWizard = () => {
    setStep('select-source');
    setSelectedIndex(0);
    setSourceTool('');
    setTargetTool('');
    setOutputPath(process.cwd());
    setProgress(0);
    setLogs([]);
    setErrorMessage('');
    setMigratedFiles([]);
  };

  const startMigration = async () => {
    setStep('migrating');
    setProgress(0);
    setLogs(['Initializing migration...']);

    try {
      const migrationService = new MigrationService();
      
      setProgress(20);
      setLogs(prev => [...prev, 'Reading source configurations...']);
      
      setProgress(40);
      setLogs(prev => [...prev, `Found ${agentsToMigrate.length} agents to migrate`]);
      
      // Count skills for source tool
      const skillsToMigrate = detectedAgents.filter(a => a.tool === sourceTool);
      const skillCount = skillsToMigrate.length; // This should be actual skills, not agents
      setLogs(prev => [...prev, `Found ${skillCount} skills to migrate`]);
      
      setProgress(60);
      setLogs(prev => [...prev, 'Converting to target format...']);
      
      // Determine source path based on tool type
      // For OpenCode, it's the .opencode directory in the project root
      // For other tools, use the detected agent paths to find the root
      const sourcePath = sourceTool === 'opencode'
        ? process.cwd() + '/.opencode'
        : process.cwd();

      setLogs(prev => [...prev, `Source path: ${sourcePath}`]);

      // Perform migration
      const result = await migrationService.migrate({
        sourceTool: sourceTool as any,
        targetTool: targetTool as any,
        sourcePath: sourcePath,
        targetPath: outputPath,
        backupDir: outputPath + '/.backup',
        dryRun: false,
        verbose: false
      });

      setProgress(80);
      setLogs(prev => [...prev, 'Writing target configuration...']);
      
      if (result.success) {
        setProgress(100);
        setLogs(prev => [...prev, 'Migration complete!']);
        setLogs(prev => [...prev, `Migrated ${result.itemsMigrated.agents} agents, ${result.itemsMigrated.skills} skills`]);
        
        // Build list of migrated files
        const files = [
          `${outputPath}/.claude/settings.json`,
        ];
        
        // Add agents directory if agents were migrated
        if (result.itemsMigrated.agents > 0) {
          files.push(`${outputPath}/.claude/agents/`);
        }
        
        // Add skills directory if skills were migrated
        if (result.itemsMigrated.skills > 0) {
          files.push(`${outputPath}/.claude/skills/`);
        }
        
        setMigratedFiles(files);
        setTimeout(() => setStep('complete'), 500);
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Migration failed');
      setStep('error');
      setSelectedIndex(0);
    }
  };

  // Render Step 1: Select Source
  if (step === 'select-source') {
    const actions = availableSourceTools.map((tool, index) => ({
      id: tool,
      label: `${TOOL_ICONS[tool] || '⚪'} ${TOOL_NAMES[tool] || tool}`,
      color: index === selectedIndex ? 'cyan' : 'white' as 'cyan' | 'white',
    }));

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Select Source Tool"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select', 'q Quit']}
          />
        }
      >
        <WizardSteps
          currentStep={1}
          totalSteps={6}
          title="Migration Wizard"
          subtitle="Select the source tool to migrate from"
        />

        <Section>
          <Text color="gray">Choose the tool that contains your agents:</Text>
        </Section>

        <Section title="Available Tools">
          <SummaryTable
            items={availableSourceTools.map(tool => ({
              label: `${TOOL_ICONS[tool] || '⚪'} ${TOOL_NAMES[tool] || tool}`,
              value: `${detectedAgents.filter(a => a.tool === tool).length} agents`,
            }))}
          />
        </Section>
      </Layout>
    );
  }

  // Render Step 2: Select Target
  if (step === 'select-target') {
    const actions = availableTargetTools.map((tool, index) => ({
      id: tool,
      label: `${TOOL_ICONS[tool] || '⚪'} ${TOOL_NAMES[tool] || tool}`,
      color: index === selectedIndex ? 'cyan' : 'white' as 'cyan' | 'white',
    }));

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Select Target Tool"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select', 'Esc Back', 'q Quit']}
          />
        }
      >
        <WizardSteps
          currentStep={2}
          totalSteps={6}
          title="Migration Wizard"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ?`}
        />

        <Section>
          <Text color="gray">Choose the target tool to migrate to:</Text>
        </Section>

        <Section title="Migration Path">
          <Text>
            From: <Text bold>{TOOL_ICONS[sourceTool]} {TOOL_NAMES[sourceTool]}</Text>
          </Text>
          <Text color="gray">↓</Text>
          <Text>
            To: <Text color="gray">(select below)</Text>
          </Text>
        </Section>
      </Layout>
    );
  }

  // Render Step 3: Select Output
  if (step === 'select-output') {
    const actions = OUTPUT_OPTIONS.map((option, index) => ({
      id: option.id,
      label: `${option.label}`,
      color: index === selectedIndex ? 'cyan' : 'white' as 'cyan' | 'white',
    }));

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Select Output Location"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select', 'Esc Back', 'q Quit']}
          />
        }
      >
        <WizardSteps
          currentStep={3}
          totalSteps={6}
          title="Migration Wizard"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}`}
        />

        <Section>
          <Text color="gray">Choose where to save the migrated configuration:</Text>
        </Section>

        <Section title="Selected Path">
          <Text color="cyan">{OUTPUT_OPTIONS[selectedIndex]?.path || outputPath}</Text>
        </Section>
      </Layout>
    );
  }

  // Render File Browser for custom path
  if (step === 'file-browser') {
    return (
      <FileBrowser
        initialPath={process.cwd()}
        onSelect={(path) => {
          setOutputPath(path);
          setStep('confirm');
          setSelectedIndex(0);
        }}
        onCancel={() => {
          setStep('select-output');
          setSelectedIndex(0);
        }}
        title="Select output directory for migration"
      />
    );
  }

  // Render Step 4: Confirm
  if (step === 'confirm') {
    const actions = [
      { id: 'start', label: 'Start Migration', shortcut: 's', color: 'green' as const },
      { id: 'back', label: 'Back', shortcut: 'b', color: 'gray' as const },
      { id: 'cancel', label: 'Cancel', shortcut: 'c', color: 'red' as const },
    ];

    const agentNames = agentsToMigrate.map(a => a.name);

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Actions"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select', 'Esc Back', 'q Quit']}
          />
        }
      >
        <WizardSteps
          currentStep={4}
          totalSteps={6}
          title="Confirm Migration"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}`}
        />

        <Section title="Migration Details">
          <SummaryTable
            items={[
              { label: 'Source Tool', value: `${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]}` },
              { label: 'Target Tool', value: `${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}` },
              { label: 'Output Path', value: outputPath },
            ]}
          />
        </Section>

        <Section title={`Agents to Migrate (${agentsToMigrate.length})`}>
          <List items={agentNames} />
        </Section>

        <Section title="Summary">
          <SummaryTable
            items={[
              { label: 'Total Agents', value: agentsToMigrate.length },
              { label: 'Source Skills', value: detectedAgents.filter(a => a.tool === sourceTool).length },
            ]}
          />
        </Section>

        <Box marginTop={1}>
          <Text color="yellow">⚠ This will create files in the output directory.</Text>
          <Text color="gray">Existing configurations will be backed up.</Text>
        </Box>
      </Layout>
    );
  }

  // Render Step 5: Migrating
  if (step === 'migrating') {
    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        statusBar={
          <StatusBar
            info="Migration in progress..."
          />
        }
      >
        <WizardSteps
          currentStep={5}
          totalSteps={6}
          title="Migration Progress"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}`}
        />

        <Section title="Progress">
          <ProgressBar
            progress={progress}
            width={50}
            label="Migrating agents..."
          />
        </Section>

        <Section title="Activity Log">
          <LogsPanel logs={logs} maxLines={8} />
        </Section>

        <Box marginTop={1}>
          <Text color="yellow">⏳ Please wait, this may take a moment...</Text>
        </Box>
      </Layout>
    );
  }

  // Render Step 6: Complete
  if (step === 'complete') {
    const actions = [
      { id: 'scan', label: 'Run New Scan', shortcut: 's', color: 'blue' as const },
      { id: 'migrate', label: 'Migrate Again', shortcut: 'm', color: 'green' as const },
      { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
    ];

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Actions"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select']}
          />
        }
      >
        <WizardSteps
          currentStep={6}
          totalSteps={6}
          title="Migration Complete"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}`}
        />

        <Section>
          <Text bold color="green">
            ✓ Successfully migrated {agentsToMigrate.length} agent{agentsToMigrate.length > 1 ? 's' : ''}
          </Text>
        </Section>

        <Section title="Output Files">
          <List items={migratedFiles} bullet="•" color="cyan" />
        </Section>

        <Section title="Next Steps">
          <Text color="gray">You can now use your migrated agents in {TOOL_NAMES[targetTool]}.</Text>
          <Text color="gray">Run a new scan to verify the migration or migrate more agents.</Text>
        </Section>
      </Layout>
    );
  }

  // Render Error State
  if (step === 'error') {
    const actions = [
      { id: 'retry', label: 'Try Again', shortcut: 't', color: 'yellow' as const },
      { id: 'quit', label: 'Quit', shortcut: 'q', color: 'gray' as const },
    ];

    return (
      <Layout
        breadcrumb={getBreadcrumb()}
        actions={
          <ActionsList
            actions={actions}
            selectedIndex={selectedIndex}
            title="Actions"
          />
        }
        statusBar={
          <StatusBar
            shortcuts={['↑↓ Navigate', 'Enter Select']}
          />
        }
      >
        <WizardSteps
          currentStep={5}
          totalSteps={6}
          title="Migration Failed"
          subtitle={`Migration: ${TOOL_ICONS[sourceTool]} ${TOOL_NAMES[sourceTool]} → ${TOOL_ICONS[targetTool]} ${TOOL_NAMES[targetTool]}`}
        />

        <Section>
          <Text bold color="red">✗ Migration failed</Text>
        </Section>

        <Section title="Error">
          <Text color="red">{errorMessage}</Text>
        </Section>

        <Section title="Troubleshooting">
          <Text color="gray">• Check that the source directory exists</Text>
          <Text color="gray">• Ensure you have write permissions to the output path</Text>
          <Text color="gray">• Verify that the target tool format is supported</Text>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout breadcrumb="AgentSync → Migrate">
      <Text color="gray">Loading...</Text>
    </Layout>
  );
}
