import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@plublista/shared';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPut } from '@/lib/apiClient';

export function ChangePasswordSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      apiPut('/api/auth/password', data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      reset();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to update password');
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Change Password
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update your account password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.isError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {(mutation.error as { message?: string })?.message ||
              'Failed to update password'}
          </div>
        )}

        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
