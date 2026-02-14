import { z } from 'zod';

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
