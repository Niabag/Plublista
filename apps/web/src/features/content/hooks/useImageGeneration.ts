import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';

interface GenerateImageResponse {
  data: { imageUrl: string };
}

interface GenerateImageInput {
  prompt: string;
}

export function useImageGeneration(contentItemId: string) {
  const mutation = useMutation({
    mutationFn: (data: GenerateImageInput) =>
      apiPost<GenerateImageResponse>(
        `/api/content-items/${contentItemId}/generate-image`,
        data,
      ),
  });

  return {
    generate: mutation.mutate,
    imageUrl: mutation.data?.data.imageUrl ?? null,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
