import { z } from 'zod';

export const checkoutSchema = z.object({
  tier: z.enum(['starter', 'pro', 'business', 'agency']),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
