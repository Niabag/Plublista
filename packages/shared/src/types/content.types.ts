export type ContentType = 'reel' | 'carousel' | 'post';

export type ContentStatus = 'draft' | 'generating' | 'scheduled' | 'published' | 'failed' | 'retrying';

export interface ContentItem {
  id: string;
  userId: string;
  type: ContentType;
  title: string | null;
  status: ContentStatus;
  style: string | null;
  format: string | null;
  duration: number | null;
  mediaUrls: string[];
  generatedMediaUrl: string | null;
  caption: string | null;
  hashtags: string[];
  hookText: string | null;
  ctaText: string | null;
  musicUrl: string | null;
  musicPrompt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RenderJobData {
  userId: string;
  contentItemId: string;
  clipUrls: string[];
  style: string;
  format: string;
  duration: number;
  musicPrompt: string;
}

export interface ContentItemStatusResponse {
  status: ContentStatus;
  generatedMediaUrl: string | null;
}
