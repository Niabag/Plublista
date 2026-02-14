import { Instagram, Youtube, Lock, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { Platform, PlatformConnection } from '@plublista/shared';

interface PlatformCardProps {
  platform: Platform;
  connection: PlatformConnection | null;
  onConnect: (platform: Platform) => void;
  onDisconnect: (platform: Platform) => void;
  disabled?: boolean;
  comingSoon?: boolean;
  error?: string | null;
}

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  instagram: { label: 'Instagram', color: 'text-[#E4405F]', bgColor: 'bg-[#E4405F]', icon: Instagram },
  youtube: { label: 'YouTube', color: 'text-[#FF0000]', bgColor: 'bg-[#FF0000]', icon: Youtube },
  tiktok: { label: 'TikTok', color: 'text-black dark:text-white', bgColor: 'bg-black', icon: Lock },
  facebook: { label: 'Facebook', color: 'text-[#1877F2]', bgColor: 'bg-[#1877F2]', icon: Lock },
  linkedin: { label: 'LinkedIn', color: 'text-[#0A66C2]', bgColor: 'bg-[#0A66C2]', icon: Lock },
  x: { label: 'X', color: 'text-black dark:text-white', bgColor: 'bg-black', icon: Lock },
};

export function PlatformCard({
  platform,
  connection,
  onConnect,
  onDisconnect,
  disabled = false,
  comingSoon = false,
  error = null,
}: PlatformCardProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  const isConnected = !!connection;

  if (comingSoon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-4 opacity-60 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Lock className="size-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{config.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-lg border-2 border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900">
            <AlertCircle className="size-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onConnect(platform)}>
          Try Again
        </Button>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={cn('flex size-10 items-center justify-center rounded-lg', config.bgColor)}>
            <Icon className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</p>
            <div className="flex items-center gap-1">
              <Check className="size-3 text-emerald-500" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Connected as @{connection.platformUsername}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-rose-600"
          onClick={() => onDisconnect(platform)}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Not connected
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon className={cn('size-5', config.color)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Not connected</p>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onConnect(platform)}>
        Connect
      </Button>
    </div>
  );
}
