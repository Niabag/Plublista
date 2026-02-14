import { useState, useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export interface SlideData {
  id: string;
  imageKey: string;
  imageUrl: string;
  source: 'upload' | 'ai';
  status: 'empty' | 'uploading' | 'generating' | 'ready' | 'error';
  error?: string;
}

function createEmptySlide(): SlideData {
  return {
    id: crypto.randomUUID(),
    imageKey: '',
    imageUrl: '',
    source: 'upload',
    status: 'empty',
  };
}

const MIN_SLIDES = 2;
const MAX_SLIDES = 20;

export function useCarouselBuilder() {
  const [slides, setSlides] = useState<SlideData[]>([
    createEmptySlide(),
    createEmptySlide(),
  ]);

  const addSlide = useCallback(() => {
    setSlides((prev) => {
      if (prev.length >= MAX_SLIDES) return prev;
      return [...prev, createEmptySlide()];
    });
  }, []);

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => {
      if (prev.length <= MIN_SLIDES) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const duplicateSlide = useCallback((id: string) => {
    setSlides((prev) => {
      if (prev.length >= MAX_SLIDES) return prev;
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const duplicate: SlideData = {
        ...original,
        id: crypto.randomUUID(),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, duplicate);
      return next;
    });
  }, []);

  const reorderSlides = useCallback((activeId: string, overId: string) => {
    setSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === activeId);
      const newIndex = prev.findIndex((s) => s.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const updateSlide = useCallback((id: string, data: Partial<SlideData>) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
    );
  }, []);

  const isValid = useMemo(() => {
    const readySlides = slides.filter((s) => s.status === 'ready');
    return readySlides.length >= MIN_SLIDES;
  }, [slides]);

  const hasProcessing = useMemo(
    () => slides.some((s) => s.status === 'uploading' || s.status === 'generating'),
    [slides],
  );

  const toMediaUrls = useCallback(() => {
    return slides
      .filter((s) => s.status === 'ready' && s.imageKey)
      .map((s) => s.imageKey);
  }, [slides]);

  return {
    slides,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
    updateSlide,
    isValid,
    hasProcessing,
    toMediaUrls,
    canAddSlide: slides.length < MAX_SLIDES,
    canRemoveSlide: slides.length > MIN_SLIDES,
  };
}
