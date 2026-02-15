import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
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
import { Button } from '@/components/ui/button';
import { ProfileSection } from '../components/ProfileSection';
import { ChangePasswordSection } from '../components/ChangePasswordSection';
import { QuotaIndicator } from '../components/QuotaIndicator';
import { PlatformCard } from '../components/PlatformCard';
import { usePlatformConnections } from '../hooks/usePlatformConnections';
import { apiDelete, apiPost } from '@/lib/apiClient';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getConnection, connectPlatform, disconnectPlatform, isDisconnecting } =
    usePlatformConnections();
  const [disconnectTarget, setDisconnectTarget] = useState<Platform | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const exportMutation = useMutation({
    mutationFn: () => apiPost<{ data: { downloadUrl: string } }>('/api/gdpr/export', {}),
    onSuccess: (res) => {
      window.open(res.data.downloadUrl, '_blank');
      toast.success('Data export ready — download started.');
    },
    onError: () => toast.error('Failed to generate data export. Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete('/api/gdpr/account'),
    onSuccess: () => {
      toast.success('Account deleted.');
      navigate('/');
    },
    onError: () => toast.error('Failed to delete account. Please try again.'),
  });

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

      <ChangePasswordSection />

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

      {/* Data & Privacy — GDPR */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Export your data or permanently delete your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Generating...' : 'Export my data'}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete my account
          </Button>
        </div>
      </div>

      {/* Delete account confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setDeleteConfirmText('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is <strong>permanent and irreversible</strong>. All your content, connected
              accounts, subscription, and files will be deleted.
              <br /><br />
              Type <strong>DELETE</strong> below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Permanently delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect platform dialog */}
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
