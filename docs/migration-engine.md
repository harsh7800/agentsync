# Migration Engine — AgentSync CLI

## 1. Overview

The Migration Engine is the core component of AgentSync CLI.
It is responsible for converting configurations from one AI tool format to another using a common schema and transformation pipeline.

The migration engine operates independently from the CLI and filesystem layers.

---

## 2. Migration Engine Responsibilities

The migration engine performs the following operations:

* Parse source tool configuration
* Convert configuration to common schema
* Normalize configuration
* Perform deterministic transformations
* Use AI mapping when necessary
* Convert configuration to target tool format
* Mask API keys
* Generate migration report data

The migration engine does **not**:

* Read files directly
* Write files
* Execute shell commands
* Ask user input

Those responsibilities belong to the CLI layer.

---

## 3. Migration Pipeline

```
Source Tool Config
        ↓
Parser
        ↓
Common Schema
        ↓
Deterministic Transform
        ↓
AI Mapping Engine
        ↓
Adapter
        ↓
Key Masking
        ↓
Migration Result
```

The CLI layer then writes the migration result to disk.

---

## 4. Common Schema

The common schema represents a tool-agnostic structure for:

* MCP servers
* Agents
* Skills
* Prompts
* Environment variables
* API keys
* Tool settings

All tools must convert to and from this schema.

---

## 5. Migration Result Object

The migration engine should return something like:

```
{
  filesToWrite: [],
  maskedKeys: [],
  warnings: [],
  skippedItems: [],
  migrationNotes: [],
  schemaVersions: {}
}
```

The CLI layer uses this to:

* Write files
* Show migration report
* Display warnings
* Log schema versions

```
```
