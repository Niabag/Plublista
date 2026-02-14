import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SESSION_QUERY_KEY } from '@/features/auth/hooks/useAuth';

export function CheckoutSuccessPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate session to refresh the user's subscriptionTier
    queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }, [queryClient]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-8 text-center">
      <CheckCircle className="size-16 text-emerald-500" />
      <h1 className="text-2xl font-bold text-foreground">Welcome to your new plan!</h1>
      <p className="text-muted-foreground">
        Your subscription is now active. Your 7-day free trial has started — enjoy all the premium
        features.
      </p>
      <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
        <Link to="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
