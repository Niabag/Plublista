import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, Upload, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/useUiStore';
import { useFileUpload } from '@/features/upload/hooks/useFileUpload';
import { useStandaloneImageGeneration } from '../hooks/useStandaloneImageGeneration';
import { FormatPreview } from '../components/FormatPreview';
import { apiPost } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROMPT_LENGTH = 1000;

type ImageStatus = 'empty' | 'uploading' | 'generating' | 'ready' | 'error';

interface ImageData {
  fileKey: string;
  url: string;
  source: 'upload' | 'ai';
}

export function CreatePostPage() {
  const [format, setFormat] = useState<'9:16' | '16:9' | '1:1'>('1:1');
  const [imageStatus, setImageStatus] = useState<ImageStatus>('empty');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();
  const { generate, isPending: isGenerating, reset: resetGeneration } = useStandaloneImageGeneration();

  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  // Collapse sidebar on mount, restore on unmount
  useEffect(() => {
    if (!sidebarCollapsed) {
      toggleSidebar();
    }
    return () => {
      const currentState = useUiStore.getState().sidebarCollapsed;
      if (currentState) {
        useUiStore.getState().toggleSidebar();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are accepted');
        return;
      }

      setImageStatus('uploading');
      setImageError(null);
      setShowAiPrompt(false);

      try {
        const result = await uploadFile(file);
        if (result) {
          setImageData({
            fileKey: result.fileKey,
            url: URL.createObjectURL(file),
            source: 'upload',
          });
          setImageStatus('ready');
        } else {
          setImageStatus('error');
          setImageError('Upload failed');
        }
      } catch {
        setImageStatus('error');
        setImageError('Upload failed');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadFile],
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;

    setImageStatus('generating');
    setImageError(null);
    resetGeneration();

    generate(
      { prompt: prompt.trim() },
      {
        onSuccess: (response) => {
          setImageData({
            fileKey: response.data.fileKey,
            url: response.data.imageUrl,
            source: 'ai',
          });
          setImageStatus('ready');
          setShowAiPrompt(false);
          setPrompt('');
        },
        onError: (err) => {
          const apiError = err as { code?: string; message?: string };
          if (apiError.code === 'QUOTA_EXCEEDED') {
            toast.error('Monthly AI image quota reached. Upgrade your plan for more.');
          } else {
            toast.error(apiError.message ?? 'Image generation failed');
          }
          setImageStatus('empty');
        },
      },
    );
  }, [prompt, isGenerating, generate, resetGeneration]);

  const handleClear = useCallback(() => {
    setImageData(null);
    setImageStatus('empty');
    setImageError(null);
    setShowAiPrompt(false);
    setPrompt('');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!imageData) return;

    setIsCreating(true);
    try {
      const result = await apiPost<{ data: { id: string } }>('/api/content-items', {
        type: 'post',
        mediaUrls: [imageData.fileKey],
        format,
      });
      navigate(`/create/post/${result.data.id}/preview`);
    } catch {
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [imageData, format, navigate]);

  const aspectClass =
    format === '16:9' ? 'aspect-video' : format === '1:1' ? 'aspect-square' : 'aspect-[9/16]';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ImageIcon className="size-6 text-indigo-600" />
        <h1 className="text-xl font-semibold text-foreground">
          New Post
        </h1>
      </div>

      {/* Format selector */}
      <FormatPreview selected={format} onSelect={(f) => setFormat(f)} />

      {/* Image area */}
      <div
        className={cn(
          'relative mx-auto max-w-md overflow-hidden rounded-lg border-2 bg-muted',
          imageStatus === 'ready'
            ? 'border-solid border-gray-200 dark:border-gray-700'
            : 'border-dashed border-gray-300 dark:border-gray-600',
          aspectClass,
        )}
      >
        {imageStatus === 'ready' && imageData ? (
          <>
            <img
              src={imageData.url}
              alt="Post image"
              className="size-full object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-opacity hover:bg-black/80"
              title="Remove image"
            >
              <X className="size-4" />
            </button>
          </>
        ) : imageStatus === 'uploading' || imageStatus === 'generating' ? (
          <div className="flex size-full flex-col items-center justify-center gap-2">
            <Loader2 className="size-10 animate-spin text-indigo-500" />
            <span className="text-sm text-muted-foreground">
              {imageStatus === 'uploading' ? 'Uploading...' : 'Generating...'}
            </span>
          </div>
        ) : imageStatus === 'error' ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
            <AlertCircle className="size-10 text-destructive" />
            <span className="text-sm text-destructive">{imageError ?? 'Error'}</span>
            <Button size="sm" variant="outline" onClick={handleClear}>
              Try Again
            </Button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex size-full flex-col items-center justify-center gap-4 p-6">
            {!showAiPrompt ? (
              <>
                <ImageIcon className="size-12 text-indigo-300 dark:text-gray-600" />
                <p className="text-sm text-muted-foreground">Add an image for your post</p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="size-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAiPrompt(true)}
                    className="gap-2"
                  >
                    <Sparkles className="size-4" />
                    AI Generate
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex w-full max-w-sm flex-col gap-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                  placeholder="Describe the image you want..."
                  className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAiPrompt(false);
                        setPrompt('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create button */}
      <Button
        size="lg"
        className="w-full"
        disabled={imageStatus !== 'ready' || isCreating}
        onClick={handleCreate}
      >
        {isCreating ? 'Creating Post...' : 'Create Post'}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
