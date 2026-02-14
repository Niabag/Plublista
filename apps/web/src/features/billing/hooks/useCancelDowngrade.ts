import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';
import { SUBSCRIPTION_QUERY_KEY } from './useSubscription';

interface CancelDowngradeResponse {
  data: { canceled: boolean; currentTier: string };
}

export function useCancelDowngrade() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<CancelDowngradeResponse>('/api/billing/cancel-downgrade', {}),
    onSuccess: () => {
      toast.success('Pending downgrade canceled');
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to cancel downgrade');
    },
  });

  return {
    cancelDowngrade: mutation.mutate,
    isCanceling: mutation.isPending,
  };
}
