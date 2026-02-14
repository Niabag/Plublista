import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiDelete } from '@/lib/apiClient';
import { toast } from 'sonner';

interface ScheduleResponse {
  data: { publishJobIds: string[]; scheduledAt: string };
}

interface ScheduleInput {
  scheduledAt: string;
  platforms: string[];
}

const CONTENT_ITEM_QUERY_KEY = 'content-item';

export function useScheduleContent(contentItemId: string) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_QUERY_KEY, contentItemId] });
    queryClient.invalidateQueries({ queryKey: ['publish-status', contentItemId] });
  };

  const scheduleMutation = useMutation({
    mutationFn: (input: ScheduleInput) =>
      apiPost<ScheduleResponse>(`/api/content-items/${contentItemId}/schedule`, input),
    onSuccess: (data) => {
      invalidateAll();
      const date = new Date(data.data.scheduledAt);
      const formatted = date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      toast.success(`Scheduled for ${formatted}`);
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      toast.error(apiError.message ?? 'Failed to schedule content');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiDelete(`/api/content-items/${contentItemId}/schedule`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Schedule cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel schedule');
    },
  });

  return {
    schedule: scheduleMutation.mutate,
    isScheduling: scheduleMutation.isPending,
    cancelSchedule: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}
