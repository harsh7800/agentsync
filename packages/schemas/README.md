# agentsync-schemas

Versioned JSON schemas for AI agent tools.

## Supported Tools

- Claude Code
- Gemini CLI
- GitHub Copilot CLI
- OpenCode
- Cursor
- VS Code

## Features

- **Versioned Schemas** - Each tool has versioned schemas for backward compatibility
- **TypeScript Support** - Full TypeScript type definitions
- **Validation** - Runtime validation using JSON Schema

## Usage

```javascript
import { schemas } from 'agentsync-schemas';

// Get Claude MCP schema
const claudeSchema = schemas.get('claude-mcp', '1.0.0');

// Validate configuration
const isValid = schemas.validate('claude-mcp', config);
```

## Documentation

See [AgentSync CLI](https://github.com/agentsync/cli) for full documentation.

## License

MIT
