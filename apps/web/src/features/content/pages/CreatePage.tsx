import { Link } from 'react-router-dom';
import { Film, Images, ImageIcon } from 'lucide-react';

export function CreatePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Create Content
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/create/reel"
          className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
        >
          <Film className="size-10 text-indigo-600" />
          <span className="text-sm font-medium text-foreground">New Reel</span>
          <span className="text-center text-xs text-foreground/70">
            Auto-montage from your video clips
          </span>
        </Link>

        <Link
          to="/create/carousel"
          className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
        >
          <Images className="size-10 text-indigo-600" />
          <span className="text-sm font-medium text-foreground">New Carousel</span>
          <span className="text-center text-xs text-foreground/70">
            Multi-slide posts with uploaded or AI images
          </span>
        </Link>

        <Link
          to="/create/post"
          className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
        >
          <ImageIcon className="size-10 text-indigo-600" />
          <span className="text-sm font-medium text-foreground">New Post</span>
          <span className="text-center text-xs text-foreground/70">
            Single image post with uploaded or AI image
          </span>
        </Link>
      </div>
    </div>
  );
}
