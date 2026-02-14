import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isWebpFile, convertWebpToJpg, convertMediaForPlatform } from './mediaConversion.service';

vi.mock('sharp', () => {
  const jpegMock = vi.fn().mockReturnThis();
  const toBufferMock = vi.fn().mockResolvedValue(Buffer.from('jpg-data'));
  const sharpFn = vi.fn(() => ({ jpeg: jpegMock, toBuffer: toBufferMock }));
  return { default: sharpFn };
});

const mockDownloadBuffer = vi.fn().mockResolvedValue(Buffer.from('webp-data'));
const mockUploadBuffer = vi.fn().mockResolvedValue(undefined);

vi.mock('./r2.service', () => ({
  downloadBuffer: (...args: unknown[]) => mockDownloadBuffer(...args),
  uploadBuffer: (...args: unknown[]) => mockUploadBuffer(...args),
}));

describe('isWebpFile', () => {
  it('returns true for .webp files', () => {
    expect(isWebpFile('users/1/uploads/image.webp')).toBe(true);
    expect(isWebpFile('IMAGE.WEBP')).toBe(true);
  });

  it('returns false for non-webp files', () => {
    expect(isWebpFile('users/1/uploads/image.jpg')).toBe(false);
    expect(isWebpFile('users/1/uploads/image.png')).toBe(false);
    expect(isWebpFile('users/1/uploads/file.webp.jpg')).toBe(false);
  });
});

describe('convertWebpToJpg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads, converts, and uploads the file', async () => {
    const result = await convertWebpToJpg('users/1/uploads/img.webp', 'user1', 'content1');

    expect(mockDownloadBuffer).toHaveBeenCalledWith('users/1/uploads/img.webp');
    expect(mockUploadBuffer).toHaveBeenCalledWith(
      expect.stringContaining('users/user1/converted/content1/'),
      expect.any(Buffer),
      'image/jpeg',
    );
    expect(result).toMatch(/users\/user1\/converted\/content1\/.*\.jpg$/);
  });
});

describe('convertMediaForPlatform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only converts webp files', async () => {
    const keys = ['users/1/a.webp', 'users/1/b.jpg', 'users/1/c.png'];
    const result = await convertMediaForPlatform(keys, 'user1', 'content1');

    expect(result.size).toBe(1);
    expect(result.has('users/1/a.webp')).toBe(true);
    expect(result.has('users/1/b.jpg')).toBe(false);
  });

  it('returns empty map when no webp files', async () => {
    const result = await convertMediaForPlatform(['a.jpg', 'b.png'], 'user1', 'content1');
    expect(result.size).toBe(0);
  });
});
