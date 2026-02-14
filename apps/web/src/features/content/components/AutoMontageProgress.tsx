import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Progress } from '@/components/ui/progress';
import { useContentStatus } from '../hooks/useContentStatus';

const STEPS = [
  { label: 'Analyzing clips', detail: 'Scanning clips for quality and content' },
  { label: 'Selecting best moments', detail: 'Identifying hook and key segments' },
  { label: 'Matching music to content mood', detail: 'Generating original soundtrack' },
  { label: 'Rendering final video', detail: 'Composing edit timeline' },
  { label: 'Adding text overlays', detail: 'Finalizing your Reel' },
] as const;

const STEP_INTERVAL_MS = 3000;

interface AutoMontageProgressProps {
  contentItemId: string;
  onComplete?: () => void;
  onError?: () => void;
}

export function AutoMontageProgress({
  contentItemId,
  onComplete,
  onError,
}: AutoMontageProgressProps) {
  const { status, isPending, isError } = useContentStatus(contentItemId);
  const [simulatedStep, setSimulatedStep] = useState(0);

  // Simulate step progression while generating
  useEffect(() => {
    if (status !== 'generating') return;

    const interval = setInterval(() => {
      setSimulatedStep((prev) => {
        // Advance up to step 3 (0-indexed), step 4 waits for completion
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status]);

  // Handle completion
  useEffect(() => {
    if (status === 'draft') {
      setSimulatedStep(STEPS.length);
      onComplete?.();
    }
  }, [status, onComplete]);

  // Handle error
  useEffect(() => {
    if (status === 'failed') {
      onError?.();
    }
  }, [status, onError]);

  // Handle API error
  useEffect(() => {
    if (isError) {
      onError?.();
    }
  }, [isError, onError]);

  const isComplete = status === 'draft';
  const isFailed = status === 'failed';
  const activeStep = isComplete ? STEPS.length : simulatedStep;
  const percentage = isComplete
    ? 100
    : Math.round(((activeStep + 0.5) / STEPS.length) * 100);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 text-indigo-600 motion-safe:animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 py-8 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h2 className="text-lg font-semibold text-foreground">
          Unable to load progress
        </h2>
        <p className="text-sm text-muted-foreground">
          Could not connect to the server. Please check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        {isComplete
          ? 'Your Reel is ready!'
          : isFailed
            ? 'Generation failed'
            : 'Creating your Reel...'}
      </h2>

      {/* Step list */}
      <div aria-live="polite" role="status" className="space-y-3">
        {STEPS.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep && !isComplete && !isFailed;
          const isErrorStep = isFailed && index === activeStep;

          return (
            <div key={step.label} className="flex items-start gap-3">
              {/* Status icon */}
              {isErrorStep ? (
                <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
              ) : isDone ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
              ) : isActive ? (
                <Loader2 className="mt-0.5 size-5 shrink-0 text-indigo-600 motion-safe:animate-spin" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}

              {/* Step text */}
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    isDone && 'text-foreground',
                    isActive && 'text-indigo-600 dark:text-indigo-400',
                    isErrorStep && 'text-red-600 dark:text-red-400',
                    !isDone && !isActive && !isErrorStep && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {(isActive || isErrorStep) && (
                  <p className="text-xs text-muted-foreground">
                    {isErrorStep
                      ? 'An error occurred during this step'
                      : step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress
          value={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-label="Generation progress"
          className={cn(isFailed && '[&_[data-slot=progress-indicator]]:bg-red-500')}
        />
        <p className="text-xs text-muted-foreground">
          {percentage}%
        </p>
      </div>
    </div>
  );
}
