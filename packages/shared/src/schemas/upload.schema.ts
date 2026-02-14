import { z } from 'zod';

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_FILE_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES] as const;

export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  contentType: z.enum(ALLOWED_FILE_TYPES, {
    errorMap: () => ({ message: 'Unsupported file type. Allowed: MP4, MOV, WebM, JPG, PNG, WebP' }),
  }),
  fileSize: z.number().int().positive('File size must be positive'),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const MONTAGE_STYLES = ['dynamic', 'cinematic', 'ugc', 'tutorial', 'hype'] as const;
export const MONTAGE_FORMATS = ['9:16', '16:9', '1:1'] as const;
export const MONTAGE_DURATIONS = [15, 30, 60] as const;
export const MUSIC_OPTIONS = ['auto-match'] as const;

export const createContentItemSchema = z
  .object({
    type: z.enum(['reel', 'carousel', 'post']),
    title: z.string().max(255).optional(),
    mediaUrls: z.array(z.string().min(1)).min(1, 'At least one media file is required'),
    style: z.enum(MONTAGE_STYLES).optional(),
    format: z.enum(MONTAGE_FORMATS).optional(),
    duration: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(),
    music: z.enum(MUSIC_OPTIONS).optional(),
  })
  .refine((data) => data.type !== 'carousel' || data.mediaUrls.length >= 2, {
    message: 'Carousels require at least 2 slides',
    path: ['mediaUrls'],
  })
  .refine((data) => data.type !== 'carousel' || data.mediaUrls.length <= 20, {
    message: 'Carousels allow at most 20 slides',
    path: ['mediaUrls'],
  })
  .refine((data) => data.type !== 'post' || data.mediaUrls.length === 1, {
    message: 'Posts require exactly 1 image',
    path: ['mediaUrls'],
  });

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;
