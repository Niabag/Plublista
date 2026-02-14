import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';

interface GenerateStandaloneImageResponse {
  data: { imageUrl: string; fileKey: string };
}

interface GenerateImageInput {
  prompt: string;
}

export function useStandaloneImageGeneration() {
  const mutation = useMutation({
    mutationFn: (data: GenerateImageInput) =>
      apiPost<GenerateStandaloneImageResponse>(
        '/api/content-items/generate-image',
        data,
      ),
  });

  return {
    generate: mutation.mutate,
    imageUrl: mutation.data?.data.imageUrl ?? null,
    fileKey: mutation.data?.data.fileKey ?? null,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
