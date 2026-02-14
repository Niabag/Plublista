import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiDelete } from '@/lib/apiClient';
import type { Platform, PlatformConnection } from '@plublista/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ConnectionsResponse {
  data: PlatformConnection[];
}

interface DeleteResponse {
  data: { message: string };
}

export function usePlatformConnections() {
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ['platform-connections'],
    queryFn: () => apiGet<ConnectionsResponse>('/api/auth/connections'),
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: Platform) =>
      apiDelete<DeleteResponse>(`/api/auth/connections/${platform}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-connections'] });
    },
  });

  const connections = connectionsQuery.data?.data ?? [];

  function getConnection(platform: Platform): PlatformConnection | null {
    return connections.find((c) => c.platform === platform) ?? null;
  }

  function connectPlatform(platform: Platform) {
    // Redirect to backend OAuth initiation endpoint
    window.location.href = `${API_BASE}/api/auth/oauth/${platform}`;
  }

  function disconnectPlatform(platform: Platform) {
    return disconnectMutation.mutateAsync(platform);
  }

  return {
    connections,
    isPending: connectionsQuery.isPending,
    isError: connectionsQuery.isError,
    getConnection,
    connectPlatform,
    disconnectPlatform,
    isDisconnecting: disconnectMutation.isPending,
    refetch: connectionsQuery.refetch,
  };
}
