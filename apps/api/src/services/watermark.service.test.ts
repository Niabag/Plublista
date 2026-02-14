import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildWatermarkedKey, applyWatermark, applyWatermarkToAll } from './watermark.service';

vi.mock('sharp', () => {
  const metadataMock = vi.fn().mockResolvedValue({ width: 1080, height: 1080 });
  const compositeMock = vi.fn().mockReturnThis();
  const jpegMock = vi.fn().mockReturnThis();
  const toBufferMock = vi.fn().mockResolvedValue(Buffer.from('watermarked'));
  const sharpFn = vi.fn(() => ({
    metadata: metadataMock,
    composite: compositeMock,
    jpeg: jpegMock,
    toBuffer: toBufferMock,
  }));
  return { default: sharpFn };
});

vi.mock('qrcode', () => ({
  default: {
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('qr-png')),
  },
}));

const mockDownloadBuffer = vi.fn().mockResolvedValue(Buffer.from('original'));
const mockUploadBuffer = vi.fn().mockResolvedValue(undefined);

vi.mock('./r2.service', () => ({
  downloadBuffer: (...args: unknown[]) => mockDownloadBuffer(...args),
  uploadBuffer: (...args: unknown[]) => mockUploadBuffer(...args),
}));

describe('buildWatermarkedKey', () => {
  it('returns correct R2 path pattern', () => {
    const key = buildWatermarkedKey('user1', 'content1');
    expect(key).toMatch(/^users\/user1\/watermarked\/content1\/[\w-]+\.jpg$/);
  });

  it('supports custom extension', () => {
    const key = buildWatermarkedKey('user1', 'content1', 'png');
    expect(key).toMatch(/\.png$/);
  });
});

describe('applyWatermark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads, composites watermark with QR, and uploads to R2', async () => {
    const result = await applyWatermark('users/u1/uploads/photo.jpg', 'user1', 'content1');

    expect(mockDownloadBuffer).toHaveBeenCalledWith('users/u1/uploads/photo.jpg');
    expect(mockUploadBuffer).toHaveBeenCalledWith(
      expect.stringContaining('users/user1/watermarked/content1/'),
      expect.any(Buffer),
      'image/jpeg',
    );
    expect(result).toMatch(/^users\/user1\/watermarked\/content1\/.*\.jpg$/);
  });
});

describe('applyWatermarkToAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes all images in order', async () => {
    const keys = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    const results = await applyWatermarkToAll(keys, 'user1', 'content1');

    expect(results).toHaveLength(3);
    expect(mockDownloadBuffer).toHaveBeenCalledTimes(3);
    expect(mockUploadBuffer).toHaveBeenCalledTimes(3);
  });

  it('returns empty array for empty input', async () => {
    const results = await applyWatermarkToAll([], 'user1', 'content1');
    expect(results).toHaveLength(0);
    expect(mockDownloadBuffer).not.toHaveBeenCalled();
  });
});
