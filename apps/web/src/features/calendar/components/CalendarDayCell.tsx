import { useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ContentItem } from '@plublista/shared';
import { CalendarContentCard } from './CalendarContentCard';

const MAX_VISIBLE = 3;

interface CalendarDayCellProps {
  date: Date;
  items: ContentItem[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekView?: boolean;
}

export function CalendarDayCell({
  date,
  items,
  isToday,
  isCurrentMonth,
  isWeekView,
}: CalendarDayCellProps) {
  const dateId = date.toISOString().split('T')[0];
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({ id: dateId });

  const visibleItems = isWeekView ? items : items.slice(0, MAX_VISIBLE);
  const overflowCount = isWeekView ? 0 : Math.max(0, items.length - MAX_VISIBLE);

  return (
    <div
      ref={setNodeRef}
      data-testid={`day-${dateId}`}
      className={cn(
        'group relative border border-gray-200 p-1 dark:border-gray-700',
        isWeekView ? 'min-h-48' : 'min-h-24',
        !isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/50',
        isOver && 'bg-indigo-50 ring-2 ring-inset ring-indigo-400 dark:bg-indigo-950/30',
      )}
    >
      {/* Header: day number + quick-add */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs font-medium',
            isToday
              ? 'bg-indigo-600 text-white'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground',
          )}
        >
          {date.getDate()}
        </span>
        <button
          onClick={() => navigate('/create')}
          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-700"
          aria-label={`Add content for ${dateId}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Content cards */}
      <div className="space-y-0.5">
        {visibleItems.map((item) => (
          <CalendarContentCard key={item.id} item={item} />
        ))}
        {overflowCount > 0 && (
          <p className="text-center text-[10px] text-muted-foreground">
            +{overflowCount} more
          </p>
        )}
      </div>
    </div>
  );
}
