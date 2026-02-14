import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRadioGroupKeyboard } from '../hooks/useRadioGroupKeyboard';

export type MontageFormat = '9:16' | '16:9' | '1:1';

interface FormatOption {
  value: MontageFormat;
  label: string;
  widthClass: string;
  heightClass: string;
}

const FORMATS: FormatOption[] = [
  { value: '9:16', label: '9:16', widthClass: 'w-10', heightClass: 'h-16' },
  { value: '16:9', label: '16:9', widthClass: 'w-16', heightClass: 'h-10' },
  { value: '1:1', label: '1:1', widthClass: 'w-12', heightClass: 'h-12' },
];

interface FormatPreviewProps {
  selected: MontageFormat;
  onSelect: (format: MontageFormat) => void;
}

const FORMAT_VALUES = FORMATS.map((f) => f.value);

export function FormatPreview({ selected, onSelect }: FormatPreviewProps) {
  const { getTabIndex, handleKeyDown } = useRadioGroupKeyboard(FORMAT_VALUES, selected, onSelect);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Format</label>
      <div className="flex gap-4" role="radiogroup" aria-label="Format">
        {FORMATS.map((format, index) => {
          const isSelected = selected === format.value;
          return (
            <button
              key={format.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={getTabIndex(format.value)}
              onClick={() => onSelect(format.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-950'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800',
              )}
            >
              {/* Proportional frame */}
              <div
                className={cn(
                  'relative flex items-center justify-center rounded border-2',
                  format.widthClass,
                  format.heightClass,
                  isSelected
                    ? 'border-indigo-400 bg-indigo-100 dark:border-indigo-500 dark:bg-indigo-900'
                    : 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700',
                )}
              >
                {isSelected && <Check className="size-3.5 text-indigo-600 dark:text-indigo-400" />}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium',
                  isSelected
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-muted-foreground',
                )}
              >
                {format.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
