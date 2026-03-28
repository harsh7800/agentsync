# Schema Registry — AgentSync CLI

## 1. Purpose

The schema registry stores versioned configuration schemas for each supported tool.
This allows AgentSync to support multiple tool versions and maintain compatibility.

---

## 2. Schema Structure

```
packages/schemas/
  claude/
    v1.json
    v2.json
  gemini/
    v1.json
  cursor/
  opencode/
  copilot/
```

---

## 3. Schema Responsibilities

Schemas define:

* MCP config structure
* Agent config structure
* Skill config structure
* Environment variables
* API key locations
* Tool settings

Schemas contain **no logic**, only structure definitions.

---

## 4. Schema Version Lock

Each migration should record:

* Source schema version
* Target schema version
* Migration timestamp

This ensures migrations are reproducible.

```
```
