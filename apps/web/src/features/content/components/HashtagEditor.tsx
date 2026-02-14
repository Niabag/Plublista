import { useState, useCallback, useEffect, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface HashtagEditorProps {
  value: string[];
  onSave: (hashtags: string[]) => void;
  disabled?: boolean;
}

const MAX_TAGS = 30;

export function HashtagEditor({ value, onSave, disabled }: HashtagEditorProps) {
  const [tags, setTags] = useState<string[]>(value);
  const [input, setInput] = useState('');

  useEffect(() => {
    setTags(value);
  }, [value]);

  const saveAndUpdate = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      onSave(newTags);
    },
    [onSave],
  );

  const addTag = useCallback(() => {
    const cleaned = input.replace(/^#/, '').trim().replace(/[^\w]/g, '');
    if (!cleaned || cleaned.length > 50 || tags.includes(cleaned) || tags.length >= MAX_TAGS)
      return;
    saveAndUpdate([...tags, cleaned]);
    setInput('');
  }, [input, tags, saveAndUpdate]);

  const removeTag = useCallback(
    (tag: string) => {
      saveAndUpdate(tags.filter((t) => t !== tag));
    },
    [tags, saveAndUpdate],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
      if (e.key === 'Backspace' && !input && tags.length > 0) {
        saveAndUpdate(tags.slice(0, -1));
      }
    },
    [addTag, input, tags, saveAndUpdate],
  );

  return (
    <div className="space-y-1">
      <label
        htmlFor="hashtag-input"
        className="text-sm font-medium text-foreground"
      >
        Hashtags
      </label>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5',
          'border-gray-300 dark:border-gray-700',
          'bg-white dark:bg-gray-900',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            id="hashtag-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input.trim()) addTag(); }}
            disabled={disabled}
            placeholder={tags.length === 0 ? 'Add hashtags...' : ''}
            className="min-w-[80px] flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {tags.length} / {MAX_TAGS} tags. Press Enter to add.
      </p>
    </div>
  );
}
