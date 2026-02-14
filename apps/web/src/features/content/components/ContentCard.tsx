import { useNavigate } from 'react-router-dom';
import { Film, Images, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusBadge } from './StatusBadge';
import type { ContentItem } from '@plublista/shared';

const TYPE_LABELS: Record<string, string> = {
  reel: 'Reel',
  carousel: 'Carousel',
  post: 'Post',
};

function getPreviewPath(item: ContentItem): string {
  return `/create/${item.type}/${item.id}/preview`;
}

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ContentCardProps {
  item: ContentItem;
  onFailedClick?: (item: ContentItem) => void;
}

export function ContentCard({ item, onFailedClick }: ContentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.status === 'failed' && onFailedClick) {
      onFailedClick(item);
    } else {
      navigate(getPreviewPath(item));
    }
  };

  const TypeIcon =
    item.type === 'carousel' ? Images : item.type === 'post' ? ImageIcon : Film;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg border bg-background p-4 text-left shadow-sm transition-colors hover:bg-accent/50',
        item.status === 'failed' && 'border-l-4 border-l-rose-500',
      )}
    >
      {/* Thumbnail area */}
      <div className="flex aspect-video items-center justify-center rounded-md bg-muted">
        <TypeIcon className="size-10 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-medium text-foreground">
          {item.title ?? 'Untitled'}
        </h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs text-muted-foreground">
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelativeDate(item.createdAt)}
        </span>
      </div>
    </button>
  );
}
