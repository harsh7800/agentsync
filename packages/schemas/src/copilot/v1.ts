import type { JSONSchema7 } from 'json-schema';

export const copilotV1: JSONSchema7 = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentsync.io/schemas/copilot/v1.json",
  "title": "GitHub Copilot CLI Configuration Schema v1",
  "description": "Schema for GitHub Copilot CLI configuration",
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
    "github": {
      "type": "object",
      "description": "GitHub integration settings",
      "properties": {
        "token": { "type": "string", "description": "GitHub personal access token" },
        "enterprise": { "type": "boolean", "description": "Use GitHub Enterprise", "default": false }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": true
};
