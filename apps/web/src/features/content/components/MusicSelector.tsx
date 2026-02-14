import { Check, Music } from 'lucide-react';
import { cn } from '@/lib/cn';

export type MusicOption = 'auto-match';

interface MusicSelectorProps {
  selected: MusicOption;
  onSelect: (music: MusicOption) => void;
}

export function MusicSelector({ selected, onSelect }: MusicSelectorProps) {
  const isSelected = selected === 'auto-match';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Music</label>
      <div role="radiogroup" aria-label="Music">
        <button
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => onSelect('auto-match')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all',
            isSelected
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
          )}
        >
          <Music
            className={cn(
              'size-5 shrink-0',
              isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground',
            )}
          />
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium',
                isSelected
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-foreground',
              )}
            >
              Auto-match
            </p>
            <p className="text-xs text-muted-foreground">
              AI selects music that fits your style
            </p>
          </div>
          {isSelected && <Check className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        More options coming soon
      </p>
    </div>
  );
}
