/**
 * Ayrshare API service for multi-platform social media publishing.
 * Uses a single platform API key with per-user profile keys.
 */

import { AppError } from '../lib/errors';
import { withTimeout } from '../lib/resilience';

const AYRSHARE_BASE = 'https://app.ayrshare.com/api';
const TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = process.env.AYRSHARE_API_KEY;
  if (!key) {
    throw new AppError('INTERNAL_ERROR', 'AYRSHARE_API_KEY is not configured', 500);
  }
  return key;
}

function buildHeaders(profileKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
  if (profileKey) {
    headers['Profile-Key'] = profileKey;
  }
  return headers;
}

// --- Profile Management ---

export interface AyrshareProfile {
  profileKey: string;
  refUrl: string;
  title: string;
}

export async function createProfile(userId: string): Promise<AyrshareProfile> {
  return withTimeout(async () => {
    const res = await fetch(`${AYRSHARE_BASE}/profiles/profile`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ title: userId }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AppError('EXTERNAL_API_ERROR', `Ayrshare profile creation failed: ${body}`, 502);
    }

    const data = (await res.json()) as { profileKey: string; refUrl: string; title: string };
    return {
      profileKey: data.profileKey,
      refUrl: data.refUrl,
      title: data.title,
    };
  }, TIMEOUT_MS);
}

export interface AyrshareConnectedPlatform {
  platform: string;
  connected: boolean;
}

export async function getConnectedPlatforms(profileKey: string): Promise<string[]> {
  return withTimeout(async () => {
    const res = await fetch(`${AYRSHARE_BASE}/user`, {
      method: 'GET',
      headers: buildHeaders(profileKey),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AppError('EXTERNAL_API_ERROR', `Ayrshare user fetch failed: ${body}`, 502);
    }

    const data = (await res.json()) as { activeSocialAccounts?: string[] };
    return data.activeSocialAccounts ?? [];
  }, TIMEOUT_MS);
}

// --- Publishing ---

export interface AyrsharePostParams {
  post: string;
  platforms: string[];
  mediaUrls: string[];
  shortsYouTube?: boolean;
  videoTitle?: string;
}

export interface AyrsharePostResult {
  platform: string;
  status: 'success' | 'error';
  postUrl?: string;
  id?: string;
  error?: string;
}

export interface AyrsharePostResponse {
  id: string;
  postIds: AyrsharePostResult[];
}

export async function publishPost(
  profileKey: string,
  params: AyrsharePostParams,
): Promise<AyrsharePostResponse> {
  return withTimeout(async () => {
    const body: Record<string, unknown> = {
      post: params.post,
      platforms: params.platforms,
      mediaUrls: params.mediaUrls,
    };

    if (params.shortsYouTube) {
      body.shortsYouTube = true;
    }
    if (params.videoTitle) {
      body.youTubeOptions = { title: params.videoTitle };
    }

    const res = await fetch(`${AYRSHARE_BASE}/post`, {
      method: 'POST',
      headers: buildHeaders(profileKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AppError('EXTERNAL_API_ERROR', `Ayrshare publish failed: ${text}`, 502);
    }

    const data = (await res.json()) as {
      id?: string;
      postIds?: Array<{ platform?: string; status?: string; postUrl?: string; id?: string; error?: string }>;
    };

    // Normalize Ayrshare's response into a consistent format
    const postIds: AyrsharePostResult[] = (data.postIds ?? []).map(
      (p: { platform?: string; status?: string; postUrl?: string; id?: string; error?: string }) => ({
        platform: p.platform ?? '',
        status: p.status === 'success' ? 'success' : 'error',
        postUrl: p.postUrl,
        id: p.id,
        error: p.error,
      }),
    );

    return {
      id: data.id ?? '',
      postIds,
    };
  }, TIMEOUT_MS);
}

// --- Status & Retry ---

export async function getPostStatus(
  profileKey: string,
  ayrsharePostId: string,
): Promise<AyrsharePostResponse> {
  return withTimeout(async () => {
    const res = await fetch(`${AYRSHARE_BASE}/post/${ayrsharePostId}`, {
      method: 'GET',
      headers: buildHeaders(profileKey),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AppError('EXTERNAL_API_ERROR', `Ayrshare status fetch failed: ${body}`, 502);
    }

    const data = (await res.json()) as { id?: string; postIds?: AyrsharePostResult[] };
    return {
      id: data.id ?? ayrsharePostId,
      postIds: data.postIds ?? [],
    };
  }, TIMEOUT_MS);
}

export async function retryPost(
  profileKey: string,
  ayrsharePostId: string,
): Promise<AyrsharePostResponse> {
  return withTimeout(async () => {
    const res = await fetch(`${AYRSHARE_BASE}/post/${ayrsharePostId}`, {
      method: 'PUT',
      headers: buildHeaders(profileKey),
      body: JSON.stringify({ retry: true }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new AppError('EXTERNAL_API_ERROR', `Ayrshare retry failed: ${body}`, 502);
    }

    const data = (await res.json()) as { id?: string; postIds?: AyrsharePostResult[] };
    return {
      id: data.id ?? ayrsharePostId,
      postIds: data.postIds ?? [],
    };
  }, TIMEOUT_MS);
}
