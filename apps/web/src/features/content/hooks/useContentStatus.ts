import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import type { ContentItemStatusResponse } from '@publista/shared';

interface StatusResponse {
  data: ContentItemStatusResponse;
}

export const CONTENT_STATUS_QUERY_KEY = 'content-status' as const;

export function useContentStatus(contentItemId: string) {
  const query = useQuery({
    queryKey: [CONTENT_STATUS_QUERY_KEY, contentItemId],
    queryFn: () =>
      apiGet<StatusResponse>(`/api/content-items/${contentItemId}/status`),
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;
      if (status === 'draft' || status === 'failed') return false;
      return 3000;
    },
  });

  return {
    status: query.data?.data.status ?? null,
    generatedMediaUrl: query.data?.data.generatedMediaUrl ?? null,
    isPending: query.isPending,
    isError: query.isError,
  };
}
