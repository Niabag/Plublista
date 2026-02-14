export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'facebook' | 'linkedin' | 'x';

export type PlatformConnectionStatus = 'connected' | 'disconnected' | 'error' | 'coming_soon';

export interface PlatformConnection {
  id: string;
  platform: Platform;
  platformUserId: string;
  platformUsername: string;
  connectedAt: string;
  tokenExpiresAt: string | null;
}
