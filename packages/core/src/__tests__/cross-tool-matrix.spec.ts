/**
 * Cross-Tool Matrix Tests (S4-26)
 * Tests all supported migration combinations between the 4 tools
 */

import { describe, it, expect } from 'vitest';
import { MigrationService } from '../migration/migration-service.js';

describe('Cross-Tool Migration Matrix (S4-26)', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    migrationService = new MigrationService();
  });

  describe('Supported Migrations', () => {
    it('S4-26-001: should have translator for claude→opencode', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('claude→opencode')).toBe(true);
    });

    it('S4-26-002: should have translator for opencode→claude', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('opencode→claude')).toBe(true);
    });

    it('S4-26-003: should have translator for gemini→claude', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('gemini→claude')).toBe(true);
    });

    it('S4-26-004: should have translator for gemini→opencode', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('gemini→opencode')).toBe(true);
    });

    it('S4-26-005: should have translator for cursor→claude', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('cursor→claude')).toBe(true);
    });

    it('S4-26-006: should have translator for cursor→opencode', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('cursor→opencode')).toBe(true);
    });
  });

  describe('Unsupported Migrations', () => {
    it('S4-26-007: should NOT have translator for claude→gemini', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('claude→gemini')).toBe(false);
    });

    it('S4-26-008: should NOT have translator for opencode→cursor', () => {
      const translators = (migrationService as any).translators;
      expect(translators.has('opencode→cursor')).toBe(false);
    });
  });
});

import { beforeEach } from 'vitest';
