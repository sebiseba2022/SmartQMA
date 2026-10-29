import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDateOnly, getCurrentDateInput } from './date';

describe('Date Utilities (SmartQMA Standard)', () => {
  describe('formatDateTime', () => {
    it('should return "-" when input is null or undefined', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime(undefined)).toBe('-');
      expect(formatDateTime('')).toBe('-');
    });

    it('should format valid ISO date strings properly', () => {
      // 2026-10-29T10:30:00.000Z
      const result = formatDateTime('2026-10-29T10:30:00.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result.startsWith('2026-10-29')).toBe(true);
    });

    it('should return raw string if the date string is not parseable', () => {
      expect(formatDateTime('invalid-date')).toBe('invalid-date');
    });
  });

  describe('formatDateOnly', () => {
    it('should return "-" when input is null or undefined', () => {
      expect(formatDateOnly(null)).toBe('-');
      expect(formatDateOnly(undefined)).toBe('-');
      expect(formatDateOnly('')).toBe('-');
    });

    it('should format date strings to YYYY-MM-DD', () => {
      const result = formatDateOnly('2026-10-29T14:15:00.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2026-10-29');
    });
  });

  describe('getCurrentDateInput', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const dateStr = getCurrentDateInput();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const now = new Date();
      const expectedYear = String(now.getFullYear());
      expect(dateStr.startsWith(expectedYear)).toBe(true);
    });
  });
});

