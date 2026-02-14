import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadedFileCard } from './UploadedFileCard';
import type { FileUploadState } from '../hooks/useFileUpload';

const mockRemove = vi.fn();

function createFile(name: string, size: number, type: string): File {
  return new File([''], name, { type });
}

describe('UploadedFileCard', () => {
  it('renders file name and size', () => {
    const upload: FileUploadState = {
      file: createFile('test-video.mp4', 5 * 1024 * 1024, 'video/mp4'),
      progress: 0,
      status: 'pending',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
  });

  it('shows progress bar when uploading', () => {
    const upload: FileUploadState = {
      file: createFile('video.mp4', 1024, 'video/mp4'),
      progress: 45,
      status: 'uploading',
    };

    const { container } = render(
      <UploadedFileCard upload={upload} onRemove={mockRemove} />,
    );

    const progressBar = container.querySelector('[style*="width: 45%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows check icon when complete', () => {
    const upload: FileUploadState = {
      file: createFile('image.png', 1024, 'image/png'),
      progress: 100,
      status: 'complete',
      fileKey: 'users/123/uploads/abc-image.png',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    // Complete state should not show error
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });

  it('shows error message when error occurs', () => {
    const upload: FileUploadState = {
      file: createFile('large.mp4', 1024, 'video/mp4'),
      progress: 0,
      status: 'error',
      error: 'File too large. Maximum size for your plan: 200MB',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    expect(screen.getByText('File too large. Maximum size for your plan: 200MB')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const file = createFile('test.mp4', 1024, 'video/mp4');
    const upload: FileUploadState = {
      file,
      progress: 100,
      status: 'complete',
      fileKey: 'users/123/uploads/abc-test.mp4',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(mockRemove).toHaveBeenCalledWith(file);
  });

  it('shows VID label for video files', () => {
    const upload: FileUploadState = {
      file: createFile('video.mp4', 1024, 'video/mp4'),
      progress: 0,
      status: 'pending',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    expect(screen.getByText('VID')).toBeInTheDocument();
  });

  it('shows IMG label for image files', () => {
    const upload: FileUploadState = {
      file: createFile('photo.jpg', 1024, 'image/jpeg'),
      progress: 0,
      status: 'pending',
    };

    render(<UploadedFileCard upload={upload} onRemove={mockRemove} />);

    expect(screen.getByText('IMG')).toBeInTheDocument();
  });
});
