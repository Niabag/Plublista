import { z } from 'zod';

export const updateContentTextSchema = z
  .object({
    caption: z.string().max(2200).optional(),
    hashtags: z
      .array(z.string().max(50).regex(/^[\w]+$/, 'Hashtags must be alphanumeric or underscores'))
      .max(30)
      .optional(),
    hookText: z.string().max(500).optional(),
    ctaText: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      data.caption !== undefined ||
      data.hashtags !== undefined ||
      data.hookText !== undefined ||
      data.ctaText !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateContentTextInput = z.infer<typeof updateContentTextSchema>;

export const imageGenerationSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
});

export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;

export const platformEnum = z.enum(['instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x']);

export const publishContentSchema = z.object({
  platforms: z.array(platformEnum).min(1).max(6),
});

export type PublishContentInput = z.infer<typeof publishContentSchema>;

export const scheduleContentSchema = z.object({
  platforms: z.array(platformEnum).min(1).max(6),
  scheduledAt: z.string().datetime(),
});

export type ScheduleContentInput = z.infer<typeof scheduleContentSchema>;

export const rescheduleContentSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type RescheduleContentInput = z.infer<typeof rescheduleContentSchema>;
