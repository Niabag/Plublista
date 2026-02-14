import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadZone } from './FileUploadZone';
import type { FileUploadState } from '../hooks/useFileUpload';

const mockOnFilesSelected = vi.fn();
const mockOnRemove = vi.fn();

function createFile(name: string, size: number, type: string): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('FileUploadZone', () => {
  it('renders the drop zone with instructions', () => {
    render(
      <FileUploadZone
        uploads={[]}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/MP4, MOV, WebM, JPG, PNG, WebP/)).toBeInTheDocument();
  });

  it('renders the hidden file input with correct accept types', () => {
    render(
      <FileUploadZone
        uploads={[]}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
      />,
    );

    const input = screen.getByLabelText('Upload files');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept');
  });

  it('calls onFilesSelected when files are chosen via input', async () => {
    const user = userEvent.setup();

    render(
      <FileUploadZone
        uploads={[]}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
      />,
    );

    const input = screen.getByLabelText('Upload files');
    const file = createFile('test.mp4', 1024, 'video/mp4');

    await user.upload(input, file);
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('renders uploaded file cards when uploads exist', () => {
    const uploads: FileUploadState[] = [
      {
        file: createFile('video.mp4', 1024, 'video/mp4'),
        progress: 100,
        status: 'complete',
        fileKey: 'users/123/uploads/abc-video.mp4',
      },
    ];

    render(
      <FileUploadZone
        uploads={uploads}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });

  it('hides drop zone when maxFiles is reached', () => {
    const uploads: FileUploadState[] = Array.from({ length: 10 }, (_, i) => ({
      file: createFile(`file-${i}.mp4`, 1024, 'video/mp4'),
      progress: 100,
      status: 'complete' as const,
      fileKey: `users/123/uploads/abc-file-${i}.mp4`,
    }));

    render(
      <FileUploadZone
        uploads={uploads}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
        maxFiles={10}
      />,
    );

    expect(screen.queryByText(/drag & drop/i)).not.toBeInTheDocument();
  });

  it('shows error state file cards', () => {
    const uploads: FileUploadState[] = [
      {
        file: createFile('bad.exe', 1024, 'application/x-msdownload'),
        progress: 0,
        status: 'error',
        error: 'Unsupported file type',
      },
    ];

    render(
      <FileUploadZone
        uploads={uploads}
        isUploading={false}
        onFilesSelected={mockOnFilesSelected}
        onRemove={mockOnRemove}
      />,
    );

    expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
  });
});
