import { describe, it, expect } from 'vitest';
import { formatDuration, formatTotalDuration } from './videoMetadata';

describe('videoMetadata', () => {
  describe('formatDuration', () => {
    it('formats zero seconds', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('formats seconds under a minute', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('formats exact minutes', () => {
      expect(formatDuration(120)).toBe('2:00');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(145)).toBe('2:25');
    });

    it('pads seconds with leading zero', () => {
      expect(formatDuration(63)).toBe('1:03');
    });

    it('floors fractional seconds', () => {
      expect(formatDuration(90.7)).toBe('1:30');
    });
  });

  describe('formatTotalDuration', () => {
    it('formats total duration string', () => {
      expect(formatTotalDuration(145)).toBe('Total: 2:25 of raw footage');
    });

    it('formats zero total', () => {
      expect(formatTotalDuration(0)).toBe('Total: 0:00 of raw footage');
    });
  });
});
