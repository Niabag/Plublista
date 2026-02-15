import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/apiClient';
import { toast } from 'sonner';
import type { ContentItem } from '@publista/shared';
import { CALENDAR_CONTENT_QUERY_KEY } from './useCalendarContent';
import { CONTENT_LIST_QUERY_KEY } from '@/features/content/hooks/useContentList';

interface RescheduleResponse {
  data: ContentItem;
}

export function useReschedule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ itemId, scheduledAt }: { itemId: string; scheduledAt: string }) =>
      apiPatch<RescheduleResponse>(`/api/content-items/${itemId}/reschedule`, {
        scheduledAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_CONTENT_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_QUERY_KEY] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to reschedule content');
      queryClient.invalidateQueries({ queryKey: [CALENDAR_CONTENT_QUERY_KEY] });
    },
  });

  return {
    reschedule: mutation.mutate,
    isRescheduling: mutation.isPending,
  };
}
