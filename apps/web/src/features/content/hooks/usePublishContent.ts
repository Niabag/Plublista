import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';

interface PublishResponse {
  data: { publishJobIds: string[] };
}

const CONTENT_ITEM_QUERY_KEY = 'content-item';

export function usePublishContent(contentItemId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (platforms: string[]) =>
      apiPost<PublishResponse>(`/api/content-items/${contentItemId}/publish`, { platforms }),
    onSuccess: (_data, platforms) => {
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_QUERY_KEY, contentItemId] });
      queryClient.invalidateQueries({ queryKey: ['publish-status', contentItemId] });
      const msg =
        platforms.length === 1
          ? `Publishing to ${platforms[0]}...`
          : `Publishing to ${platforms.length} platforms...`;
      toast.success(msg);
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? 'Failed to publish');
    },
  });

  return {
    publish: mutation.mutate,
    isPending: mutation.isPending,
  };
}
