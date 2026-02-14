import { useState } from 'react';
import { Instagram, Lock, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X (Twitter)' },
] as const;

interface PublishConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (platforms: string[]) => void;
  isPending: boolean;
  userTier: string;
  connectedPlatforms: string[];
  ayrshareConnectUrl: string | null;
  instagramUsername?: string;
}

export function PublishConfirmDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  userTier,
  connectedPlatforms,
  ayrshareConnectUrl,
  instagramUsername,
}: PublishConfirmDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  if (!open) return null;

  const isFree = userTier === 'free';

  const togglePlatform = (platformId: string) => {
    setSelected((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId],
    );
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onConfirm(selected);
      setSelected([]);
    }
  };

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  const buttonText =
    selected.length === 0
      ? 'Select platforms'
      : selected.length === 1
        ? `Publish to ${PLATFORMS.find((p) => p.id === selected[0])?.label ?? selected[0]}`
        : `Publish to ${selected.length} Platforms`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-lg font-semibold">Publish Content</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {isFree ? 'Select a platform to publish your content' : 'Select platforms to publish your content'}
        </p>

        {isFree && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            A <strong>&quot;Made with Plublista&quot;</strong> watermark will be added to published images.
          </div>
        )}

        <div className="space-y-2">
          {PLATFORMS.map((platform) => {
            const isLocked = isFree && platform.id !== 'instagram';
            const isConnected = connectedPlatforms.includes(platform.id);
            const isSelected = selected.includes(platform.id);
            const canSelect = !isLocked && isConnected;

            return (
              <button
                key={platform.id}
                type="button"
                disabled={!canSelect || isPending}
                onClick={() => canSelect && togglePlatform(platform.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                  canSelect && isSelected
                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950'
                    : canSelect
                      ? 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/50'
                      : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-900',
                )}
              >
                <div className="flex items-center gap-3">
                  {'icon' in platform && platform.icon ? (
                    <platform.icon className="size-5 text-indigo-600" />
                  ) : (
                    <div className="flex size-5 items-center justify-center text-xs font-bold text-muted-foreground">
                      {platform.label.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">{platform.label}</span>
                    {platform.id === 'instagram' && instagramUsername && (
                      <span className="ml-2 text-xs text-muted-foreground">@{instagramUsername}</span>
                    )}
                  </div>
                </div>

                {isLocked ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" />
                    <span>Upgrade</span>
                  </div>
                ) : !isConnected ? (
                  ayrshareConnectUrl && !isFree ? (
                    <a
                      href={ayrshareConnectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Connect
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not connected</span>
                  )
                ) : isSelected ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Check className="size-3" />
                  </div>
                ) : (
                  <div className="size-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0 || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Publishing...
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
