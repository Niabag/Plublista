// Types
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  PaginatedResponse,
} from './types/api.types.js';

export type { User, UserRole, SubscriptionTier } from './types/user.types.js';

export type { Platform, PlatformConnection, PlatformConnectionStatus } from './types/platformConnection.types.js';

export type { QuotaResource, QuotaUsage } from './types/quota.types.js';

export type { ContentType, ContentStatus, ContentItem, RenderJobData, ContentItemStatusResponse } from './types/content.types.js';

// Schemas
export { loginSchema, registerSchema } from './schemas/auth.schema.js';
export type { LoginInput, RegisterInput } from './schemas/auth.schema.js';

export { profileUpdateSchema } from './schemas/profile.schema.js';
export type { ProfileUpdateInput } from './schemas/profile.schema.js';

export {
  presignedUrlRequestSchema,
  createContentItemSchema,
  ALLOWED_FILE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
} from './schemas/upload.schema.js';
export type { PresignedUrlRequest, CreateContentItemInput } from './schemas/upload.schema.js';

export { updateContentTextSchema, imageGenerationSchema, publishContentSchema, scheduleContentSchema, platformEnum } from './schemas/content.schema.js';
export type { UpdateContentTextInput, ImageGenerationInput, PublishContentInput, ScheduleContentInput } from './schemas/content.schema.js';

// Constants
export { ERROR_CODES } from './constants/errorCodes.js';
export type { ErrorCode } from './constants/errorCodes.js';

export { QUOTA_LIMITS } from './constants/quotaLimits.js';
export type { TierQuotaLimits } from './constants/quotaLimits.js';

export { UPLOAD_LIMITS } from './constants/uploadLimits.js';
export type { TierUploadLimits } from './constants/uploadLimits.js';
