import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/apiClient';
import { toast } from 'sonner';
import type { UpdateContentTextInput, ContentItem } from '@plublista/shared';
import { CONTENT_ITEM_QUERY_KEY } from './useContentItem';

interface ContentItemResponse {
  data: ContentItem;
}

export function useContentEdit(contentItemId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: UpdateContentTextInput) =>
      apiPatch<ContentItemResponse>(
        `/api/content-items/${contentItemId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CONTENT_ITEM_QUERY_KEY, contentItemId],
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to save changes');
    },
  });

  return {
    updateContent: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
