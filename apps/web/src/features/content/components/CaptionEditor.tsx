import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';

const MAX_CAPTION_LENGTH = 2200;

interface CaptionEditorProps {
  value: string;
  onSave: (caption: string) => void;
  disabled?: boolean;
}

export function CaptionEditor({ value, onSave, disabled }: CaptionEditorProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const charCount = text.length;
  const isWarning = charCount >= 2000;
  const isOver = charCount >= MAX_CAPTION_LENGTH;

  const handleBlur = useCallback(() => {
    if (text !== value) {
      onSave(text);
    }
  }, [text, value, onSave]);

  return (
    <div className="space-y-1">
      <label
        htmlFor="caption-editor"
        className="text-sm font-medium text-foreground"
      >
        Caption
      </label>
      <textarea
        id="caption-editor"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
        onBlur={handleBlur}
        disabled={disabled}
        rows={5}
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm',
          'bg-card',
          'text-foreground',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOver
            ? 'border-red-500'
            : isWarning
              ? 'border-orange-400'
              : 'border-border',
        )}
        placeholder="Write a caption for your content..."
        aria-describedby="caption-counter"
      />
      <p
        id="caption-counter"
        className={cn(
          'text-xs text-right',
          isOver
            ? 'text-red-500'
            : isWarning
              ? 'text-orange-500'
              : 'text-muted-foreground',
        )}
      >
        {charCount} / {MAX_CAPTION_LENGTH}
      </p>
    </div>
  );
}
