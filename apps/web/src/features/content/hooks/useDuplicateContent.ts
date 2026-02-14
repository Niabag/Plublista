import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';
import { CONTENT_LIST_QUERY_KEY } from './useContentList';
import { CALENDAR_CONTENT_QUERY_KEY } from '@/features/calendar/hooks/useCalendarContent';

export function useDuplicateContent() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (contentItemId: string) =>
      apiPost(`/api/content-items/${contentItemId}/duplicate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CALENDAR_CONTENT_QUERY_KEY] });
      toast.success('Content duplicated');
    },
    onError: (error: { code?: string; message?: string }) => {
      if (error.code === 'QUOTA_EXCEEDED') {
        toast.error(error.message ?? 'Not enough credits. Upgrade your plan for more.');
      } else {
        toast.error(error.message ?? 'Failed to duplicate content');
      }
    },
  });

  return {
    duplicateContent: mutation.mutate,
    isDuplicating: mutation.isPending,
  };
}
