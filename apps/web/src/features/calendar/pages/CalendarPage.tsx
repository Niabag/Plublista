import { useState, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { ContentItem } from '@plublista/shared';
import { useCalendarContent, CALENDAR_CONTENT_QUERY_KEY } from '../hooks/useCalendarContent';
import { useReschedule } from '../hooks/useReschedule';
import { CalendarGrid } from '../components/CalendarGrid';
import { ContentMixIndicator } from '../components/ContentMixIndicator';

export function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { from, to } = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return { from: start.toISOString(), to: end.toISOString() };
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { from: start.toISOString(), to: end.toISOString() };
  }, [view, currentDate]);

  const { items, isPending } = useCalendarContent(from, to);
  const { reschedule } = useReschedule();

  const handleReschedule = useCallback(
    (itemId: string, newScheduledAt: string) => {
      // Optimistic update: move item in cache immediately
      queryClient.setQueryData(
        [CALENDAR_CONTENT_QUERY_KEY, from, to],
        (old: { data: ContentItem[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === itemId ? { ...item, scheduledAt: newScheduledAt } : item,
            ),
          };
        },
      );
      reschedule({ itemId, scheduledAt: newScheduledAt });
    },
    [queryClient, from, to, reschedule],
  );

  const goNext = () => {
    setCurrentDate((d) => (view === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  };

  const goPrev = () => {
    setCurrentDate((d) => (view === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h1>

        <div className="flex items-center gap-2">
          <ContentMixIndicator items={items} />

          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>

          <div className="flex rounded-md border">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
              } rounded-l-md`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
              } rounded-r-md`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {isPending ? (
        <div className="grid grid-cols-7 gap-0">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <CalendarGrid
          items={items}
          view={view}
          currentDate={currentDate}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}
