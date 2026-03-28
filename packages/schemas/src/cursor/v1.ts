import type { JSONSchema7 } from 'json-schema';

export const cursorV1: JSONSchema7 = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentsync.io/schemas/cursor/v1.json",
  "title": "Cursor Configuration Schema v1",
  "description": "Schema for Cursor IDE configuration including .cursorrules and MCP settings",
  "type": "object",
  "properties": {
    "mcpServers": {
      "type": "object",
      "description": "MCP server configurations",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "command": { "type": "string", "description": "Command to run the MCP server" },
          "args": { "type": "array", "description": "Arguments to pass to the command", "items": { "type": "string" } },
          "env": { "type": "object", "description": "Environment variables for the MCP server", "additionalProperties": { "type": "string" } }
        },
        "required": ["command"],
        "additionalProperties": false
      }
    },
    "cursorRules": {
      "type": "array",
      "description": "Cursor rules for AI behavior",
      "items": {
        "type": "object",
        "properties": {
          "pattern": { "type": "string", "description": "File pattern to match" },
          "instruction": { "type": "string", "description": "Instruction for matched files" }
        },
        "required": ["pattern", "instruction"],
        "additionalProperties": false
      }
    },
    "aiConfig": {
      "type": "object",
      "description": "AI configuration settings",
      "properties": {
        "defaultModel": { "type": "string", "description": "Default AI model" },
        "temperature": { "type": "number", "description": "Temperature for AI responses", "minimum": 0, "maximum": 2 }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": true
};
