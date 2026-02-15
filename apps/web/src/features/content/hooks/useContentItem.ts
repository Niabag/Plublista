import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import type { ContentItem } from '@publista/shared';

interface ContentItemResponse {
  data: ContentItem;
}

export const CONTENT_ITEM_QUERY_KEY = 'content-item' as const;

export function useContentItem(contentItemId: string) {
  const query = useQuery({
    queryKey: [CONTENT_ITEM_QUERY_KEY, contentItemId],
    queryFn: () =>
      apiGet<ContentItemResponse>(`/api/content-items/${contentItemId}`),
    enabled: !!contentItemId,
  });

  return {
    item: query.data?.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
