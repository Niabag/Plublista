import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useContentStatus, CONTENT_STATUS_QUERY_KEY } from './useContentStatus';

const mockApiGet = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useContentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API with correct content item ID', async () => {
    mockApiGet.mockResolvedValue({
      data: { status: 'generating', generatedMediaUrl: null },
    });

    renderHook(() => useContentStatus('item-abc-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/api/content-items/item-abc-123/status');
    });
  });

  it('returns status and generatedMediaUrl from API response', async () => {
    mockApiGet.mockResolvedValue({
      data: { status: 'draft', generatedMediaUrl: 'https://example.com/video.mp4' },
    });

    const { result } = renderHook(() => useContentStatus('item-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('draft');
      expect(result.current.generatedMediaUrl).toBe('https://example.com/video.mp4');
    });
  });

  it('returns null values while pending', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useContentStatus('item-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBeNull();
    expect(result.current.generatedMediaUrl).toBeNull();
    expect(result.current.isPending).toBe(true);
  });

  it('exports the correct query key constant', () => {
    expect(CONTENT_STATUS_QUERY_KEY).toBe('content-status');
  });
});
