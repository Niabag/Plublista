import { describe, it, expect } from 'vitest';
import {
  classifyError,
  PermanentPublishError,
  MediaFormatError,
} from './errors';

describe('classifyError', () => {
  it('classifies PermanentPublishError as permanent', () => {
    const err = new PermanentPublishError('token invalid');
    expect(classifyError(err)).toBe('permanent');
  });

  it('classifies MediaFormatError as format', () => {
    const err = new MediaFormatError('bad format', 'users/1/img.webp', 'jpg');
    expect(classifyError(err)).toBe('format');
  });

  it.each([
    'Rate limit exceeded',
    'Request timed out',
    'HTTP 502 Bad Gateway',
    'ECONNRESET',
    'Network error occurred',
    'Service temporarily unavailable',
  ])('classifies transient error: "%s"', (message) => {
    expect(classifyError(new Error(message))).toBe('transient');
  });

  it.each([
    'Unsupported image format',
    'Invalid media type',
    'Media type not supported',
    'webp not supported on this platform',
  ])('classifies format error: "%s"', (message) => {
    expect(classifyError(new Error(message))).toBe('format');
  });

  it.each([
    'Invalid credentials provided',
    'Unauthorized access',
    'Permission denied for this resource',
    'Content policy violation',
    'Access token invalid or expired',
    'Account suspended',
  ])('classifies permanent error: "%s"', (message) => {
    expect(classifyError(new Error(message))).toBe('permanent');
  });

  it('returns unknown for unrecognized errors', () => {
    expect(classifyError(new Error('Something weird happened'))).toBe('unknown');
  });
});
