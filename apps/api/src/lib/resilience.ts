import { AppError } from './errors';

interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        const message = err instanceof Error ? err.message : 'External API call failed';
        throw new AppError('EXTERNAL_API_ERROR', message, 502);
      }
      await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** attempt));
    }
  }

  throw new AppError('EXTERNAL_API_ERROR', 'Unreachable', 502);
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 30000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError('EXTERNAL_API_ERROR', `Operation timed out after ${timeoutMs}ms`, 504));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
