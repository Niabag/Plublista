import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

interface PlatformConnection {
  id: string;
  platform: string;
  platformUsername: string;
  connectedAt: string;
}

interface ConnectionsResponse {
  data: PlatformConnection[];
}

interface AyrshareConnectResponse {
  data: {
    connectUrl: string;
    connectedPlatforms: string[];
  };
}

export function usePlatformConnections(userTier?: string) {
  const connectionsQuery = useQuery({
    queryKey: ['platform-connections'],
    queryFn: () => apiGet<ConnectionsResponse>('/api/auth/connections'),
  });

  const ayrshareQuery = useQuery({
    queryKey: ['ayrshare-connect'],
    queryFn: () => apiGet<AyrshareConnectResponse>('/api/content-items/ayrshare-connect'),
    enabled: !!userTier && userTier !== 'free',
  });

  const directConnections = connectionsQuery.data?.data ?? [];
  const ayrshareConnected = ayrshareQuery.data?.data?.connectedPlatforms ?? [];
  const ayrshareConnectUrl = ayrshareQuery.data?.data?.connectUrl ?? null;

  // Merge: direct Instagram connection + Ayrshare platforms
  const connectedSet = new Set<string>();
  for (const c of directConnections) {
    connectedSet.add(c.platform);
  }
  for (const p of ayrshareConnected) {
    connectedSet.add(p);
  }

  return {
    connections: directConnections,
    connectedPlatforms: Array.from(connectedSet),
    ayrshareConnectUrl,
    isPending: connectionsQuery.isPending,
    hasInstagram: directConnections.some((c) => c.platform === 'instagram'),
    getConnection: (platform: string) => directConnections.find((c) => c.platform === platform),
  };
}
