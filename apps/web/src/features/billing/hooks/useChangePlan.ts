import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';
import type { SubscriptionTier } from '@publista/shared';
import { PRICING_CONFIG } from '@publista/shared';
import { SUBSCRIPTION_QUERY_KEY } from './useSubscription';
import { SESSION_QUERY_KEY } from '@/features/auth/hooks/useAuth';

interface ChangePlanResponse {
  data: {
    direction: 'upgrade' | 'downgrade';
    newTier: string;
    effectiveNow: boolean;
    effectiveDate?: string;
  };
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (tier: Exclude<SubscriptionTier, 'free'>) =>
      apiPost<ChangePlanResponse>('/api/billing/change-plan', { tier }),
    onSuccess: (response) => {
      const { direction, newTier, effectiveDate } = response.data;
      const tierName = PRICING_CONFIG[newTier as SubscriptionTier]?.name ?? newTier;

      if (direction === 'upgrade') {
        toast.success(`Plan updated to ${tierName}`);
      } else {
        const date = effectiveDate ? new Date(effectiveDate).toLocaleDateString() : '';
        toast.success(`Downgrade to ${tierName} scheduled for ${date}`);
      }

      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to change plan');
    },
  });

  return {
    changePlan: mutation.mutate,
    isChangingPlan: mutation.isPending,
  };
}
