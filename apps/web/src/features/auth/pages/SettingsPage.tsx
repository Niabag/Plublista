import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfileSection } from '../components/ProfileSection';
import { QuotaIndicator } from '../components/QuotaIndicator';
import { PlatformCard } from '../components/PlatformCard';
import { usePlatformConnections } from '../hooks/usePlatformConnections';
import type { Platform } from '@plublista/shared';

const PLATFORMS: { platform: Platform; comingSoon: boolean }[] = [
  { platform: 'instagram', comingSoon: false },
  { platform: 'youtube', comingSoon: true },
  { platform: 'tiktok', comingSoon: true },
  { platform: 'facebook', comingSoon: true },
  { platform: 'linkedin', comingSoon: true },
  { platform: 'x', comingSoon: true },
];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getConnection, connectPlatform, disconnectPlatform, isDisconnecting } =
    usePlatformConnections();
  const [disconnectTarget, setDisconnectTarget] = useState<Platform | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Handle OAuth callback query params
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    const platform = searchParams.get('platform');

    if (oauthStatus === 'success' && platform) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
      // Clean up query params
      setSearchParams({}, { replace: true });
    } else if (oauthStatus === 'error' && platform) {
      const reason = searchParams.get('reason') || 'Connection failed';
      setOauthError(reason);
      toast.error(`Failed to connect ${platform}: ${reason}`);
      // Clean up query params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleDisconnect() {
    if (!disconnectTarget) return;

    try {
      await disconnectPlatform(disconnectTarget);
      toast.success(
        `${disconnectTarget.charAt(0).toUpperCase() + disconnectTarget.slice(1)} disconnected`,
      );
      setOauthError(null);
    } catch {
      toast.error('Failed to disconnect. Please try again.');
    } finally {
      setDisconnectTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <ProfileSection />

      <QuotaIndicator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Connected Accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to publish content directly from Plublista.
          </p>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map(({ platform, comingSoon }) => (
            <PlatformCard
              key={platform}
              platform={platform}
              connection={getConnection(platform)}
              onConnect={connectPlatform}
              onDisconnect={setDisconnectTarget}
              comingSoon={comingSoon}
              error={platform === 'instagram' ? oauthError : null}
            />
          ))}
        </div>
      </div>

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect{' '}
              {disconnectTarget
                ? disconnectTarget.charAt(0).toUpperCase() + disconnectTarget.slice(1)
                : ''}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this account? Your scheduled posts will not be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
