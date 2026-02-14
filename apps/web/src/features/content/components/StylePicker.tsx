import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRadioGroupKeyboard } from '../hooks/useRadioGroupKeyboard';

export type MontageStyle = 'dynamic' | 'cinematic' | 'ugc' | 'tutorial' | 'hype';

interface StyleOption {
  value: MontageStyle;
  label: string;
  description: string;
  gradient: string;
}

const STYLES: StyleOption[] = [
  {
    value: 'dynamic',
    label: 'Dynamic',
    description: 'Fast cuts, energetic transitions — great for product reveals',
    gradient: 'from-orange-400 to-rose-500',
  },
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Smooth movements, film-like feel — ideal for storytelling',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    value: 'ugc',
    label: 'UGC',
    description: 'Natural, authentic look — perfect for user-generated content',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    value: 'tutorial',
    label: 'Tutorial',
    description: 'Clear step-by-step flow — best for how-to content',
    gradient: 'from-purple-400 to-violet-500',
  },
  {
    value: 'hype',
    label: 'Hype',
    description: 'High-energy with effects — designed for announcements',
    gradient: 'from-yellow-400 to-amber-500',
  },
];

interface StylePickerProps {
  selected: MontageStyle;
  onSelect: (style: MontageStyle) => void;
}

const STYLE_VALUES = STYLES.map((s) => s.value);

export function StylePicker({ selected, onSelect }: StylePickerProps) {
  const { getTabIndex, handleKeyDown } = useRadioGroupKeyboard(STYLE_VALUES, selected, onSelect);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Style</label>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="radiogroup"
        aria-label="Style"
      >
        {STYLES.map((style, index) => {
          const isSelected = selected === style.value;
          return (
            <button
              key={style.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={getTabIndex(style.value)}
              onClick={() => onSelect(style.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all',
                isSelected
                  ? 'border-indigo-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-gray-600',
              )}
            >
              {/* Gradient thumbnail */}
              <div
                className={cn(
                  'flex h-20 items-center justify-center bg-gradient-to-br',
                  style.gradient,
                )}
              >
                {isSelected && (
                  <div className="flex size-7 items-center justify-center rounded-full bg-white/90">
                    <Check className="size-4 text-indigo-600" />
                  </div>
                )}
              </div>

              {/* Label + description */}
              <div className="px-2 py-2 text-left">
                <p
                  className={cn(
                    'text-xs font-semibold',
                    isSelected
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-foreground',
                  )}
                >
                  {style.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
