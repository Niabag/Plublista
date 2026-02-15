import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { Film, Images, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ContentItem } from '@publista/shared';

const TYPE_STYLES = {
  reel: 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  carousel: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  post: 'border-l-sky-500 bg-sky-50 dark:bg-sky-950/30',
} as const;

const TYPE_ICONS = {
  reel: Film,
  carousel: Images,
  post: ImageIcon,
} as const;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface CalendarContentCardProps {
  item: ContentItem;
  isDragOverlay?: boolean;
}

export function CalendarContentCard({ item, isDragOverlay }: CalendarContentCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  const Icon = TYPE_ICONS[item.type] ?? Film;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
      data-testid="calendar-card"
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          navigate(`/create/${item.type}/${item.id}/preview`);
        }
      }}
      className={cn(
        'flex cursor-grab items-center gap-1.5 rounded border-l-3 px-2 py-1 text-xs transition-opacity',
        TYPE_STYLES[item.type] ?? TYPE_STYLES.reel,
        isDragging && !isDragOverlay && 'opacity-30',
        isDragOverlay && 'shadow-lg ring-2 ring-indigo-400',
      )}
    >
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">
        {item.title ?? 'Untitled'}
      </span>
      {item.scheduledAt && (
        <span className="shrink-0 text-muted-foreground">
          {formatTime(item.scheduledAt)}
        </span>
      )}
    </div>
  );
}
