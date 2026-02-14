import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { toast } from 'sonner';

const MAX_PROMPT_LENGTH = 1000;

interface ImageGeneratorProps {
  contentItemId: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ImageGenerator({ contentItemId, onImageGenerated, disabled }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [accepted, setAccepted] = useState(false);
  const { generate, imageUrl, isPending, isError, error, reset } = useImageGeneration(contentItemId);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isPending) return;

    reset();
    setAccepted(false);
    generate(
      { prompt: prompt.trim() },
      {
        onError: (err) => {
          const apiError = err as { code?: string; message?: string };
          if (apiError.code === 'QUOTA_EXCEEDED') {
            toast.error('Monthly AI image quota reached. Upgrade your plan for more.');
          } else {
            toast.error(apiError.message ?? 'Image generation failed');
          }
        },
      },
    );
  }, [prompt, isPending, generate, reset]);

  const handleAccept = useCallback(() => {
    if (imageUrl) {
      setAccepted(true);
      onImageGenerated(imageUrl);
      toast.success('Image accepted');
    }
  }, [imageUrl, onImageGenerated]);

  const quotaExceeded = isError && (error as { code?: string })?.code === 'QUOTA_EXCEEDED';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="image-prompt" className="text-sm font-medium">
          Image Prompt
        </label>
        <textarea
          id="image-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          placeholder="Describe the image you want to generate..."
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
          disabled={disabled || isPending}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs',
              prompt.length >= MAX_PROMPT_LENGTH ? 'text-red-500' : 'text-muted-foreground',
            )}
          >
            {prompt.length} / {MAX_PROMPT_LENGTH}
          </span>
          <Button
            onClick={handleGenerate}
            disabled={disabled || isPending || !prompt.trim()}
            size="sm"
          >
            {isPending ? (
              <>
                <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full" aria-label="Generating" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>

      {quotaExceeded && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Monthly AI image quota reached. Upgrade your plan for more images.
        </div>
      )}

      {imageUrl && !quotaExceeded && (
        <div className="space-y-3">
          <div className="rounded-md border overflow-hidden">
            <img
              src={imageUrl}
              alt="Generated preview"
              className="w-full object-contain max-h-[400px]"
            />
          </div>
          {!accepted && (
            <div className="flex gap-2">
              <Button onClick={handleAccept} size="sm">
                Accept
              </Button>
              <Button onClick={handleGenerate} variant="outline" size="sm" disabled={isPending}>
                Regenerate
              </Button>
            </div>
          )}
          {accepted && (
            <p className="text-sm text-muted-foreground">Image accepted.</p>
          )}
        </div>
      )}
    </div>
  );
}
