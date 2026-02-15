import { useState, useCallback, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Copy, Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useFileUpload } from '@/features/upload/hooks/useFileUpload';
import { useStandaloneImageGeneration } from '../hooks/useStandaloneImageGeneration';
import { toast } from 'sonner';
import type { SlideData } from '../hooks/useCarouselBuilder';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROMPT_LENGTH = 1000;

interface SlideCardProps {
  slide: SlideData;
  index: number;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, data: Partial<SlideData>) => void;
  canRemove: boolean;
  canDuplicate: boolean;
  format: string;
}

export function SlideCard({
  slide,
  index,
  onRemove,
  onDuplicate,
  onUpdate,
  canRemove,
  canDuplicate,
  format,
}: SlideCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();
  const { generate, isPending: isGenerating, reset: resetGeneration } = useStandaloneImageGeneration();

  const aspectClass = format === '16:9' ? 'aspect-video' : format === '1:1' ? 'aspect-square' : 'aspect-[9/16]';

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are accepted');
        return;
      }

      onUpdate(slide.id, { status: 'uploading', source: 'upload' });

      try {
        const result = await uploadFile(file);
        if (result) {
          onUpdate(slide.id, {
            imageKey: result.fileKey,
            imageUrl: URL.createObjectURL(file),
            source: 'upload',
            status: 'ready',
          });
        } else {
          onUpdate(slide.id, { status: 'error', error: 'Upload failed' });
        }
      } catch {
        onUpdate(slide.id, { status: 'error', error: 'Upload failed' });
      }

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [slide.id, onUpdate, uploadFile],
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;

    onUpdate(slide.id, { status: 'generating', source: 'ai' });
    resetGeneration();

    generate(
      { prompt: prompt.trim() },
      {
        onSuccess: (response) => {
          onUpdate(slide.id, {
            imageKey: response.data.fileKey,
            imageUrl: response.data.imageUrl,
            source: 'ai',
            status: 'ready',
          });
          setShowAiPrompt(false);
          setPrompt('');
        },
        onError: (err) => {
          const apiError = err as { code?: string; message?: string };
          if (apiError.code === 'QUOTA_EXCEEDED') {
            toast.error('Not enough credits. Upgrade your plan for more.');
          } else {
            toast.error(apiError.message ?? 'Image generation failed');
          }
          onUpdate(slide.id, { status: 'empty' });
        },
      },
    );
  }, [prompt, isGenerating, slide.id, onUpdate, generate, resetGeneration]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative rounded-lg border bg-card transition-shadow',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Slide number badge */}
      <div className="absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white">
        {index + 1}
      </div>

      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-grab rounded bg-black/40 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Image area */}
      <div className={cn('relative overflow-hidden rounded-t-lg bg-muted', aspectClass)}>
        {slide.status === 'ready' && slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={`Slide ${index + 1}`}
            className="size-full object-cover"
          />
        ) : slide.status === 'uploading' || slide.status === 'generating' ? (
          <div className="flex size-full flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-indigo-500" />
            <span className="text-xs text-muted-foreground">
              {slide.status === 'uploading' ? 'Uploading...' : 'Generating...'}
            </span>
          </div>
        ) : slide.status === 'error' ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="size-8 text-destructive" />
            <span className="text-center text-xs text-destructive">{slide.error ?? 'Error'}</span>
          </div>
        ) : (
          /* Empty state */
          <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
            {!showAiPrompt ? (
              <>
                <span className="text-xs text-muted-foreground">Add image</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1"
                  >
                    <Upload className="size-3" />
                    Upload
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAiPrompt(true)}
                    className="gap-1"
                  >
                    <Sparkles className="size-3" />
                    AI
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex w-full flex-col gap-2 px-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                  placeholder="Describe the image..."
                  className="min-h-[60px] w-full resize-none rounded border border-input bg-background px-2 py-1 text-xs"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {prompt.length}/{MAX_PROMPT_LENGTH}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowAiPrompt(false); setPrompt(''); }}
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="h-6 px-2 text-xs"
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

      {/* Action bar */}
      <div className="flex items-center justify-between border-t p-1.5">
        <div className="flex gap-1">
          {slide.status === 'ready' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2"
                title="Replace image"
              >
                <Upload className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(slide.id)}
                disabled={!canDuplicate}
                className="h-7 px-2"
                title="Duplicate slide"
              >
                <Copy className="size-3" />
              </Button>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(slide.id)}
          disabled={!canRemove}
          className="h-7 px-2 text-destructive hover:text-destructive"
          title="Remove slide"
        >
          <X className="size-3" />
        </Button>
      </div>

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
