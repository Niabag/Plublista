/**
 * Instagram API service for token exchange, profile fetching, and content publishing.
 * Uses the Instagram Login flow (not deprecated Basic Display API).
 */

import { AppError } from '../lib/errors';
import { withTimeout } from '../lib/resilience';

const FETCH_TIMEOUT_MS = 10_000;
const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramProfile {
  user_id: string;
  username: string;
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  clientSecret: string,
): Promise<LongLivedTokenResponse> {
  const url = new URL('https://graph.instagram.com/access_token');
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('access_token', shortLivedToken);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Failed to exchange for long-lived token: ${response.status}`);
  }

  return response.json() as Promise<LongLivedTokenResponse>;
}

export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const url = new URL('https://graph.instagram.com/me');
  url.searchParams.set('fields', 'user_id,username');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Instagram profile: ${response.status}`);
  }

  return response.json() as Promise<InstagramProfile>;
}

// --- Publishing functions ---

interface ContainerParams {
  image_url?: string;
  video_url?: string;
  caption?: string;
  media_type?: 'CAROUSEL' | 'REELS';
  is_carousel_item?: boolean;
  children?: string[];
}

interface ContainerResponse {
  id: string;
}

interface ContainerStatusResponse {
  status_code: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED';
  status?: string;
}

interface PublishResponse {
  id: string;
}

interface PermalinkResponse {
  permalink: string;
}

export async function createMediaContainer(
  accessToken: string,
  igUserId: string,
  params: ContainerParams,
): Promise<ContainerResponse> {
  return withTimeout(async () => {
    const url = new URL(`${GRAPH_API_BASE}/${igUserId}/media`);

    const body = new URLSearchParams();
    body.set('access_token', accessToken);
    if (params.image_url) body.set('image_url', params.image_url);
    if (params.video_url) body.set('video_url', params.video_url);
    if (params.caption) body.set('caption', params.caption);
    if (params.media_type) body.set('media_type', params.media_type);
    if (params.is_carousel_item) body.set('is_carousel_item', 'true');
    if (params.children) body.set('children', params.children.join(','));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new AppError(
        'EXTERNAL_API_ERROR',
        `Instagram container creation failed (${response.status}): ${errorBody}`,
        502,
      );
    }

    return response.json() as Promise<ContainerResponse>;
  }, 30_000);
}

export async function checkContainerStatus(
  accessToken: string,
  containerId: string,
): Promise<ContainerStatusResponse> {
  const url = new URL(`${GRAPH_API_BASE}/${containerId}`);
  url.searchParams.set('fields', 'status_code,status');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new AppError(
      'EXTERNAL_API_ERROR',
      `Instagram container status check failed: ${response.status}`,
      502,
    );
  }

  return response.json() as Promise<ContainerStatusResponse>;
}

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 40; // ~2 minutes max

export async function pollContainerUntilReady(
  accessToken: string,
  containerId: string,
): Promise<void> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const status = await checkContainerStatus(accessToken, containerId);

    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new AppError(
        'EXTERNAL_API_ERROR',
        `Instagram container processing failed: ${status.status ?? status.status_code}`,
        502,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new AppError('EXTERNAL_API_ERROR', 'Instagram container processing timed out', 504);
}

export async function publishContainer(
  accessToken: string,
  igUserId: string,
  containerId: string,
): Promise<PublishResponse> {
  return withTimeout(async () => {
    const url = new URL(`${GRAPH_API_BASE}/${igUserId}/media_publish`);

    const body = new URLSearchParams();
    body.set('access_token', accessToken);
    body.set('creation_id', containerId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new AppError(
        'EXTERNAL_API_ERROR',
        `Instagram publish failed (${response.status}): ${errorBody}`,
        502,
      );
    }

    return response.json() as Promise<PublishResponse>;
  }, 30_000);
}

export async function getMediaPermalink(
  accessToken: string,
  mediaId: string,
): Promise<string> {
  const url = new URL(`${GRAPH_API_BASE}/${mediaId}`);
  url.searchParams.set('fields', 'permalink');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new AppError(
      'EXTERNAL_API_ERROR',
      `Instagram permalink fetch failed: ${response.status}`,
      502,
    );
  }

  const data = (await response.json()) as PermalinkResponse;
  return data.permalink;
}
