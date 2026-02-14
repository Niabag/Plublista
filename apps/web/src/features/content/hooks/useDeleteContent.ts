import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@/lib/apiClient';
import { toast } from 'sonner';
import { CONTENT_LIST_QUERY_KEY } from './useContentList';
import { CALENDAR_CONTENT_QUERY_KEY } from '@/features/calendar/hooks/useCalendarContent';

export function useDeleteContent() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (contentItemId: string) =>
      apiDelete(`/api/content-items/${contentItemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CALENDAR_CONTENT_QUERY_KEY] });
      toast.success('Content deleted');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to delete content');
    },
  });

  return {
    deleteContent: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}
