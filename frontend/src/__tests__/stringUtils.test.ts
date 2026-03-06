/**
 * Unit Tests — src/lib/stringUtils.ts
 *
 * Tests: capitalizeWords, capitalizeFirst, formatUserName
 */

import { describe, it, expect } from 'vitest';
import { capitalizeWords, capitalizeFirst, formatUserName } from '../lib/stringUtils';

// ── capitalizeWords ──────────────────────────────────────────────────────────
describe('capitalizeWords', () => {
  it('capitalizes the first letter of every word', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('lowercases the rest of each word', () => {
    expect(capitalizeWords('JOHN DOE')).toBe('John Doe');
  });

  it('handles mixed case', () => {
    expect(capitalizeWords('fIRST lAST')).toBe('First Last');
  });

  it('handles single word', () => {
    expect(capitalizeWords('mindsta')).toBe('Mindsta');
  });

  it('returns empty string for empty input', () => {
    expect(capitalizeWords('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(capitalizeWords(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(capitalizeWords(undefined)).toBe('');
  });

  it('handles multiple spaces between words', () => {
    const result = capitalizeWords('john  doe');
    // Each token is capitalized; empty token becomes empty string
    expect(result).toContain('John');
    expect(result).toContain('Doe');
  });
});

// ── capitalizeFirst ──────────────────────────────────────────────────────────
describe('capitalizeFirst', () => {
  it('capitalizes only the very first letter', () => {
    expect(capitalizeFirst('hello world')).toBe('Hello world');
  });

  it('does not change remaining characters', () => {
    expect(capitalizeFirst('hELLO')).toBe('HELLO');
  });

  it('returns empty string for empty input', () => {
    expect(capitalizeFirst('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(capitalizeFirst(null)).toBe('');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A');
  });
});

// ── formatUserName ───────────────────────────────────────────────────────────
describe('formatUserName', () => {
  it('properly formats a lowercase name', () => {
    expect(formatUserName('john doe')).toBe('John Doe');
  });

  it('properly formats an all-caps name', () => {
    expect(formatUserName('JANE SMITH')).toBe('Jane Smith');
  });

  it('trims leading and trailing whitespace', () => {
    expect(formatUserName('  alice  ')).toBe('Alice');
  });

  it('returns empty string for null', () => {
    expect(formatUserName(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatUserName(undefined)).toBe('');
  });

  it('handles single-word names', () => {
    expect(formatUserName('MINDSTA')).toBe('Mindsta');
  });
});
