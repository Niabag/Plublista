import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ALLOWED_FILE_TYPES } from '@plublista/shared';
import type { FileUploadState } from '../hooks/useFileUpload';
import { UploadedFileCard } from './UploadedFileCard';

interface FileUploadZoneProps {
  uploads: FileUploadState[];
  isUploading: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemove: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  dropText?: string;
  activeDropText?: string;
  subtitleText?: string;
}

const DEFAULT_ACCEPT = ALLOWED_FILE_TYPES.join(',');

export function FileUploadZone({
  uploads,
  isUploading,
  onFilesSelected,
  onRemove,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  maxFiles = 10,
  dropText = 'Drag & drop files here, or click to browse',
  activeDropText = 'Drop files here',
  subtitleText = 'MP4, MOV, WebM, JPG, PNG, WebP',
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).slice(0, maxFiles - uploads.length);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [maxFiles, uploads.length, onFilesSelected],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFiles],
  );

  const canAddMore = uploads.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAddMore && (
        <button
          type="button"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragOver
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
              : 'border-border bg-muted hover:border-input hover:bg-accent',
            isUploading && 'cursor-not-allowed opacity-50',
          )}
        >
          <Upload
            className={cn(
              'size-8',
              isDragOver ? 'text-indigo-500' : 'text-muted-foreground',
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? activeDropText : dropText}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitleText}
            </p>
          </div>
        </button>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload files"
      />

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <UploadedFileCard
              key={upload.file.name + upload.file.lastModified}
              upload={upload}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
