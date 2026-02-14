import { useState, useCallback } from 'react';
import { Film, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { apiPost } from '@/lib/apiClient';
import { MontageSettings } from '@/features/content/components/MontageSettings';
import type { MontageSettingsValues } from '@/features/content/components/MontageSettings';
import { AutoMontageProgress } from '@/features/content/components/AutoMontageProgress';

type Phase = 'settings' | 'generating' | 'done' | 'error';

interface OnboardingStepCreateProps {
  fileKeys: string[];
  onBack: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

export function OnboardingStepCreate({
  fileKeys,
  onBack,
  onComplete,
  isCompleting,
}: OnboardingStepCreateProps) {
  const [phase, setPhase] = useState<Phase>('settings');
  const [contentItemId, setContentItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState<MontageSettingsValues>({
    style: 'dynamic',
    format: '9:16',
    duration: 30,
    music: 'auto-match',
  });

  const handleCreateReel = useCallback(async () => {
    if (fileKeys.length === 0) return;
    setIsCreating(true);
    try {
      const result = await apiPost<{ data: { id: string } }>('/api/content-items', {
        type: 'reel',
        mediaUrls: fileKeys,
        style: settings.style,
        format: settings.format,
        duration: settings.duration,
        music: settings.music,
      });
      setContentItemId(result.data.id);
      setPhase('generating');
    } catch {
      toast.error('Failed to create Reel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [fileKeys, settings]);

  const handleProgressComplete = useCallback(() => {
    setPhase('done');
  }, []);

  const handleProgressError = useCallback(() => {
    setPhase('error');
  }, []);

  // No clips uploaded — simplified flow
  if (fileKeys.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Film className="mx-auto size-12 text-gray-500" />
          <h2 className="mt-3 text-xl font-bold">Create Your Reel</h2>
          <p className="mt-1 text-sm text-gray-300">
            No clips uploaded yet. You can create your first Reel later from the dashboard.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Back to upload
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={isCompleting}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : 'Complete Onboarding'}
          </button>
        </div>
      </div>
    );
  }

  // Phase: Settings — choose montage options + create
  if (phase === 'settings') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Create Your Reel</h2>
          <p className="mt-1 text-sm text-gray-300">
            Choose your style and let AI create your first Reel.
          </p>
        </div>

        <MontageSettings value={settings} onChange={setSettings} />

        <button
          type="button"
          onClick={handleCreateReel}
          disabled={isCreating}
          className="w-full rounded-md bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create My Reel'}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={isCompleting}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Skip & complete later
          </button>
        </div>
      </div>
    );
  }

  // Phase: Generating — show progress
  if (phase === 'generating' && contentItemId) {
    return (
      <div className="space-y-6">
        <AutoMontageProgress
          contentItemId={contentItemId}
          onComplete={handleProgressComplete}
          onError={handleProgressError}
        />
      </div>
    );
  }

  // Phase: Error — retry option
  if (phase === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400">Generation Failed</h2>
          <p className="mt-1 text-sm text-gray-300">
            Something went wrong. You can try again or complete onboarding and create a Reel later.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setPhase('settings')}
            className="w-full rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={isCompleting}
            className="w-full rounded-md border border-gray-600 px-6 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : 'Complete Onboarding'}
          </button>
        </div>
      </div>
    );
  }

  // Phase: Done — reel is ready!
  return (
    <div className="space-y-6">
      <div className="text-center">
        <PartyPopper className="mx-auto size-12 text-amber-400" />
        <h2 className="mt-3 text-xl font-bold">Your Reel is Ready!</h2>
        <p className="mt-1 text-sm text-gray-300">
          Your first AI-generated Reel has been created. You can preview and edit it from your dashboard.
        </p>
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={isCompleting}
        className="w-full rounded-md bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isCompleting ? 'Completing...' : 'Complete Onboarding'}
      </button>
    </div>
  );
}
