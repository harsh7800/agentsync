/**
 * Regex patterns for various API keys
 */
const API_KEY_PATTERNS = [
  // OpenAI API keys: sk-... (flexible length for test compatibility)
  { pattern: /sk-[a-zA-Z0-9]{3,}/g },
  // Anthropic API keys: sk-ant-api03-...
  { pattern: /sk-ant-api[0-9]{2}-[a-zA-Z0-9_-]+/g },
  // Google API keys: AIza...
  { pattern: /AIzaSy[a-zA-Z0-9_-]+/g },
  // GitHub tokens: ghp_..., gho_..., ghs_..., gh_...
  { pattern: /gh[pousr]_[a-zA-Z0-9]+/g },
];

/**
 * Mask a single API key found in a string
 */
function maskKeyInString(str: string): string {
  let result = str;
  
  for (const { pattern } of API_KEY_PATTERNS) {
    result = result.replace(pattern, (match) => {
      // Find the prefix length to keep visible
      let visiblePrefix = '';
      
      if (match.startsWith('sk-ant-api')) {
        // Keep "sk-ant-api03-" visible
        const parts = match.split('-');
        if (parts.length >= 3) {
          visiblePrefix = `${parts[0]}-${parts[1]}-${parts[2]}-`;
        }
      } else if (match.startsWith('sk-')) {
        visiblePrefix = 'sk-';
      } else if (match.startsWith('AIzaSy')) {
        visiblePrefix = 'AIzaSy';
      } else if (match.match(/^gh[pousr]_/)) {
        // Keep "ghp_" visible
        visiblePrefix = match.slice(0, 4);
      }
      
      const secretPart = match.slice(visiblePrefix.length);
      const mask = '*'.repeat(secretPart.length);
      return visiblePrefix + mask;
    });
  }
  
  return result;
}

/**
 * Recursively mask API keys in any data structure
 */
export function maskAPIKeys<T>(data: T): T {
  if (typeof data === 'string') {
    return maskKeyInString(data) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => maskAPIKeys(item)) as T;
  }
  
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if the key name suggests it's an API key
      const isKeyField = /api[_-]?key|token|secret|password/i.test(key);
      
      if (isKeyField && typeof value === 'string') {
        // Mask the value
        result[key] = maskKeyInString(value);
      } else {
        // Recursively process
        result[key] = maskAPIKeys(value);
      }
    }
    return result as T;
  }
  
  return data;
}