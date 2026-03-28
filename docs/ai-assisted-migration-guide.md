# AI-Assisted Interactive Migration Guide

## Overview

AgentSync CLI provides an AI-assisted interactive migration engine that intelligently detects, analyzes, and migrates AI tool configurations between different platforms. This guide covers the complete workflow from detection to migration completion.

## Features

- 🤖 **AI-Assisted Scanning**: Autonomous detection with intelligent pattern recognition
- 👤 **Manual Scanning**: Full user control over scan scope and depth
- 🎯 **Smart Mapping**: AI-powered field mapping with confidence scoring
- ⚡ **Conflict Resolution**: Interactive resolution strategies for mapping conflicts
- 🛡️ **Safe Migration**: Automatic backups and dry-run support

## Prerequisites

- Node.js 18 or higher
- AgentSync CLI installed globally or locally
- Source AI tool configuration files

## Installation

```bash
# Install globally
npm install -g agentsync

# Or use locally with npx
npx agentsync --version
```

## Quick Start

### 1. Detect Installed Tools

Check which AI tools are detected on your system:

```bash
agentsync detect
```

This will scan common configuration locations and report found tools:
- Claude Code
- OpenCode
- Gemini CLI
- Cursor
- GitHub Copilot CLI

### 2. Scan for Configurations

#### AI-Assisted Scan Mode (Recommended)

```bash
# Start AI-assisted scan
agentsync scan --ai

# Scan home directory with AI
agentsync scan --ai --scope home

# Save results to file
agentsync scan --ai --output scan-results.json
```

**AI Mode Features:**
- Autonomous detection using pattern matching
- Content analysis for tool identification
- Migration path suggestions
- Confidence scoring
- Conflict detection

#### Manual Scan Mode

```bash
# Start manual scan
agentsync scan --manual

# Specify scope and depth
agentsync scan --manual --scope current --depth 5

# Custom scan with filters
agentsync scan --manual --scope custom --include "**/*.json"
```

**Manual Mode Options:**
- `--scope`: current | home | system
- `--depth`: Directory depth (1-10)
- `--include`: File patterns to include
- `--exclude`: File patterns to exclude
- `--output`: Save results to file

### 3. Migrate Configurations

#### Basic Migration

```bash
# Simple migration between tools
agentsync migrate --from claude --to opencode
```

#### AI-Assisted Migration

```bash
# Use AI for intelligent field mapping
agentsync migrate --from claude --to opencode --ai-assist

# With custom paths
agentsync migrate --from claude --to opencode --ai-assist \
  --source ~/.config/claude/settings.json \
  --target ~/.config/opencode/config.json
```

#### Manual Migration

```bash
# Disable AI suggestions for full manual control
agentsync migrate --from claude --to opencode --manual
```

#### Dry Run

```bash
# Preview changes without applying
agentsync migrate --from claude --to opencode --dry-run --verbose
```

## AI-Assisted Migration Workflow

### Step 1: Detection and Scanning

The AI scanner automatically:
1. Detects configuration files using glob patterns
2. Analyzes file content to identify tool types
3. Categorizes agents as local or system-wide
4. Generates confidence scores for detections

### Step 2: Field Mapping Generation

AI generates field mappings with:
- **Similarity Scoring**: Uses Levenshtein distance and Jaro-Winkler algorithms
- **Semantic Analysis**: Understands field meanings from descriptions
- **Pattern Recognition**: Identifies naming conventions (camelCase, snake_case)
- **Confidence Ratings**: Each mapping has a 0-100% confidence score

**Confidence Levels:**
- **90-100%** (High): Exact or near-exact matches - safe to auto-accept
- **70-89%** (Medium): Similar fields - recommend review
- **50-69%** (Low): Possible matches - manual review required
- **<50%** (Very Low): Unlikely matches - user decision needed

### Step 3: Conflict Detection

The system detects conflicts such as:
- **One-to-Many**: One source field maps to multiple targets
- **Many-to-One**: Multiple source fields map to one target
- **Type Mismatch**: Source and target have incompatible types
- **Required Missing**: Required target field has no source mapping

### Step 4: Interactive Resolution

Choose resolution strategies:

```bash
# Strict: Keep only non-conflicting mappings
agentsync migrate --from claude --to opencode --ai-assist --strict

# Lenient: Keep all mappings, flag conflicts
agentsync migrate --from claude --to opencode --ai-assist --lenient

# Interactive: Prompt for each conflict
agentsync migrate --from claude --to opencode --ai-assist --interactive
```

**Resolution Options:**
- **Keep First**: Use highest confidence mapping
- **Keep All**: Retain all mappings (may cause issues)
- **Merge**: Combine multiple sources
- **Skip**: Exclude conflicting mapping
- **Custom**: Specify custom target field

### Step 5: Migration Execution

1. **Backup Creation**: Target config backed up automatically
2. **Key Masking**: API keys and secrets are masked in output
3. **Atomic Write**: Changes written atomically to prevent corruption
4. **Verification**: Configuration validated after migration
5. **Report Generation**: Summary of migrated fields and conflicts

## Interactive Mode

Launch the interactive wizard:

```bash
# No arguments launches interactive mode
agentsync

# Or explicitly
agentsync interactive
```

The wizard guides you through:
1. Tool detection
2. Scan mode selection (AI or Manual)
3. Migration source/target selection
4. Field mapping review
5. Conflict resolution
6. Migration execution

## Configuration Options

### Environment Variables

```bash
# Set default backup directory
export AGENTSYNC_BACKUP_DIR="~/.agentsync/backups"

# Set log level
export AGENTSYNC_LOG_LEVEL="debug"

# Disable AI features
export AGENTSYNC_AI_ENABLED="false"
```

### Configuration File

Create `~/.agentsync/config.json`:

```json
{
  "defaultBackupDir": "~/.agentsync/backups",
  "aiAssist": true,
  "similarityThreshold": 70,
  "autoAcceptHighConfidence": true,
  "highConfidenceThreshold": 90
}
```

## Best Practices

### Before Migration

1. **Backup**: Always backup configurations manually first
2. **Dry Run**: Use `--dry-run` to preview changes
3. **Scan**: Run `agentsync scan` to understand what will be migrated
4. **Review**: Check AI-generated mappings before accepting

### During Migration

1. **Start Small**: Test with a single agent first
2. **Review Conflicts**: Don't auto-resolve conflicts without review
3. **Check Masks**: Verify API keys are properly masked
4. **Monitor Output**: Watch for warnings or errors

### After Migration

1. **Test**: Verify the migrated tool works correctly
2. **Compare**: Check differences between source and target
3. **Clean Up**: Remove backups after successful validation
4. **Document**: Note any manual adjustments made

## Troubleshooting

### Common Issues

**Issue**: Tool not detected
```bash
# Solution: Specify explicit path
agentsync migrate --from claude --to opencode \
  --source /path/to/your/settings.json
```

**Issue**: Low confidence mappings
```bash
# Solution: Lower threshold or use manual mode
agentsync migrate --from claude --to opencode --manual
```

**Issue**: Migration conflicts
```bash
# Solution: Use interactive resolution
agentsync migrate --from claude --to opencode --ai-assist --interactive
```

**Issue**: Permission denied
```bash
# Solution: Check file permissions
chmod 644 ~/.config/claude/settings.json
```

### Debug Mode

Enable verbose logging:

```bash
agentsync migrate --from claude --to opencode --verbose
```

### Getting Help

```bash
# Show help
agentsync --help

# Show command help
agentsync migrate --help
agentsync scan --help

# Show version
agentsync --version
```

## Advanced Usage

### Batch Migrations

Migrate multiple agents:

```bash
# Scan and migrate all detected agents
agentsync scan --ai --output scan.json
agentsync migrate --from claude --to opencode --batch scan.json
```

### Custom Field Mappings

Create a mapping file `mappings.json`:

```json
{
  "fieldMappings": [
    {
      "source": "custom_field",
      "target": "custom_target",
      "transform": "rename"
    }
  ]
}
```

Apply custom mappings:

```bash
agentsync migrate --from claude --to opencode \
  --custom-mappings mappings.json
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Migrate Config
  run: |
    agentsync migrate \
      --from claude \
      --to opencode \
      --ai-assist \
      --dry-run \
      --verbose
```

## Supported Tool Matrix

| Source | Target | Status | Notes |
|--------|--------|--------|-------|
| Claude | OpenCode | ✅ Stable | Full bidirectional support |
| OpenCode | Claude | ✅ Stable | Full bidirectional support |
| Claude | Gemini | ⚠️ Beta | Partial support |
| Gemini | Claude | ⚠️ Beta | Partial support |
| Cursor | OpenCode | ⚠️ Beta | Limited to MCP servers |
| OpenCode | Cursor | ⚠️ Beta | Limited to MCP servers |

## API Reference

### Core Classes

**AIAssistedScanner**
```typescript
const scanner = new AIAssistedScanner();
const result = await scanner.scan({
  scope: 'current',
  autoDetect: true,
  analyzeContent: true
});
```

**MappingEngine**
```typescript
const engine = new MappingEngine();
const analysis = await engine.analyze(sourceConfig, targetConfig);
const suggestions = engine.suggestMappings(analysis);
```

**InteractiveConflictResolver**
```typescript
const resolver = new InteractiveConflictResolver();
const resolution = await resolver.resolveInteractively(mappings);
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Adding new tool adapters
- Improving AI algorithms
- Reporting issues
- Submitting pull requests

## License

MIT License - See [LICENSE](./LICENSE) for details

## Support

- 📧 Email: support@agentsync.dev
- 💬 Discord: [Join our community](https://discord.gg/agentsync)
- 🐛 Issues: [GitHub Issues](https://github.com/agentsync/cli/issues)

---

**Last Updated**: 2025-03-28  
**Version**: 1.0.0  
**CLI Version**: agentsync@1.0.0
