import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../utils';

describe('formatRelativeTime', () => {
  it('returns empty string for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatRelativeTime('')).toBe('');
  });

  it('formats past date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatRelativeTime(yesterday.toISOString());
    expect(result).toContain('day');
  });
});
