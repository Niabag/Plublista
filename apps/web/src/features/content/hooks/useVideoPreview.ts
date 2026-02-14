import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

interface PreviewUrlResponse {
  data: { previewUrl: string };
}

export function useVideoPreview(contentItemId: string, hasGeneratedMedia: boolean) {
  const query = useQuery({
    queryKey: ['video-preview', contentItemId],
    queryFn: () =>
      apiGet<PreviewUrlResponse>(`/api/content-items/${contentItemId}/preview-url`),
    enabled: !!contentItemId && hasGeneratedMedia,
    staleTime: 50 * 60 * 1000, // 50 min (URL valid for 60 min)
  });

  return {
    previewUrl: query.data?.data?.previewUrl ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
