import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film, Images, ImageIcon, Music, RefreshCw, Calendar, Send, CheckCircle, ExternalLink, Loader2, XCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiPost } from '@/lib/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useContentItem } from '../hooks/useContentItem';
import { useContentEdit } from '../hooks/useContentEdit';
import { usePublishContent } from '../hooks/usePublishContent';
import { usePublishStatus } from '../hooks/usePublishStatus';
import { useScheduleContent } from '../hooks/useScheduleContent';
import { usePlatformConnections } from '../hooks/usePlatformConnections';
import { PublishConfirmDialog } from '../components/PublishConfirmDialog';
import { PublishProgressDialog } from '../components/PublishProgressDialog';
import { ScheduleDialog } from '../components/ScheduleDialog';
import { CaptionEditor } from '../components/CaptionEditor';
import { HashtagEditor } from '../components/HashtagEditor';
import { useVideoPreview } from '../hooks/useVideoPreview';

export function ContentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { item, isPending, isError, refetch } = useContentItem(id ?? '');
  const { updateContent, isUpdating } = useContentEdit(id ?? '');
  const { publish, isPending: isPublishing } = usePublishContent(id ?? '');
  const { connectedPlatforms, ayrshareConnectUrl, getConnection } = usePlatformConnections(
    user?.subscriptionTier,
  );
  const { schedule, isScheduling, cancelSchedule, isCancelling } = useScheduleContent(id ?? '');
  const { previewUrl, isLoading: isPreviewLoading } = useVideoPreview(
    id ?? '',
    !!(item?.generatedMediaUrl),
  );
  const isPublishable = item?.status === 'draft' || item?.status === 'failed';
  const isInProgress = item?.status === 'scheduled' || item?.status === 'generating';
  const { jobs, latestJob } = usePublishStatus(id ?? '', isInProgress || item?.status === 'published');
  // Distinguish "scheduled for later" (pending jobs with scheduledAt) from "publishing in progress"
  const hasScheduledJobs = jobs.some((j) => j.status === 'pending');
  const isScheduledForLater = item?.status === 'scheduled' && hasScheduledJobs && !jobs.some((j) => j.status === 'publishing');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Auto-open progress dialog when publishing starts
  useEffect(() => {
    if (isInProgress && jobs.length > 0) {
      setShowProgressDialog(true);
    }
  }, [isInProgress, jobs.length]);

  const handleSaveCaption = useCallback(
    (caption: string) => {
      updateContent({ caption });
    },
    [updateContent],
  );

  const handleSaveHashtags = useCallback(
    (hashtags: string[]) => {
      updateContent({ hashtags });
    },
    [updateContent],
  );

  const handleSaveHookText = useCallback(
    (hookText: string) => {
      updateContent({ hookText });
    },
    [updateContent],
  );

  const handleSaveCtaText = useCallback(
    (ctaText: string) => {
      updateContent({ ctaText });
    },
    [updateContent],
  );

  const handleRegenerate = useCallback(async () => {
    if (!id) return;
    setIsRegenerating(true);
    try {
      await apiPost(`/api/content-items/${id}/generate-copy`, {});
      toast.success('Copy regenerated');
      refetch();
    } catch {
      toast.error('Failed to regenerate copy');
    } finally {
      setIsRegenerating(false);
    }
  }, [id, refetch]);

  const handlePublishConfirm = useCallback(
    (platforms: string[]) => {
      publish(platforms);
      setShowPublishDialog(false);
      setShowProgressDialog(true);
    },
    [publish],
  );

  const handleScheduleConfirm = useCallback(
    (data: { scheduledAt: string; platforms: string[] }) => {
      schedule(data);
      setShowScheduleDialog(false);
    },
    [schedule],
  );

  if (!id) return null;

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <p className="text-muted-foreground">Content item not found.</p>
        <Button variant="outline" onClick={() => navigate('/library')}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        {item.type === 'carousel' ? (
          <Images className="size-6 text-indigo-600" />
        ) : item.type === 'post' ? (
          <ImageIcon className="size-6 text-indigo-600" />
        ) : (
          <Film className="size-6 text-indigo-600" />
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {item.title ?? 'Content Preview'}
        </h1>
        {isUpdating && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>

      {/* Split Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel — Preview */}
        <div className="space-y-4">
          {item.type === 'carousel' && item.mediaUrls.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {item.mediaUrls.length} slides &middot; {item.format ?? '1:1'}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {item.mediaUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="absolute top-1 left-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="h-48 w-auto bg-gray-100 dark:bg-gray-800">
                      <div className="flex h-full items-center justify-center p-4">
                        <Images className="size-8 text-indigo-300 dark:text-gray-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : item.type === 'post' ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Single image &middot; {item.format ?? '1:1'}
              </p>
              <div className="mx-auto max-w-xs overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-800">
                  <div className="flex aspect-square items-center justify-center p-8">
                    <ImageIcon className="size-12 text-indigo-300 dark:text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {previewUrl ? (
                <div className={`mx-auto max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-black dark:border-gray-700`}>
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className={`w-full ${
                      item.format === '16:9'
                        ? 'aspect-video'
                        : item.format === '1:1'
                          ? 'aspect-square'
                          : 'aspect-[9/16]'
                    }`}
                  />
                </div>
              ) : item.status === 'generating' ? (
                <div className="mx-auto flex aspect-[9/16] max-w-xs items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="space-y-2 text-center">
                    <Loader2 className="mx-auto size-12 animate-spin text-indigo-400" />
                    <p className="text-sm text-muted-foreground">Rendering video...</p>
                    <p className="text-xs text-muted-foreground">
                      {item.format ?? '9:16'} &middot; {item.duration ?? 30}s
                    </p>
                  </div>
                </div>
              ) : isPreviewLoading ? (
                <div className="mx-auto flex aspect-[9/16] max-w-xs items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="space-y-2 text-center">
                    <Loader2 className="mx-auto size-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-muted-foreground">Loading preview...</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex aspect-[9/16] max-w-xs items-center justify-center rounded-2xl border-2 border-dashed border-gray-400 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="space-y-2 text-center">
                    <Film className="mx-auto size-12 text-indigo-300 dark:text-gray-600" />
                    <p className="text-sm text-muted-foreground">Video preview</p>
                    <p className="text-xs text-muted-foreground">
                      {item.format ?? '9:16'} &middot; {item.duration ?? 30}s
                    </p>
                  </div>
                </div>
              )}

              {/* Music Info */}
              {item.musicPrompt && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                  <Music className="size-4 text-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Generated Music
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.musicPrompt} &middot; {item.duration ?? 30}s
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel — Edit Form */}
        <div className="space-y-5">
          <CaptionEditor
            value={item.caption ?? ''}
            onSave={handleSaveCaption}
          />

          <HashtagEditor
            value={item.hashtags ?? []}
            onSave={handleSaveHashtags}
          />

          {/* Hook Text */}
          <div className="space-y-1">
            <label
              htmlFor="hook-text"
              className="text-sm font-medium text-foreground"
            >
              Hook Text
            </label>
            <HookField
              id="hook-text"
              value={item.hookText ?? ''}
              onSave={handleSaveHookText}
              placeholder="Attention-grabbing opening text..."
              maxLength={500}
            />
          </div>

          {/* CTA Text */}
          <div className="space-y-1">
            <label
              htmlFor="cta-text"
              className="text-sm font-medium text-foreground"
            >
              Call to Action
            </label>
            <HookField
              id="cta-text"
              value={item.ctaText ?? ''}
              onSave={handleSaveCtaText}
              placeholder="Follow for more!"
              maxLength={200}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`size-4 ${isRegenerating ? 'animate-spin' : ''}`}
              />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Copy'}
            </Button>
            {isScheduledForLater ? (
              <Button
                variant="outline"
                className="gap-2 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400"
                disabled={isCancelling}
                onClick={() => cancelSchedule()}
              >
                {isCancelling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                Cancel Schedule
              </Button>
            ) : (
              <Button
                variant="outline"
                className="gap-2"
                disabled={!isPublishable}
                onClick={() => setShowScheduleDialog(true)}
              >
                <Calendar className="size-4" />
                Schedule
              </Button>
            )}
            {item.status === 'published' && latestJob?.publishedUrl ? (
              <a
                href={latestJob.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <CheckCircle className="size-4" />
                Published
                <ExternalLink className="size-3" />
              </a>
            ) : isInProgress && !isScheduledForLater ? (
              <Button disabled className="gap-2">
                <Loader2 className="size-4 animate-spin" />
                Publishing...
              </Button>
            ) : isScheduledForLater ? (
              <Button disabled className="gap-2 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400" variant="outline">
                <Calendar className="size-4" />
                Scheduled
              </Button>
            ) : (
              <Button
                className="gap-2"
                disabled={!isPublishable}
                onClick={() => setShowPublishDialog(true)}
              >
                <Send className="size-4" />
                Publish Now
              </Button>
            )}
          </div>
        </div>
      </div>

      <PublishConfirmDialog
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onConfirm={handlePublishConfirm}
        isPending={isPublishing}
        userTier={user?.subscriptionTier ?? 'free'}
        connectedPlatforms={connectedPlatforms}
        ayrshareConnectUrl={ayrshareConnectUrl}
        instagramUsername={getConnection('instagram')?.platformUsername}
      />

      <ScheduleDialog
        open={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onConfirm={handleScheduleConfirm}
        isPending={isScheduling}
        userTier={user?.subscriptionTier ?? 'free'}
        connectedPlatforms={connectedPlatforms}
        ayrshareConnectUrl={ayrshareConnectUrl}
        instagramUsername={getConnection('instagram')?.platformUsername}
      />

      <PublishProgressDialog
        open={showProgressDialog}
        onClose={() => setShowProgressDialog(false)}
        jobs={jobs}
      />
    </div>
  );
}

/** Simple single-line text field with auto-save on blur */
function HookField({
  id,
  value,
  onSave,
  placeholder,
  maxLength,
}: {
  id: string;
  value: string;
  onSave: (val: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value.slice(0, maxLength))}
      onBlur={() => {
        if (text !== value) onSave(text);
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
    />
  );
}
