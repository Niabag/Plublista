import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';
import { toast } from 'sonner';
import type { SubscriptionTier } from '@plublista/shared';

interface CheckoutResponse {
  data: { url: string };
}

export function useCheckout() {
  const mutation = useMutation({
    mutationFn: (tier: Exclude<SubscriptionTier, 'free'>) =>
      apiPost<CheckoutResponse>('/api/billing/checkout', { tier }),
    onSuccess: (response) => {
      window.location.href = response.data.url;
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? 'Failed to start checkout');
    },
  });

  return {
    startCheckout: mutation.mutate,
    isCheckingOut: mutation.isPending,
  };
}
