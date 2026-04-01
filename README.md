# AgentSync CLI

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/harsh7800/agentsync)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **AI-assisted terminal environment for managing AI agent configurations**

AgentSync CLI migrates AI agent environments between Claude Code, Gemini CLI, Cursor, OpenCode, and GitHub Copilot CLI. It provides both an **interactive Agent Mode** (REPL with slash commands) and traditional **Command Mode** for automation.

![AgentSync Demo](docs/assets/demo.gif)

## Features

- 🤖 **Agent Mode** - Interactive REPL with slash commands (/scan, /migrate, /status, /exit)
- 🔄 **Migration Engine** - Bidirectional migration between 5+ AI tools
- 🔍 **Smart Scanner** - Auto-detect installed AI tools and configurations
- 🧠 **AI Mapping** - Intelligent field mapping for complex transformations
- 🔐 **Security First** - API key masking, backups, local-only operation
- 📊 **Session State** - Persistent state across interactions
- ⚡ **Fast** - Pure TypeScript, fully testable architecture

## Installation

```bash
# Install globally
npm install -g agentsync

# Or use with npx
npx agentsync
```

## Quick Start

### Agent Mode (Default)

Run `agentsync` without arguments to enter **Agent Mode** - an interactive REPL:

```bash
$ agentsync

AgentSync Interactive Mode

Type / to see available commands.
Type /scan to scan for agents and tools.
Type /migrate to start migration.
Type /exit to quit.

> /scan
Scan current directory or entire system?
1. Current directory
2. Entire system
3. Custom path

> 2

Scanning directories...
✔ Found Claude Code config
✔ Found OpenCode agents
✔ Found 3 agents, 12 skills

Scan Complete

Tools Detected:
- Claude Code
- OpenCode

Agents Found: 3
- backend-agent
- migration-agent
- ui-agent

Skills Found: 12

MCP Servers:
- filesystem
- terminal
- github

Would you like to migrate these agents to another tool?
> Yes

Select target tool:
1. Claude Code
2. OpenCode
3. Gemini CLI
4. Cursor
5. GitHub Copilot CLI

> 2

Starting migration from Claude Code to OpenCode...
✔ Migration complete!

> /status

═══════════════════════════════════════════
         CURRENT SESSION
═══════════════════════════════════════════

Scan Status: ✔ Complete
Last Scan: 4/1/2026, 2:32:15 PM

Tools Detected: 2
  • Claude Code
  • OpenCode

Agents: 3
  • backend-agent
  • migration-agent
  • ui-agent

Skills: 12

MCP Servers: 3
  • filesystem
  • terminal
  • github

Target Tool: OpenCode

═══════════════════════════════════════════

> /exit
Goodbye! 👋
```

### Command Mode

Use traditional CLI commands for scripting and automation:

```bash
# Migrate from one tool to another
agentsync migrate --from claude --to cursor

# Detect installed tools
agentsync detect

# Scan for configurations
agentsync scan --ai

# Show migration report
agentsync report

# Restore from backup
agentsync rollback cursor
```

## Slash Commands

When in Agent Mode, use these slash commands:

| Command | Description | Example |
|---------|-------------|---------|
| `/` or `/help` | Show available commands | `/>` |
| `/scan` | Scan for agents and tools | `/scan` or `/scan current` |
| `/migrate` | Start migration workflow | `/migrate` |
| `/detect` | Detect installed tools | `/detect` |
| `/status` | Show current session state | `/status` |
| `/clear` | Clear the screen | `/clear` |
| `/exit` | Exit Agent Mode | `/exit` or `/quit` |

## Supported Tools

| Tool | Status | Migration Support |
|------|--------|-------------------|
| Claude Code | ✅ Stable | Full bidirectional |
| OpenCode | ✅ Stable | Full bidirectional |
| Gemini CLI | 🚧 Beta | Limited |
| Cursor | 🚧 Beta | Limited |
| GitHub Copilot CLI | 🚧 Beta | MCP only |

## Configuration

AgentSync looks for configurations in standard locations:

- **Claude Code**: `~/.config/claude/settings.json`
- **OpenCode**: `~/.config/opencode/`
- **Gemini CLI**: `~/.config/gemini/config.json`
- **Cursor**: `~/.cursor/config.json` or `.cursorrules`
- **Copilot CLI**: `~/.config/github-copilot/`

## Architecture

AgentSync uses a multi-layer architecture:

```
┌─────────────────────────────────────┐
│         Agent Mode (REPL)            │
│  /scan /migrate /status /help /exit │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        CLI Interface Layer           │
│   Commands, Interactive UI, Prompts  │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         Migration Engine             │
│   Parsers, Translators, AI Mapping   │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        Schema Registry               │
│   Tool-specific JSON schemas         │
└─────────────────────────────────────┘
```

## Development

```bash
# Clone repository
git clone https://github.com/harsh7800/agentsync.git
cd agentsync

# Install dependencies
pnpm install

# Build packages
pnpm build

# Run tests
pnpm test

# Run specific test file
pnpm test packages/cli/src/__tests__/agent-loop.spec.ts

# Start CLI in development mode
pnpm dev
```

## Project Structure

```
agentsync/
├── packages/
│   ├── cli/              # CLI entry point and interactive prompts
│   │   ├── src/
│   │   │   ├── commands/     # CLI commands (migrate, scan, etc.)
│   │   │   ├── interactive/  # Agent Mode (REPL, slash commands)
│   │   │   ├── prompts/      # Interactive prompts
│   │   │   └── ui/           # Terminal UI components
│   │   └── README.md
│   ├── core/             # Migration engine (parsers, translators)
│   │   ├── src/
│   │   │   ├── parsers/      # Tool-specific parsers
│   │   │   ├── translators/  # Common schema translators
│   │   │   ├── masking/      # API key masking
│   │   │   └── ai-mapping/   # AI-assisted mapping
│   │   └── README.md
│   ├── schemas/          # Versioned JSON schemas
│   │   └── src/
│   │       ├── claude/
│   │       ├── gemini/
│   │       ├── cursor/
│   │       └── opencode/
│   └── e2e/              # End-to-end tests
├── docs/                 # Documentation
│   ├── implementation-plan.md
│   ├── srs.md
│   ├── cli-interface.md
│   └── architecture.md
└── README.md
```

## Safety & Security

- ✅ **Local-only by default** - No data leaves your machine
- ✅ **API key masking** - Keys are never written in plain text
- ✅ **Automatic backups** - Target configs backed up before overwrite
- ✅ **Dry run mode** - Preview changes before applying
- ✅ **Atomic writes** - No partial migrations

## Documentation

- [Software Requirements Specification](docs/srs.md)
- [CLI Interface Guide](docs/cli-interface.md)
- [Architecture Overview](docs/architecture.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Migration Flow](docs/migration-flow.md)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/harsh7800/agentsync/issues)
- 💬 [Discussions](https://github.com/harsh7800/agentsync/discussions)

---

**Built with ❤️ for AI developers**

AgentSync CLI - Making AI tool migration painless
