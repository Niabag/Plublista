import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@plublista/shared';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error: apiError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const user = await registerUser(data);
    if (user) {
      navigate('/onboarding');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
          {apiError.message}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          {...register('displayName')}
          className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-400">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
