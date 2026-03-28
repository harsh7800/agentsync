import type { MappingEngineOptions } from './types.js';

interface CalculatorOptions {
  stringWeight?: number;
  semanticWeight?: number;
}

/**
 * SimilarityCalculator
 * 
 * Provides various string similarity algorithms for field matching.
 */
export class SimilarityCalculator {
  private options: CalculatorOptions;

  constructor(options?: CalculatorOptions) {
    this.options = {
      stringWeight: 0.6,
      semanticWeight: 0.4,
      ...options
    };
  }

  /**
   * Calculate similarity between two strings (0-100)
   */
  calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) {
      return 100;
    }

    const normalized1 = str1.toLowerCase();
    const normalized2 = str2.toLowerCase();

    if (normalized1 === normalized2) {
      return 100;
    }

    return this.combinedSimilarity(str1, str2);
  }

  /**
   * Calculate Levenshtein edit distance
   */
  levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Create distance matrix
    const d: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize first column and row
    for (let i = 0; i <= m; i++) {
      d[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      d[0][j] = j;
    }
    
    // Fill matrix
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= m; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,                   // deletion
          d[i][j - 1] + 1,                   // insertion
          d[i - 1][j - 1] + substitutionCost // substitution
        );
      }
    }
    
    return d[m][n];
  }

  /**
   * Calculate Jaro-Winkler similarity (0-1)
   */
  jaroWinklerSimilarity(str1: string, str2: string): number {
    const jaro = this.jaroSimilarity(str1, str2);
    const prefixScale = 0.1;
    const maxPrefix = 4;
    
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, maxPrefix); i++) {
      if (str1[i] === str2[i]) {
        prefix++;
      } else {
        break;
      }
    }
    
    return jaro + prefix * prefixScale * (1 - jaro);
  }

  /**
   * Calculate Jaro similarity (0-1)
   */
  private jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  }

  /**
   * Calculate semantic similarity (placeholder - returns string similarity)
   */
  semanticSimilarity(str1: string, str2: string): number {
    // For now, use Jaro-Winkler as a proxy for semantic similarity
    return this.jaroWinklerSimilarity(str1, str2);
  }

  /**
   * Combined similarity with weighted algorithms (0-100)
   */
  combinedSimilarity(str1: string, str2: string): number {
    const stringWeight = this.options.stringWeight ?? 0.6;
    const semanticWeight = this.options.semanticWeight ?? 0.4;
    
    const jaroScore = this.jaroWinklerSimilarity(str1, str2);
    const semanticScore = this.semanticSimilarity(str1, str2);
    
    const combined = jaroScore * stringWeight + semanticScore * semanticWeight;
    return Math.round(combined * 100);
  }
}
