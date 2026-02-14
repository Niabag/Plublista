import type { SubscriptionTier } from '../types/user.types.js';

export interface TierUploadLimits {
  maxFileSizeBytes: number;
  maxFileSizeMB: number;
}

export const UPLOAD_LIMITS: Record<SubscriptionTier, TierUploadLimits> = {
  free: { maxFileSizeBytes: 200 * 1024 * 1024, maxFileSizeMB: 200 },
  starter: { maxFileSizeBytes: 500 * 1024 * 1024, maxFileSizeMB: 500 },
  pro: { maxFileSizeBytes: 1024 * 1024 * 1024, maxFileSizeMB: 1024 },
  business: { maxFileSizeBytes: 5 * 1024 * 1024 * 1024, maxFileSizeMB: 5120 },
  agency: { maxFileSizeBytes: 10 * 1024 * 1024 * 1024, maxFileSizeMB: 10240 },
};
