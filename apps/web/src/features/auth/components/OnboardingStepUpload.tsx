import { FileUploadZone } from '@/features/upload/components/FileUploadZone';
import type { FileUploadState } from '@/features/upload/hooks/useFileUpload';

const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/quicktime,video/webm';
const MAX_CLIPS = 10;

interface OnboardingStepUploadProps {
  uploads: FileUploadState[];
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemove: (file: File) => void;
  hasReadyFiles: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStepUpload({
  uploads,
  isUploading,
  onFilesSelected,
  onRemove,
  hasReadyFiles,
  onNext,
  onBack,
}: OnboardingStepUploadProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Upload Clips</h2>
        <p className="mt-1 text-sm text-gray-300">
          Use your phone videos — even selfies work!
        </p>
      </div>

      <FileUploadZone
        uploads={uploads}
        isUploading={isUploading}
        onFilesSelected={onFilesSelected}
        onRemove={onRemove}
        accept={ACCEPTED_VIDEO_TYPES}
        maxFiles={MAX_CLIPS}
        dropText="Drop your video clips here, or click to browse"
        activeDropText="Drop your clips here"
        subtitleText="MP4, MOV, WebM"
      />

      {uploads.length === 0 && (
        <p className="text-center text-sm text-gray-400">
          No clips yet. You can also skip this step and upload later.
        </p>
      )}

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
          onClick={onNext}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {hasReadyFiles ? 'Next' : 'Skip'}
        </button>
      </div>
    </div>
  );
}
