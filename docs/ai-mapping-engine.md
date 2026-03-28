# AI Mapping Engine — AgentSync CLI

## 1. Purpose

The AI Mapping Engine assists with converting configurations between tools when deterministic schema mapping is not sufficient.

AI is used only for transformation and mapping, not for file operations.

---

## 2. AI Responsibilities

AI may be used for:

- Mapping agent prompts between tools
- Converting skill definitions
- Translating MCP tool definitions
- Handling schema mismatches
- Generating equivalent configurations
- Filling optional fields
- Generating migration notes
- Explaining unsupported features

---

## 3. AI Mapping Pipeline

```
Common Schema
      ↓
AI Mapping Engine
      ↓
Updated Common Schema
      ↓
Adapter
```

---

## 4. Deterministic First Rule

Migration priority:

1. Deterministic schema mapping
2. Rule-based transformation
3. AI-assisted mapping
4. Manual migration warning

AI should only be used when deterministic mapping is not possible.

---

## 5. Important Rule

AI must:

- Never write files
- Never modify filesystem
- Only transform structured data
- Return structured objects
- Provide migration notes

```

```
