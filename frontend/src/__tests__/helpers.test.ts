/**
 * Unit Tests — src/utils/helpers.ts
 *
 * Tests: formatDate, formatDateTime, capitalize, truncate,
 *        generateId, isEmpty, isValidEmail, formatNumber,
 *        calculatePercentage, safeJsonParse
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  capitalize,
  truncate,
  generateId,
  isEmpty,
  isValidEmail,
  formatNumber,
  calculatePercentage,
  safeJsonParse,
} from '../utils/helpers';

// ── formatDate ──────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats a Date object to a readable string', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(result).toMatch(/January\s+15,\s+2024/);
  });

  it('formats an ISO string the same as a Date object', () => {
    const fromString = formatDate('2024-06-01');
    const fromDate = formatDate(new Date('2024-06-01'));
    expect(fromString).toBe(fromDate);
  });
});

// ── formatDateTime ───────────────────────────────────────────────────────────
describe('formatDateTime', () => {
  it('includes the time in the output', () => {
    const result = formatDateTime('2024-01-15T14:30:00');
    expect(result).toMatch(/2024/);
    // Should contain AM/PM or hour digits
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ── capitalize ───────────────────────────────────────────────────────────────
describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('leaves already-capitalized strings unchanged', () => {
    expect(capitalize('World')).toBe('World');
  });

  it('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles single characters', () => {
    expect(capitalize('a')).toBe('A');
  });
});

// ── truncate ─────────────────────────────────────────────────────────────────
describe('truncate', () => {
  it('truncates a long string and adds ellipsis', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello...');
  });

  it('does not truncate when string is shorter than maxLength', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('does not truncate when exactly equal to maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('returns empty string for empty input', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ── generateId ───────────────────────────────────────────────────────────────
describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

// ── isEmpty ───────────────────────────────────────────────────────────────────
describe('isEmpty', () => {
  it('returns true for null', () => expect(isEmpty(null)).toBe(true));
  it('returns true for undefined', () => expect(isEmpty(undefined)).toBe(true));
  it('returns true for empty string', () => expect(isEmpty('')).toBe(true));
  it('returns true for whitespace-only string', () => expect(isEmpty('   ')).toBe(true));
  it('returns true for empty array', () => expect(isEmpty([])).toBe(true));
  it('returns true for empty object', () => expect(isEmpty({})).toBe(true));
  it('returns false for non-empty string', () => expect(isEmpty('hello')).toBe(false));
  it('returns false for non-empty array', () => expect(isEmpty([1])).toBe(false));
  it('returns false for non-empty object', () => expect(isEmpty({ a: 1 })).toBe(false));
  it('returns false for zero (falsy but not empty)', () => expect(isEmpty(0)).toBe(false));
});

// ── isValidEmail ──────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepts a valid email', () => expect(isValidEmail('user@example.com')).toBe(true));
  it('accepts email with subdomain', () => expect(isValidEmail('user@mail.mindsta.com')).toBe(true));
  it('accepts email with + alias', () => expect(isValidEmail('user+tag@example.com')).toBe(true));
  it('rejects email without @', () => expect(isValidEmail('userexample.com')).toBe(false));
  it('rejects email without domain', () => expect(isValidEmail('user@')).toBe(false));
  it('rejects email without TLD', () => expect(isValidEmail('user@example')).toBe(false));
  it('rejects empty string', () => expect(isValidEmail('')).toBe(false));
  it('rejects spaces', () => expect(isValidEmail('user @example.com')).toBe(false));
});

// ── formatNumber ──────────────────────────────────────────────────────────────
describe('formatNumber', () => {
  it('adds commas for thousands', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('formats millions correctly', () => {
    expect(formatNumber(1500000)).toBe('1,500,000');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles small numbers without commas', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

// ── calculatePercentage ────────────────────────────────────────────────────────
describe('calculatePercentage', () => {
  it('calculates 50%', () => expect(calculatePercentage(1, 2)).toBe(50));
  it('calculates 100%', () => expect(calculatePercentage(5, 5)).toBe(100));
  it('calculates 0% when value is 0', () => expect(calculatePercentage(0, 10)).toBe(0));
  it('returns 0 when total is 0 (no division by zero)', () => expect(calculatePercentage(5, 0)).toBe(0));
  it('rounds to nearest integer', () => expect(calculatePercentage(1, 3)).toBe(33));
});

// ── safeJsonParse ─────────────────────────────────────────────────────────────
describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"name":"Mindsta"}', null)).toEqual({ name: 'Mindsta' });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not-json', { error: true })).toEqual({ error: true });
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('', [])).toEqual([]);
  });

  it('parses arrays', () => {
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
  });
});
