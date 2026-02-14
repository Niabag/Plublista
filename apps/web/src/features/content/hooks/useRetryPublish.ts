import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';
import { CONTENT_LIST_QUERY_KEY } from './useContentList';

interface PublishResponse {
  data: { publishJobIds: string[] };
}

export function useRetryPublish() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ contentItemId, platforms }: { contentItemId: string; platforms: string[] }) =>
      apiPost<PublishResponse>(`/api/content-items/${contentItemId}/publish`, { platforms }),
    onSuccess: (_data, { contentItemId, platforms }) => {
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['content-item', contentItemId] });
      queryClient.invalidateQueries({ queryKey: ['publish-status', contentItemId] });
      const msg =
        platforms.length === 1
          ? `Retrying ${platforms[0]}...`
          : `Retrying ${platforms.length} platforms...`;
      toast.success(msg);
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? 'Failed to retry publish');
    },
  });

  return {
    retry: mutation.mutate,
    isPending: mutation.isPending,
  };
}
