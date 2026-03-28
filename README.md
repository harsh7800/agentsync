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
```

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

## Project Structure

```
agentsync/
├── packages/
│   ├── core/        # Pure transformation logic
│   ├── cli/         # CLI interface
│   ├── schemas/     # JSON schemas
│   └── e2e/         # End-to-end tests
└── docs/            # Documentation
```

## License

MIT