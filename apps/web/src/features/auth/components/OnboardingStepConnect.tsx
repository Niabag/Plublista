import { Instagram, ShieldCheck } from 'lucide-react';
import { usePlatformConnections } from '../hooks/usePlatformConnections';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface OnboardingStepConnectProps {
  onNext: () => void;
}

export function OnboardingStepConnect({ onNext }: OnboardingStepConnectProps) {
  const { getConnection } = usePlatformConnections();
  const instagramConnection = getConnection('instagram');

  function handleConnect() {
    window.location.href = `${API_BASE}/api/auth/oauth/instagram?returnTo=/onboarding`;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Instagram className="mx-auto size-12 text-pink-400" />
        <h2 className="mt-3 text-xl font-bold">Connect Instagram</h2>
        <p className="mt-1 text-sm text-gray-300">
          Link your Instagram account to publish content directly.
        </p>
      </div>

      {instagramConnection ? (
        <div className="rounded-md bg-emerald-900/40 p-4 text-center">
          <p className="font-medium text-emerald-400">
            Connected as @{instagramConnection.platformUsername}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3 font-medium text-white hover:from-purple-700 hover:to-pink-600"
        >
          <Instagram className="size-5" />
          Connect Instagram
        </button>
      )}

      {/* Trust badge */}
      <div className="rounded-md bg-gray-900 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
          <ShieldCheck className="size-4 text-indigo-400" />
          Why connect?
        </div>
        <ul className="space-y-1 text-xs text-gray-400">
          <li>Publish Reels and posts directly to Instagram</li>
          <li>Schedule your content for optimal timing</li>
          <li>Track engagement and performance</li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNext}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
