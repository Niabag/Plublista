import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RegisterInput, LoginInput, ProfileUpdateInput, ApiResponse, User } from '@plublista/shared';
import { apiPost, apiGet, apiPut } from '../../../lib/apiClient';

interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Session query — shared across all components via TanStack Query cache
  const { data: user, isPending: isSessionLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const result = await apiGet<ApiResponse<User>>('/api/auth/me');
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });

  async function register(data: RegisterInput): Promise<User | null> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost<ApiResponse<User>>('/api/auth/register', data);
      queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
      return result.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function login(data: LoginInput): Promise<User | null> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost<ApiResponse<User>>('/api/auth/login', data);
      queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
      return result.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiPost('/api/auth/logout', {});
    } catch {
      // Logout should always clear local state even if API fails
    }
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
  }

  async function updateProfile(data: ProfileUpdateInput): Promise<User | null> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPut<ApiResponse<User>>('/api/auth/profile', data);
      queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
      return result.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function completeOnboarding(): Promise<User | null> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost<ApiResponse<User>>('/api/auth/onboarding/complete', {});
      queryClient.setQueryData(SESSION_QUERY_KEY, result.data);
      return result.data;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function checkSession(): Promise<User | null> {
    const data = await queryClient.fetchQuery({
      queryKey: SESSION_QUERY_KEY,
      queryFn: async () => {
        const result = await apiGet<ApiResponse<User>>('/api/auth/me');
        return result.data;
      },
    });
    return data ?? null;
  }

  return {
    register,
    login,
    logout,
    updateProfile,
    completeOnboarding,
    checkSession,
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    isSessionLoading,
    error,
    setError,
  };
}
