import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from 'date-fns';
import type { ContentItem } from '@publista/shared';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarContentCard } from './CalendarContentCard';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarGridProps {
  items: ContentItem[];
  view: 'month' | 'week';
  currentDate: Date;
  onReschedule: (itemId: string, newDate: string) => void;
}

export function CalendarGrid({
  items,
  view,
  currentDate,
  onReschedule,
}: CalendarGridProps) {
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);

  const days = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [view, currentDate]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of items) {
      if (!item.scheduledAt) continue;
      const key = new Date(item.scheduledAt).toISOString().split('T')[0];
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = items.find((i) => i.id === event.active.id);
      setActiveItem(item ?? null);
    },
    [items],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      if (!event.over) return;
      const itemId = event.active.id as string;
      const newDateStr = event.over.id as string;

      // Find the item to check if it's actually moving to a different date
      const item = items.find((i) => i.id === itemId);
      if (!item?.scheduledAt) return;
      const currentDateStr = new Date(item.scheduledAt).toISOString().split('T')[0];
      if (currentDateStr === newDateStr) return;

      // Keep the original time, just change the date
      const oldDate = new Date(item.scheduledAt);
      const [year, month, day] = newDateStr.split('-').map(Number);
      oldDate.setFullYear(year, month - 1, day);
      onReschedule(itemId, oldDate.toISOString());
    },
    [items, onReschedule],
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div data-testid="calendar-grid">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="border border-gray-200 bg-gray-50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground dark:border-gray-700 dark:bg-gray-900"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day) => {
            const dateKey = day.toISOString().split('T')[0];
            return (
              <CalendarDayCell
                key={dateKey}
                date={day}
                items={itemsByDate.get(dateKey) ?? []}
                isToday={isToday(day)}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isWeekView={view === 'week'}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <CalendarContentCard item={activeItem} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
