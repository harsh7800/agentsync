# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-28

### 🚀 Features
- Initial release of AgentSync CLI
- Claude Code ↔ OpenCode bidirectional migration
- Support for Gemini CLI, GitHub Copilot CLI, Cursor, and VS Code
- MCP server configuration migration
- Agent and skill migration
- API key masking for secure migration
- Auto-backup before file overwrites
- Dry-run mode for safe migrations
- AI-assisted field mapping with similarity scoring
- Interactive CLI mode with smart prompts
- Smart agent scanner with manual and AI-assisted modes

### 📦 Packages
- `@agent-sync/cli` - Main CLI interface
- `@agent-sync/core` - Core transformation logic
- `@agent-sync/schemas` - Versioned JSON schemas

### 🧪 Testing
- 343+ tests passing
- Unit tests for all parsers and translators
- Integration tests for file operations
- E2E tests for migration workflows

### 🔧 Maintenance
- Monorepo setup with pnpm workspaces
- TypeScript strict mode enabled
- Vitest test runner with coverage
- GitHub Actions CI/CD pipelines
