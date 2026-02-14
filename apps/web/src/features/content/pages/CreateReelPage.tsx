import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Film } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/useUiStore';
import { useFileUpload } from '@/features/upload/hooks/useFileUpload';
import { FileUploadZone } from '@/features/upload/components/FileUploadZone';
import { extractVideoThumbnail, extractVideoDuration, formatTotalDuration } from '@/features/upload/utils/videoMetadata';
import { ClipCard } from '../components/ClipCard';
import type { ClipData } from '../components/ClipCard';
import { MontageSettings } from '../components/MontageSettings';
import type { MontageSettingsValues } from '../components/MontageSettings';
import { apiPost } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_CLIPS = 10;

function SortableClipCard({
  clip,
  onRemove,
}: {
  clip: ClipData;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ClipCard clip={clip} onRemove={onRemove} dragHandleProps={listeners} isDragging={isDragging} />
    </div>
  );
}

export function CreateReelPage() {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [settings, setSettings] = useState<MontageSettingsValues>({
    style: 'dynamic',
    format: '9:16',
    duration: 30,
    music: 'auto-match',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  // Collapse sidebar on mount, restore on unmount
  useEffect(() => {
    if (!sidebarCollapsed) {
      toggleSidebar();
    }
    return () => {
      // Restore sidebar on unmount if we collapsed it
      // We use the store directly to check state at unmount time
      const currentState = useUiStore.getState().sidebarCollapsed;
      if (currentState) {
        useUiStore.getState().toggleSidebar();
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { uploads, isUploading, uploadFile, removeUpload } = useFileUpload();

  // Ref to access current clips without adding to useCallback deps
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      // Filter to video-only
      const videoFiles = files.filter((f) => ALLOWED_VIDEO_TYPES.includes(f.type));
      const rejected = files.length - videoFiles.length;
      if (rejected > 0) {
        toast.error('Only video files are accepted (MP4, MOV, WebM)');
      }

      // Enforce max clips
      const remaining = MAX_CLIPS - clipsRef.current.length;
      if (remaining <= 0) {
        toast.error('Maximum 10 clips per Auto-Montage');
        return;
      }

      const toProcess = videoFiles.slice(0, remaining);
      if (toProcess.length < videoFiles.length) {
        toast.error('Maximum 10 clips per Auto-Montage');
      }

      // Process all clips in parallel (not sequentially)
      for (const file of toProcess) {
        const clipId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Add clip in processing state
        setClips((prev) => [
          ...prev,
          {
            id: clipId,
            file,
            fileKey: '',
            fileName: file.name,
            thumbnailUrl: '',
            duration: 0,
            status: 'processing',
          },
        ]);

        // Fire off metadata extraction + upload in parallel (no await — all clips process concurrently)
        Promise.all([
          extractVideoThumbnail(file),
          extractVideoDuration(file),
          uploadFile(file),
        ])
          .then(([thumbnail, duration, uploadResult]) => {
            setClips((prev) =>
              prev.map((c) =>
                c.id === clipId
                  ? {
                      ...c,
                      thumbnailUrl: thumbnail,
                      duration,
                      fileKey: uploadResult?.fileKey || '',
                      status: uploadResult ? 'ready' : 'error',
                      error: uploadResult ? undefined : 'Upload failed',
                    }
                  : c,
              ),
            );
          })
          .catch(() => {
            setClips((prev) =>
              prev.map((c) =>
                c.id === clipId
                  ? { ...c, status: 'error', error: 'Failed to process video' }
                  : c,
              ),
            );
          });
      }
    },
    [uploadFile],
  );

  const handleRemoveClip = useCallback(
    (id: string) => {
      const clip = clipsRef.current.find((c) => c.id === id);
      if (clip) {
        removeUpload(clip.file);
      }
      setClips((prev) => prev.filter((c) => c.id !== id));
    },
    [removeUpload],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveClipId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveClipId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setClips((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveClipId(null);
  }, []);

  const totalDuration = clips
    .filter((c) => c.status === 'ready')
    .reduce((sum, c) => sum + c.duration, 0);

  const activeClip = activeClipId ? clips.find((c) => c.id === activeClipId) : null;
  const hasClips = clips.length > 0;
  const hasProcessing = clips.some((c) => c.status === 'processing' || c.status === 'uploading');
  const canGenerate = clips.some((c) => c.status === 'ready') && !hasProcessing;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleGenerate = useCallback(async () => {
    const currentClips = clipsRef.current;
    const currentSettings = settingsRef.current;
    const mediaUrls = currentClips.filter((c) => c.status === 'ready' && c.fileKey).map((c) => c.fileKey);
    if (mediaUrls.length === 0) return;

    setIsGenerating(true);
    try {
      const result = await apiPost<{ data: { id: string } }>('/api/content-items', {
        type: 'reel',
        mediaUrls,
        style: currentSettings.style,
        format: currentSettings.format,
        duration: currentSettings.duration,
        music: currentSettings.music,
      });
      navigate(`/create/reel/${result.data.id}/progress`);
    } catch {
      toast.error('Failed to create Auto-Montage. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [navigate]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Film className="size-6 text-indigo-600" />
        <h1 className="text-xl font-semibold text-foreground">
          New Auto-Montage
        </h1>
      </div>

      {/* Upload zone — only show if under max clips */}
      {clips.length < MAX_CLIPS && (
        <FileUploadZone
          uploads={uploads}
          isUploading={isUploading}
          onFilesSelected={handleFilesSelected}
          onRemove={(file) => {
            removeUpload(file);
            setClips((prev) => prev.filter((c) => c.file !== file));
          }}
          accept={ALLOWED_VIDEO_TYPES.join(',')}
          maxFiles={MAX_CLIPS}
          dropText="Drop your video clips here, or click to browse"
          activeDropText="Drop your video clips here"
          subtitleText="MP4, MOV, WebM"
        />
      )}

      {/* Clip grid with drag-and-drop */}
      {hasClips && (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={clips.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div
              className={cn(
                'grid gap-3',
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
              )}
            >
              {clips.map((clip) => (
                <SortableClipCard key={clip.id} clip={clip} onRemove={handleRemoveClip} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeClip ? (
              <ClipCard clip={activeClip} onRemove={() => {}} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Total duration */}
      {hasClips && totalDuration > 0 && (
        <p className="text-sm font-medium text-muted-foreground">
          {formatTotalDuration(totalDuration)}
        </p>
      )}

      {/* Generate button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!canGenerate || isGenerating}
        onClick={handleGenerate}
      >
        {isGenerating ? 'Generating...' : 'Generate Auto-Montage'}
      </Button>

      {/* Settings */}
      <MontageSettings value={settings} onChange={setSettings} />
    </div>
  );
}
