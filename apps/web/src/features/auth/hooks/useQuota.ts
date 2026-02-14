import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';
import type { CreditUsage } from '@plublista/shared';

interface QuotaResponse {
  data: CreditUsage;
}

export const QUOTA_QUERY_KEY = ['quotas'] as const;

export function useQuota() {
  const query = useQuery({
    queryKey: QUOTA_QUERY_KEY,
    queryFn: () => apiGet<QuotaResponse>('/api/quotas'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
  });

  return {
    quota: query.data?.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
  };
}
