import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContentList } from '@/features/content/hooks/useContentList';
import { usePublishStatus } from '@/features/content/hooks/usePublishStatus';
import { useRetryPublish } from '@/features/content/hooks/useRetryPublish';
import { ContentCard } from '@/features/content/components/ContentCard';
import { ErrorDetailDialog } from '@/features/content/components/ErrorDetailDialog';
import type { ContentItem } from '@plublista/shared';

export function LibraryPage() {
  const { items, isPending, isError } = useContentList();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const { jobs } = usePublishStatus(selectedItem?.id ?? '', selectedItem?.status === 'failed');
  const { retry, isPending: isRetrying } = useRetryPublish();

  const handleFailedClick = useCallback((item: ContentItem) => {
    setSelectedItem(item);
  }, []);

  const handleRetry = useCallback(
    (platforms: string[]) => {
      if (!selectedItem) return;
      retry(
        { contentItemId: selectedItem.id, platforms },
        { onSuccess: () => setSelectedItem(null) },
      );
    },
    [selectedItem, retry],
  );

  const handleCloseDialog = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <p className="text-muted-foreground">Failed to load content library.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Content Library</h1>
        <Button asChild className="gap-2">
          <Link to="/create">
            <Plus className="size-4" />
            Create
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No content yet</p>
          <Button asChild variant="outline">
            <Link to="/create">Create your first content</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onFailedClick={handleFailedClick}
            />
          ))}
        </div>
      )}

      <ErrorDetailDialog
        open={selectedItem !== null}
        onClose={handleCloseDialog}
        item={selectedItem}
        jobs={jobs}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    </div>
  );
}
