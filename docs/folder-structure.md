# Folder Structure — AgentSync CLI

```
agentsync/
│
├── packages/
│   │
│   ├── core/                 # Migration engine logic
│   │   ├── src/
│   │   │   ├── parsers/              # Tool-specific parsers
│   │   │   │   ├── claude/           # Claude parser (single-file config)
│   │   │   │   │   ├── scanner.ts
│   │   │   │   │   ├── tool.parser.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   └── SPEC.md
│   │   │   │   ├── opencode/         # OpenCode parser (directory-based)
│   │   │   │   │   ├── scanner.ts
│   │   │   │   │   ├── tool.parser.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── SPEC.md
│   │   │   │   │   └── parsers/
│   │   │   │   │       ├── agent.parser.ts
│   │   │   │   │       ├── skill.parser.ts
│   │   │   │   │       ├── mcp.parser.ts
│   │   │   │   │       └── config.parser.ts
│   │   │   │   ├── opencode-directory-scanner/  # Legacy scanner (deprecated)
│   │   │   │   ├── claudeparser.ts    # Legacy parser (deprecated)
│   │   │   │   └── opencodeparser.ts  # Legacy parser (deprecated)
│   │   │   ├── translators/           # Bidirectional translators
│   │   │   │   ├── claude-to-opencode.translator.ts
│   │   │   │   └── opencode-to-claude.translator.ts
│   │   │   ├── masking/              # API key masking
│   │   │   │   └── api-key-masker.ts
│   │   │   ├── ai-mapping/           # AI-assisted mapping engine
│   │   │   │   ├── similarity-calculator.ts
│   │   │   │   ├── field-matcher.ts
│   │   │   │   ├── mapping-engine.ts
│   │   │   │   ├── conflict-resolver.ts
│   │   │   │   └── suggestion-generator.ts
│   │   │   ├── ai-scanner/          # Smart agent scanner
│   │   │   │   ├── scanner.ts
│   │   │   │   ├── manual-scan.ts
│   │   │   │   ├── ai-assisted-scanner.ts
│   │   │   │   ├── categorizer.ts
│   │   │   │   ├── analyzer.ts
│   │   │   │   └── patterns.ts
│   │   │   ├── registry/             # Tool path registry
│   │   │   │   └── tool-paths.registry.ts
│   │   │   ├── types/               # Legacy type definitions
│   │   │   │   ├── claude.types.ts
│   │   │   │   └── opencode.types.ts
│   │   │   ├── file-operations.ts
│   │   │   └── __tests__/          # Unit and integration tests
│   │   └── package.json
│   │
│   ├── cli/                  # CLI interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── migrate.ts
│   │   │   │   ├── scan.ts
│   │   │   │   ├── detect.ts
│   │   │   │   └── interactive.ts
│   │   │   ├── interactive/          # Interactive components
│   │   │   │   ├── conflict-resolver.ts
│   │   │   │   └── mapping-prompts.ts
│   │   │   ├── ui/
│   │   │   │   ├── banner.ts
│   │   │   │   ├── colors.ts
│   │   │   │   └── migration-summary.ts
│   │   │   └── __tests__/          # CLI tests
│   │   └── package.json
│   │
│   ├── schemas/               # Tool schemas
│   │   ├── src/
│   │   │   ├── claude/
│   │   │   ├── gemini/
│   │   │   ├── cursor/
│   │   │   ├── opencode/
│   │   │   └── copilot/
│   │   └── package.json
│   │
│   └── e2e/                 # End-to-end tests
│       └── src/
│           ├── migration.e2e.spec.ts
│           ├── ai-assisted-migration.e2e.spec.ts
│           ├── smart-scanner.e2e.spec.ts
│           └── manual-scan.e2e.spec.ts
│
├── docs/
├── test-reports/             # Test coverage reports
├── .github/workflows/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json
└── README.md
```

## Key Architectural Changes

### Tool-Specific Parsers
Each tool now has its own parser directory with:
- `scanner.ts` — Scans tool's directory structure
- `tool.parser.ts` — Main parser interface
- `types.ts` — Tool-specific type definitions
- `SPEC.md` — Parser documentation
- `parsers/` — Individual file parsers (for multi-file tools)

### Tool Path Registry
The `registry/` folder contains `tool-paths.registry.ts` which:
- Defines directory structures for all supported tools
- Resolves global vs project paths
- Checks tool installation status

### Directory-Based vs Single-File Tools
- **Single-file tools** (Claude): One `settings.json` with all config
- **Directory-based tools** (OpenCode): Multiple files in `agents/`, `skills/` subdirectories

