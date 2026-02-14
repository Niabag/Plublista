import { useState } from 'react';
import { X, Clock, Loader2, Lock, Check, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/cn';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X (Twitter)' },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { scheduledAt: string; platforms: string[] }) => void;
  isPending: boolean;
  userTier: string;
  connectedPlatforms: string[];
  ayrshareConnectUrl: string | null;
  instagramUsername?: string;
}

export function ScheduleDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  userTier,
  connectedPlatforms,
  ayrshareConnectUrl,
  instagramUsername,
}: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  if (!open) return null;

  const isFree = userTier === 'free';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId],
    );
  };

  const handleConfirm = () => {
    if (!selectedDate || selectedPlatforms.length === 0) return;
    const scheduled = new Date(selectedDate);
    scheduled.setHours(hour, minute, 0, 0);
    onConfirm({
      scheduledAt: scheduled.toISOString(),
      platforms: selectedPlatforms,
    });
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedPlatforms([]);
    setHour(9);
    setMinute(0);
    onClose();
  };

  const canConfirm = selectedDate && selectedPlatforms.length > 0 && !isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-lg font-semibold">Schedule Content</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose when to publish your content.
        </p>

        {/* Date picker */}
        <div className="mb-4 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={{ before: tomorrow }}
            className="rounded-lg border"
          />
        </div>

        {/* Time selection */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium">:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform selection */}
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">Platforms</span>
          {isFree && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              A <strong>&quot;Made with Plublista&quot;</strong> watermark will be added to published images.
            </div>
          )}
          <div className="space-y-2">
            {PLATFORMS.map((platform) => {
              const isLocked = isFree && platform.id !== 'instagram';
              const isConnected = connectedPlatforms.includes(platform.id);
              const isSelected = selectedPlatforms.includes(platform.id);
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
