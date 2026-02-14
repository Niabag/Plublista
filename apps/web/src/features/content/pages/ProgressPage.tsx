import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoMontageProgress } from '../components/AutoMontageProgress';

export function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFailed, setIsFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleComplete = useCallback(() => {
    timerRef.current = setTimeout(() => {
      navigate(`/create/reel/${id}/preview`);
    }, 1500);
  }, [navigate, id]);

  const handleError = useCallback(() => {
    setIsFailed(true);
  }, []);

  if (!id) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-lg space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <Film className="size-6 text-indigo-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Auto-Montage
          </h1>
        </div>

        {/* Progress component */}
        <AutoMontageProgress
          contentItemId={id}
          onComplete={handleComplete}
          onError={handleError}
        />

        {/* Error retry */}
        {isFailed && (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/create/reel')}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
