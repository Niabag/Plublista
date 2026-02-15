import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import type { ContentItem } from '@publista/shared';

interface ContentListResponse {
  data: ContentItem[];
}

export const CALENDAR_CONTENT_QUERY_KEY = 'calendar-content' as const;

export function useCalendarContent(from: string, to: string) {
  const query = useQuery({
    queryKey: [CALENDAR_CONTENT_QUERY_KEY, from, to],
    queryFn: () =>
      apiGet<ContentListResponse>(
        `/api/content-items?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
  });

  return {
    items: query.data?.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
