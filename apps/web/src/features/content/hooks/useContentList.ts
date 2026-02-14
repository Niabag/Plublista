import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import type { ContentItem } from '@plublista/shared';

interface ContentListResponse {
  data: ContentItem[];
}

export const CONTENT_LIST_QUERY_KEY = 'content-items' as const;

export function useContentList() {
  const query = useQuery({
    queryKey: [CONTENT_LIST_QUERY_KEY],
    queryFn: () => apiGet<ContentListResponse>('/api/content-items'),
  });

  return {
    items: query.data?.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
