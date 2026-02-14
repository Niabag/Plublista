import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRadioGroupKeyboard } from '../hooks/useRadioGroupKeyboard';
import { StylePicker } from './StylePicker';
import type { MontageStyle } from './StylePicker';
import { FormatPreview } from './FormatPreview';
import type { MontageFormat } from './FormatPreview';
import { MusicSelector } from './MusicSelector';
import type { MusicOption } from './MusicSelector';

export type { MontageStyle } from './StylePicker';
export type { MontageFormat } from './FormatPreview';
export type { MusicOption } from './MusicSelector';
export type MontageDuration = 15 | 30 | 60;

export interface MontageSettingsValues {
  style: MontageStyle;
  format: MontageFormat;
  duration: MontageDuration;
  music: MusicOption;
}

interface MontageSettingsProps {
  value: MontageSettingsValues;
  onChange: (settings: MontageSettingsValues) => void;
}

const DURATIONS: { value: MontageDuration; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

const DURATION_VALUES = DURATIONS.map((d) => d.value);

export function MontageSettings({ value, onChange }: MontageSettingsProps) {
  const [expanded, setExpanded] = useState(true);
  const { getTabIndex: getDurationTabIndex, handleKeyDown: handleDurationKeyDown } =
    useRadioGroupKeyboard(DURATION_VALUES, value.duration, (d) => onChange({ ...value, duration: d }));

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
        aria-expanded={expanded}
      >
        <span>Settings</span>
        <ChevronDown
          className={cn('size-4 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <StylePicker
            selected={value.style}
            onSelect={(style) => onChange({ ...value, style })}
          />

          <FormatPreview
            selected={value.format}
            onSelect={(format) => onChange({ ...value, format })}
          />

          {/* Duration — simple button group */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Duration
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Duration">
              {DURATIONS.map((opt, index) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={value.duration === opt.value}
                  tabIndex={getDurationTabIndex(opt.value)}
                  onClick={() => onChange({ ...value, duration: opt.value })}
                  onKeyDown={(e) => handleDurationKeyDown(e, index)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    value.duration === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-gray-200 bg-white text-muted-foreground hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <MusicSelector
            selected={value.music}
            onSelect={(music) => onChange({ ...value, music })}
          />
        </div>
      )}
    </div>
  );
}
