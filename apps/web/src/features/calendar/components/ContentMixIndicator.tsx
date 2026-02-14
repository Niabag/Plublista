import { useMemo } from 'react';
import { Film, Images, ImageIcon } from 'lucide-react';
import type { ContentItem } from '@plublista/shared';

interface ContentMixIndicatorProps {
  items: ContentItem[];
}

export function ContentMixIndicator({ items }: ContentMixIndicatorProps) {
  const counts = useMemo(() => {
    const c = { reel: 0, carousel: 0, post: 0 };
    for (const item of items) {
      if (item.type in c) c[item.type as keyof typeof c]++;
    }
    return c;
  }, [items]);

  const total = counts.reel + counts.carousel + counts.post;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs" data-testid="content-mix">
      {counts.reel > 0 && (
        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
          <Film className="size-3" />
          {counts.reel}
        </span>
      )}
      {counts.carousel > 0 && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Images className="size-3" />
          {counts.carousel}
        </span>
      )}
      {counts.post > 0 && (
        <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
          <ImageIcon className="size-3" />
          {counts.post}
        </span>
      )}
    </div>
  );
}
