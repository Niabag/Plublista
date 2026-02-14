import type { SubscriptionTier } from '@plublista/shared';
import { UPLOAD_LIMITS } from '@plublista/shared';
import { generatePresignedUploadUrl } from '../../services/r2.service';
import { AppError } from '../../lib/errors';

export async function requestPresignedUrl(
  userId: string,
  tier: SubscriptionTier,
  body: { fileName: string; contentType: string; fileSize: number },
) {
  const limits = UPLOAD_LIMITS[tier];

  // Validate file size against tier limits
  if (body.fileSize > limits.maxFileSizeBytes) {
    throw new AppError(
      'FILE_TOO_LARGE',
      `File size exceeds ${limits.maxFileSizeMB}MB limit for ${tier} tier. Upgrade your plan for larger uploads.`,
      413,
    );
  }

  const result = await generatePresignedUploadUrl(userId, body.fileName, body.contentType);
  return result;
}
