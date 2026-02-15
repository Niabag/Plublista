import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { OnboardingStepConnect } from '../components/OnboardingStepConnect';
import { OnboardingStepUpload } from '../components/OnboardingStepUpload';
import { OnboardingStepCreate } from '../components/OnboardingStepCreate';
import { useFileUpload } from '@/features/upload/hooks/useFileUpload';
import { PublicNavbar } from '@/features/public/components/PublicNavbar';
import { cn } from '@/lib/cn';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_CLIPS = 10;

const steps = [
  { label: 'Connect Instagram' },
  { label: 'Upload Clips' },
  { label: 'Create Your Reel' },
] as const;

export function OnboardingPage() {
  const { user, isSessionLoading, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Upload state lifted to page level so it persists across step navigation
  const { uploads, isUploading, uploadFile, removeUpload, completedKeys } = useFileUpload();

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const videoFiles = files.filter((f) => ALLOWED_VIDEO_TYPES.includes(f.type));
      if (videoFiles.length < files.length) {
        toast.error('Only video files are accepted (MP4, MOV, WebM)');
      }
      const remaining = MAX_CLIPS - uploads.length;
      const toProcess = videoFiles.slice(0, remaining);
      if (toProcess.length < videoFiles.length) {
        toast.error(`Maximum ${MAX_CLIPS} clips`);
      }
      for (const file of toProcess) {
        uploadFile(file);
      }
    },
    [uploadFile, uploads.length],
  );

  // If returning from OAuth, stay on step 0 (Connect Instagram)
  useEffect(() => {
    if (searchParams.get('oauth') === 'success') {
      setCurrentStep(0);
    }
  }, [searchParams]);

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.onboardingCompletedAt) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleComplete() {
    setIsCompleting(true);
    try {
      const updated = await completeOnboarding();
      if (updated) {
        toast.success('Welcome to Plublista!');
        navigate('/dashboard');
      }
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Lava lamp effect layer */}
      <div className="lava-container">
        <div className="lava-blob lava-blob-1" />
        <div className="lava-blob lava-blob-2" />
        <div className="lava-blob lava-blob-3" />
        <div className="lava-blob lava-blob-4" />
        <div className="lava-blob lava-blob-5" />
      </div>

      {/* Black semi-transparent overlay */}
      <div className="fixed inset-0 z-10 bg-black/50" />

      {/* Navbar */}
      <div className="relative z-50">
        <PublicNavbar />
      </div>

      {/* Onboarding content */}
      <div className="relative z-20 flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-12">
        <img src="/logo.png" alt="Plublista" className="mb-0 h-24" />
        <img src="/logo-qr.png" alt="QR Code" className="-mt-4 mb-5 h-24" />

        {/* Stepper */}
        <div className="mb-10 flex items-center gap-0">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full text-sm font-bold',
                    index < currentStep && 'bg-white text-[#3F48CC]',
                    index === currentStep && 'bg-white text-[#3F48CC]',
                    index > currentStep && 'bg-black text-white',
                  )}
                >
                  {index < currentStep ? <Check className="size-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    index < currentStep && 'text-white',
                    index === currentStep && 'text-white',
                    index > currentStep && 'text-black',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-3 mt-[-1.25rem] h-0.5 w-16',
                    index < currentStep ? 'bg-white' : 'border-t-2 border-dashed border-black',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="w-full max-w-lg">
          <div className="dark rounded-lg bg-black p-8 text-white shadow-lg">
            {currentStep === 0 && (
              <OnboardingStepConnect onNext={() => setCurrentStep(1)} />
            )}
            {currentStep === 1 && (
              <OnboardingStepUpload
                uploads={uploads}
                isUploading={isUploading}
                onFilesSelected={handleFilesSelected}
                onRemove={removeUpload}
                hasReadyFiles={completedKeys.length > 0}
                onNext={() => setCurrentStep(2)}
                onBack={() => setCurrentStep(0)}
              />
            )}
            {currentStep === 2 && (
              <OnboardingStepCreate
                fileKeys={completedKeys}
                onBack={() => setCurrentStep(1)}
                onComplete={handleComplete}
                isCompleting={isCompleting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
