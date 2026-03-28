# AgentSync CLI

AI-assisted command-line tool for migrating AI agent configurations between development tools.

## Supported Tools

- Claude Code
- Gemini CLI
- GitHub Copilot CLI
- OpenCode
- Cursor

## Installation

```bash
npm install -g agentsync
# or
pnpm add -g agentsync
```

## Usage

```bash
# Migrate from Claude Code to Cursor
agentsync migrate --from claude --to cursor

# Dry run to see what would change
agentsync migrate --from claude --to cursor --dry-run

# Detect installed tools
agentsync detect

# Interactive mode
agentsync interactive

# Scan for agents
agentsync scan --manual
agentsync scan --ai
```

## Features

- **Bidirectional Migration** - Migrate configurations between any supported tools
- **MCP Server Support** - Migrate Model Context Protocol server configurations
- **Agent & Skill Migration** - Transfer agents and skills between tools
- **API Key Masking** - Automatically masks sensitive API keys during migration
- **Auto-Backup** - Creates timestamped backups before overwriting files
- **Dry Run Mode** - Preview changes before applying them
- **AI-Assisted Mapping** - Intelligent field mapping with similarity scoring
- **Interactive Mode** - Guided migration with smart prompts

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Start CLI in dev mode
pnpm dev
```

## License

MIT
