import { Link } from 'react-router-dom';
import { Film, Images, ImageIcon, Plus, AlertCircle } from 'lucide-react';
import { useContentList } from '@/features/content/hooks/useContentList';
import { ContentCard } from '@/features/content/components/ContentCard';
import { QuotaIndicator } from '@/features/auth/components/QuotaIndicator';

const QUICK_CREATE_ITEMS = [
  {
    to: '/create/reel',
    icon: Film,
    label: 'New Reel',
    description: 'Auto-montage from your video clips',
  },
  {
    to: '/create/carousel',
    icon: Images,
    label: 'New Carousel',
    description: 'Multi-slide posts with uploaded or AI images',
  },
  {
    to: '/create/post',
    icon: ImageIcon,
    label: 'New Post',
    description: 'Single image post with uploaded or AI image',
  },
] as const;

const MAX_RECENT_ITEMS = 8;

function ContentSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: MAX_RECENT_ITEMS }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-background p-4 shadow-sm">
          <div className="aspect-video rounded-md bg-muted" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <Plus className="mx-auto size-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium text-foreground">No content yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first piece of content to get started.
      </p>
      <Link
        to="/create"
        className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Create Content
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <AlertCircle className="mx-auto size-12 text-rose-500/50" />
      <h3 className="mt-4 text-lg font-medium text-foreground">Failed to load content</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Retry
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { items, isPending, isError, refetch } = useContentList();

  const recentItems = items.slice(0, MAX_RECENT_ITEMS);
  const hasMore = items.length > MAX_RECENT_ITEMS;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      {/* Quick Create */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Quick Create
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_CREATE_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
            >
              <item.icon className="size-10 text-indigo-600" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-center text-xs text-foreground/70">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quota Overview */}
      <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <QuotaIndicator />
      </section>

      {/* Recent Content */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Content
          </h2>
          {hasMore && (
            <Link
              to="/library"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all
            </Link>
          )}
        </div>

        {isPending && <ContentSkeletonGrid />}
        {isError && <ErrorState onRetry={refetch} />}
        {!isPending && !isError && recentItems.length === 0 && <EmptyState />}
        {!isPending && !isError && recentItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentItems.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
