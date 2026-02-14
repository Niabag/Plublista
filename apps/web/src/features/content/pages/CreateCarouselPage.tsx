import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Images, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/useUiStore';
import { useCarouselBuilder } from '../hooks/useCarouselBuilder';
import { SlideCard } from '../components/SlideCard';
import { FormatPreview } from '../components/FormatPreview';
import { apiPost } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';

export function CreateCarouselPage() {
  const {
    slides,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
    updateSlide,
    isValid,
    hasProcessing,
    toMediaUrls,
    canAddSlide,
    canRemoveSlide,
  } = useCarouselBuilder();

  const [format, setFormat] = useState<'9:16' | '16:9' | '1:1'>('1:1');
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  // Collapse sidebar on mount, restore on unmount
  useEffect(() => {
    if (!sidebarCollapsed) {
      toggleSidebar();
    }
    return () => {
      const currentState = useUiStore.getState().sidebarCollapsed;
      if (currentState) {
        useUiStore.getState().toggleSidebar();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveSlideId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveSlideId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderSlides(active.id as string, over.id as string);
      }
    },
    [reorderSlides],
  );

  const handleDragCancel = useCallback(() => {
    setActiveSlideId(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const mediaUrls = toMediaUrls();
    if (mediaUrls.length < 2) {
      toast.error('Carousels require at least 2 slides with images');
      return;
    }

    setIsCreating(true);
    try {
      const result = await apiPost<{ data: { id: string } }>('/api/content-items', {
        type: 'carousel',
        mediaUrls,
        format,
      });
      navigate(`/create/carousel/${result.data.id}/preview`);
    } catch {
      toast.error('Failed to create carousel. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [toMediaUrls, format, navigate]);

  const activeSlide = activeSlideId ? slides.find((s) => s.id === activeSlideId) : null;
  const readyCount = slides.filter((s) => s.status === 'ready').length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Images className="size-6 text-indigo-600" />
        <h1 className="text-xl font-semibold text-foreground">
          New Carousel
        </h1>
        <span className="text-sm text-muted-foreground">
          {readyCount} / {slides.length} slides ready
        </span>
      </div>

      {/* Format selector */}
      <FormatPreview
        selected={format}
        onSelect={(f) => setFormat(f)}
      />

      {/* Slide grid with drag-and-drop */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div
            className={cn(
              'grid gap-4',
              format === '9:16'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : format === '1:1'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                onRemove={removeSlide}
                onDuplicate={duplicateSlide}
                onUpdate={updateSlide}
                canRemove={canRemoveSlide}
                canDuplicate={canAddSlide}
                format={format}
              />
            ))}

            {/* Add slide button */}
            {canAddSlide && (
              <button
                onClick={addSlide}
                className={cn(
                  'flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-950',
                  format === '16:9' ? 'aspect-video' : format === '1:1' ? 'aspect-square' : 'aspect-[9/16]',
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Plus className="size-6 text-indigo-400" />
                  <span className="text-xs text-foreground/70">Add Slide</span>
                </div>
              </button>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSlide ? (
            <div className="rounded-lg border bg-card opacity-80 shadow-lg">
              {activeSlide.imageUrl ? (
                <img
                  src={activeSlide.imageUrl}
                  alt="Dragging"
                  className={cn(
                    'rounded-lg object-cover',
                    format === '16:9' ? 'aspect-video' : format === '1:1' ? 'aspect-square' : 'aspect-[9/16]',
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg bg-muted',
                    format === '16:9' ? 'aspect-video' : format === '1:1' ? 'aspect-square' : 'aspect-[9/16]',
                  )}
                >
                  <span className="text-sm text-muted-foreground">Slide {slides.findIndex((s) => s.id === activeSlide.id) + 1}</span>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!isValid || hasProcessing || isCreating}
        onClick={handleCreate}
      >
        {isCreating ? 'Creating Carousel...' : `Create Carousel (${readyCount} slides)`}
      </Button>
    </div>
  );
}
