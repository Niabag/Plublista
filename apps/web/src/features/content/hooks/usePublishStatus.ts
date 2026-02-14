import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

interface PublishJob {
  id: string;
  platform: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'retrying';
  publishedUrl: string | null;
  errorMessage: string | null;
  attemptCount: number;
  publishedAt: string | null;
  createdAt: string;
}

interface PublishStatusResponse {
  data: PublishJob[];
}

export function usePublishStatus(contentItemId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['publish-status', contentItemId],
    queryFn: () => apiGet<PublishStatusResponse>(`/api/content-items/${contentItemId}/publish-status`),
    enabled,
    refetchInterval: (query) => {
      const jobs = query.state.data?.data;
      if (!jobs || jobs.length === 0) return false;
      // Keep polling while any job is pending/publishing/retrying
      const hasActive = jobs.some(
        (j) => j.status === 'pending' || j.status === 'publishing' || j.status === 'retrying',
      );
      return hasActive ? 3000 : false;
    },
  });

  const jobs = query.data?.data ?? [];
  const latestJob = jobs[0] ?? null;

  return {
    jobs,
    latestJob,
    isPending: query.isPending,
    refetch: query.refetch,
  };
}
