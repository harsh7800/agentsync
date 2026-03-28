import type { JSONSchema7 } from 'json-schema';

/**
 * Claude Code Configuration Schema v1
 * Schema for Claude Code configuration files including MCP servers and custom agents
 */
export const claudeV1: JSONSchema7 = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentsync.io/schemas/claude/v1.json",
  "title": "Claude Code Configuration Schema v1",
  "description": "Schema for Claude Code configuration files including MCP servers and custom agents",
  "type": "object",
  "properties": {
    "mcpServers": {
      "type": "object",
      "description": "MCP server configurations",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "Command to run the MCP server"
          },
          "args": {
            "type": "array",
            "description": "Arguments to pass to the command",
            "items": {
              "type": "string"
            }
          },
          "env": {
            "type": "object",
            "description": "Environment variables for the MCP server",
            "additionalProperties": {
              "type": "string"
            }
          }
        },
        "required": ["command"],
        "additionalProperties": false
      }
    },
    "agents": {
      "type": "object",
      "description": "Custom agent definitions",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Display name for the agent"
          },
          "description": {
            "type": "string",
            "description": "Description of the agent's purpose"
          },
          "system_prompt": {
            "type": "string",
            "description": "System prompt for the agent"
          },
          "tools": {
            "type": "array",
            "description": "Tools available to the agent",
            "items": {
              "type": "string"
            }
          }
        },
        "required": ["description"],
        "additionalProperties": false
      }
    },
    "customInstructions": {
      "type": "array",
      "description": "Global custom instructions for Claude",
      "items": {
        "type": "string"
      }
    }
  },
  "additionalProperties": true
};
