export class PermanentPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentPublishError';
  }
}

export class PermanentRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentRenderError';
  }
}

export class MediaFormatError extends Error {
  public readonly originalFileKey: string;
  public readonly suggestedFormat: string;

  constructor(message: string, originalFileKey: string, suggestedFormat: string) {
    super(message);
    this.name = 'MediaFormatError';
    this.originalFileKey = originalFileKey;
    this.suggestedFormat = suggestedFormat;
  }
}

const TRANSIENT_PATTERNS = [
  /rate.?limit/i,
  /too many requests/i,
  /timeout/i,
  /timed out/i,
  /5\d{2}/,
  /ECONNRESET/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
  /network/i,
  /temporarily unavailable/i,
  /service unavailable/i,
];

const FORMAT_PATTERNS = [
  /unsupported.*format/i,
  /invalid.*media/i,
  /media.*type.*not.*supported/i,
  /invalid image/i,
  /unsupported.*image/i,
  /webp.*not.*supported/i,
];

const FFMPEG_PERMANENT_PATTERNS = [
  /Invalid data found/i,
  /Codec.*not found/i,
  /No such file or directory/i,
  /Invalid argument/i,
  /does not contain any stream/i,
  /Output file.*is empty/i,
];

const PERMANENT_PATTERNS = [
  /invalid.*credentials/i,
  /unauthorized/i,
  /permission.*denied/i,
  /content.*policy/i,
  /copyright/i,
  /account.*suspended/i,
  /token.*expired/i,
  /access.*token.*invalid/i,
];

export type ErrorCategory = 'transient' | 'format' | 'permanent' | 'unknown';

export function classifyError(error: Error): ErrorCategory {
  if (error instanceof PermanentPublishError) return 'permanent';
  if (error instanceof PermanentRenderError) return 'permanent';
  if (error instanceof MediaFormatError) return 'format';

  const msg = error.message;

  for (const pattern of FORMAT_PATTERNS) {
    if (pattern.test(msg)) return 'format';
  }
  for (const pattern of FFMPEG_PERMANENT_PATTERNS) {
    if (pattern.test(msg)) return 'permanent';
  }
  for (const pattern of PERMANENT_PATTERNS) {
    if (pattern.test(msg)) return 'permanent';
  }
  for (const pattern of TRANSIENT_PATTERNS) {
    if (pattern.test(msg)) return 'transient';
  }

  return 'unknown';
}
