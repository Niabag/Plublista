import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, type ProfileUpdateInput } from '@plublista/shared';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../hooks/useAuth';

const TIER_LABELS: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  agency: 'Agency',
};

export function ProfileSection() {
  const { user, updateProfile, isLoading, error: apiError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
    },
  });

  const onSubmit = async (data: ProfileUpdateInput) => {
    const updated = await updateProfile(data);
    if (updated) {
      toast.success('Profile updated successfully');
    } else {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {apiError.message}
          </div>
        )}

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            {...register('displayName')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subscription
          </label>
          <div className="mt-1">
            <Badge variant="secondary">
              {TIER_LABELS[user.subscriptionTier] ?? user.subscriptionTier}
            </Badge>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
