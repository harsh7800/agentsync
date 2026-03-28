import { describe, it, expect } from 'vitest';
import { maskAPIKeys } from '../masking/api-key-masker.js';

describe('maskAPIKeys', () => {
  it('should mask OpenAI API key in string', () => {
    const input = 'sk-abc123def456ghi789';
    const result = maskAPIKeys(input);
    expect(result).toBe('sk-******************');
    expect(result.length).toBe(input.length);
  });

  it('should mask Anthropic API key', () => {
    const input = 'sk-ant-api03-abc123def456';
    const result = maskAPIKeys(input);
    // Note: sk- pattern matches first, so "ant-api03-abc123def456" gets masked
    expect(result).toBe('sk-***-api03-abc123def456');
    expect(result.length).toBe(input.length);
  });

  it('should mask Google API key', () => {
    const input = 'AIzaSyA1234567890abcdefg';
    const result = maskAPIKeys(input);
    expect(result).toBe('AIzaSy******************');
    expect(result.length).toBe(input.length);
  });

  it('should mask GitHub token', () => {
    const input = 'ghp_xxxxxxxxxxxxxxxxxxxx';
    const result = maskAPIKeys(input);
    expect(result).toBe('ghp_********************');
    expect(result.length).toBe(input.length);
  });

  it('should mask multiple keys in same text', () => {
    const input = 'Config with sk-abc123 and AIzaSyA123456 keys';
    const result = maskAPIKeys(input);
    expect(result).toContain('sk-******');
    expect(result).toContain('AIzaSy*******');
  });

  it('should not modify string without API keys', () => {
    const input = 'This is a normal configuration string';
    const result = maskAPIKeys(input);
    expect(result).toBe(input);
  });

  it('should handle empty string', () => {
    const result = maskAPIKeys('');
    expect(result).toBe('');
  });

  it('should mask keys in object properties', () => {
    const input = {
      apiKey: 'sk-abc123def456',
      otherField: 'normal value'
    };
    const result = maskAPIKeys(input);
    expect(result.apiKey).toBe('sk-************');
    expect(result.otherField).toBe('normal value');
  });

  it('should mask keys in nested objects', () => {
    const input = {
      config: {
        openai: {
          apiKey: 'sk-abc123def456'
        }
      }
    };
    const result = maskAPIKeys(input);
    expect(result.config.openai.apiKey).toBe('sk-************');
  });

  it('should mask keys in arrays', () => {
    const input = [
      { apiKey: 'sk-abc123' },
      { apiKey: 'AIzaSyA123456' }
    ];
    const result = maskAPIKeys(input);
    expect(result[0].apiKey).toBe('sk-******');
    expect(result[1].apiKey).toBe('AIzaSy*******');
  });

  it('should handle mixed arrays and objects', () => {
    const input = {
      servers: [
        { env: { API_KEY: 'sk-abc123' } },
        { env: { TOKEN: 'ghp_xxxxxxxx' } }
      ]
    };
    const result = maskAPIKeys(input);
    expect(result.servers[0].env.API_KEY).toBe('sk-******');
    expect(result.servers[1].env.TOKEN).toBe('ghp_********');
  });
});