import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Images, ImageIcon, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusBadge } from './StatusBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ContentItem } from '@publista/shared';

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
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ContentCard({ item, onFailedClick, onDuplicate, onDelete }: ContentCardProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleClick = () => {
    if (item.status === 'failed' && onFailedClick) {
      onFailedClick(item);
    } else {
      navigate(getPreviewPath(item));
    }
  };

  const TypeIcon =
    item.type === 'carousel' ? Images : item.type === 'post' ? ImageIcon : Film;

  const hasMenu = onDuplicate || onDelete;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        'relative flex w-full cursor-pointer flex-col gap-3 rounded-lg border bg-background p-4 text-left shadow-sm transition-colors hover:bg-accent/50',
        item.status === 'failed' && 'border-l-4 border-l-rose-500',
      )}
    >
      {/* Menu button */}
      {hasMenu && (
        <div
          className="absolute right-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Content actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(item.id)}>
                  <Copy className="mr-2 size-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete content?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{item.title ?? 'Untitled'}&quot; and all
                  associated files. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete!(item.id)}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

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
    </div>
  );
}
