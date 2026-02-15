import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock execFileAsync via the promisify.custom symbol
const mockExecFileAsync = vi.fn();

vi.mock('node:child_process', () => ({
  execFile: Object.assign(vi.fn(), {
    [Symbol.for('nodejs.util.promisify.custom')]: mockExecFileAsync,
  }),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake')),
  },
}));

describe('ffmpeg.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectTransition', () => {
    it('returns dissolve for calm audio (< -25 dB)', async () => {
      const { selectTransition } = await import('./ffmpeg.service');
      expect(selectTransition(-30)).toEqual({ xfade: 'dissolve', duration: 0.8 });
      expect(selectTransition(-26)).toEqual({ xfade: 'dissolve', duration: 0.8 });
    });

    it('returns slideleft for medium audio (-25 to -15 dB)', async () => {
      const { selectTransition } = await import('./ffmpeg.service');
      expect(selectTransition(-20)).toEqual({ xfade: 'slideleft', duration: 0.4 });
      expect(selectTransition(-25)).toEqual({ xfade: 'slideleft', duration: 0.4 });
    });

    it('returns hard cut for intense audio (> -15 dB)', async () => {
      const { selectTransition } = await import('./ffmpeg.service');
      expect(selectTransition(-10)).toEqual({ xfade: 'fade', duration: 0.01 });
      expect(selectTransition(-15)).toEqual({ xfade: 'fade', duration: 0.01 });
      expect(selectTransition(0)).toEqual({ xfade: 'fade', duration: 0.01 });
    });
  });

  describe('detectSilence', () => {
    it('parses silence_start and silence_end from FFmpeg stderr', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: '',
        stderr: [
          '[silencedetect @ 0x1234] silence_start: 2.5',
          '[silencedetect @ 0x1234] silence_end: 3.8 | silence_duration: 1.3',
          '[silencedetect @ 0x1234] silence_start: 10.0',
          '[silencedetect @ 0x1234] silence_end: 11.2 | silence_duration: 1.2',
        ].join('\n'),
      });

      const { detectSilence } = await import('./ffmpeg.service');
      const result = await detectSilence('/tmp/clip.mp4');

      expect(result).toEqual([
        { startSec: 2.5, endSec: 3.8 },
        { startSec: 10.0, endSec: 11.2 },
      ]);
    });

    it('returns empty array when no silence detected', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: '',
        stderr: 'some ffmpeg output without silence markers',
      });

      const { detectSilence } = await import('./ffmpeg.service');
      const result = await detectSilence('/tmp/clip.mp4');
      expect(result).toEqual([]);
    });
  });

  describe('getRmsProfile', () => {
    it('parses ebur128 momentary loudness values into windows', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: '',
        stderr: [
          '[Parsed_ebur128_0 @ 0xabc] t: 0.1     TARGET:-23 LUFS    M: -20.5 S: -22.0',
          '[Parsed_ebur128_0 @ 0xabc] t: 0.2     TARGET:-23 LUFS    M: -21.0 S: -21.5',
          '[Parsed_ebur128_0 @ 0xabc] t: 0.6     TARGET:-23 LUFS    M: -18.0 S: -19.5',
          '[Parsed_ebur128_0 @ 0xabc] t: 0.7     TARGET:-23 LUFS    M: -17.5 S: -18.0',
        ].join('\n'),
      });

      const { getRmsProfile } = await import('./ffmpeg.service');
      const result = await getRmsProfile('/tmp/clip.mp4', 0.5);

      // Window [0, 0.5): t=0.1 (-20.5) and t=0.2 (-21.0) → avg -20.75
      // Window [0.5, 1.0): t=0.6 (-18.0) and t=0.7 (-17.5) → avg -17.75
      expect(result).toHaveLength(2);
      expect(result[0].timeSec).toBe(0);
      expect(result[0].rmsDb).toBeCloseTo(-20.75, 1);
      expect(result[1].timeSec).toBe(0.5);
      expect(result[1].rmsDb).toBeCloseTo(-17.75, 1);
    });
  });

  describe('getNativeFramerate', () => {
    it('parses fractional framerate from ffprobe', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '30000/1001\n', stderr: '' });

      const { getNativeFramerate } = await import('./ffmpeg.service');
      const fps = await getNativeFramerate('/tmp/clip.mp4');
      expect(fps).toBeCloseTo(29.97, 1);
    });

    it('falls back to 30fps for invalid output', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: 'N/A\n', stderr: '' });

      const { getNativeFramerate } = await import('./ffmpeg.service');
      const fps = await getNativeFramerate('/tmp/clip.mp4');
      expect(fps).toBe(30);
    });
  });

  describe('getVideoDuration', () => {
    it('parses duration from ffprobe', async () => {
      mockExecFileAsync.mockResolvedValue({ stdout: '42.567\n', stderr: '' });

      const { getVideoDuration } = await import('./ffmpeg.service');
      const duration = await getVideoDuration('/tmp/clip.mp4');
      expect(duration).toBeCloseTo(42.567, 2);
    });
  });
});
