import { describe, it, expect, vi } from 'vitest';
import { withRetry, withTimeout } from './resilience';

describe('resilience', () => {
  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await withRetry(fn);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('ok');

      const result = await withRetry(fn, { maxRetries: 3, backoffMs: 10 });
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw AppError after all retries exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(withRetry(fn, { maxRetries: 2, backoffMs: 10 })).rejects.toMatchObject({
        code: 'EXTERNAL_API_ERROR',
        statusCode: 502,
      });
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('withTimeout', () => {
    it('should return result when within timeout', async () => {
      const fn = vi.fn().mockResolvedValue('fast');
      const result = await withTimeout(fn, 5000);
      expect(result).toBe('fast');
    });

    it('should throw AppError on timeout', async () => {
      const fn = () => new Promise((resolve) => setTimeout(resolve, 5000));

      await expect(withTimeout(fn, 50)).rejects.toMatchObject({
        code: 'EXTERNAL_API_ERROR',
        statusCode: 504,
      });
    });

    it('should propagate error from function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('inner error'));

      await expect(withTimeout(fn, 5000)).rejects.toThrow('inner error');
    });
  });
});
