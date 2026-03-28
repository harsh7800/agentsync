# agentsync-core

Core transformation logic for AgentSync CLI.

## Features

- **Parsers** - Tool-specific configuration parsers for Claude, OpenCode, Gemini CLI, Cursor, and more
- **Translators** - Bidirectional configuration translators between AI agent tools
- **Migration Service** - Handles migration workflow with backup and validation
- **AI Mapping Engine** - Intelligent field mapping with similarity scoring
- **API Key Masking** - Automatic masking of sensitive API keys

## Usage

```javascript
import { ClaudeParser } from 'agentsync-core';

// Parse Claude configuration
const parser = new ClaudeParser();
const result = await parser.parse('/path/to/.claude.json');
```

## Documentation

See [AgentSync CLI](https://github.com/agentsync/cli) for full documentation.

## License

MIT
