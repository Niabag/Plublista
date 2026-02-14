import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreateReelPage } from './CreateReelPage';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock apiClient
const mockApiPost = vi.fn().mockResolvedValue({ data: { id: 'item-1' } });
vi.mock('@/lib/apiClient', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

// Mock useUiStore
const mockToggleSidebar = vi.fn();
vi.mock('@/stores/useUiStore', () => ({
  useUiStore: Object.assign(
    (selector: (state: { sidebarCollapsed: boolean; toggleSidebar: () => void }) => unknown) =>
      selector({ sidebarCollapsed: false, toggleSidebar: mockToggleSidebar }),
    {
      getState: () => ({ sidebarCollapsed: true, toggleSidebar: mockToggleSidebar }),
    },
  ),
}));

// Mock useFileUpload
const mockUploadFile = vi.fn().mockResolvedValue({ fileKey: 'key-123' });
const mockRemoveUpload = vi.fn();
vi.mock('@/features/upload/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    uploads: [],
    isUploading: false,
    uploadFile: mockUploadFile,
    removeUpload: mockRemoveUpload,
    clearUploads: vi.fn(),
    completedKeys: [],
  }),
}));

// Mock video metadata
vi.mock('@/features/upload/utils/videoMetadata', () => ({
  extractVideoThumbnail: vi.fn().mockResolvedValue('data:image/jpeg;base64,thumb'),
  extractVideoDuration: vi.fn().mockResolvedValue(30),
  formatDuration: (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`,
  formatTotalDuration: (s: number) => `Total: ${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')} of raw footage`,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateReelPage />
    </MemoryRouter>,
  );
}

describe('CreateReelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('New Auto-Montage')).toBeInTheDocument();
  });

  it('renders upload zone with video-specific text', () => {
    renderPage();
    expect(screen.getByText(/drop your video clips here/i)).toBeInTheDocument();
  });

  it('renders the generate button disabled initially', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /generate auto-montage/i });
    expect(button).toBeDisabled();
  });

  it('renders settings panel expanded with style, format, duration, and music options', () => {
    renderPage();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Settings expanded by default — options are visible
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
    expect(screen.getByText('Cinematic')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('Auto-match')).toBeInTheDocument();
  });

  it('collapses settings panel on click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Settings'));

    expect(screen.queryByText('Dynamic')).not.toBeInTheDocument();
    expect(screen.queryByText('9:16')).not.toBeInTheDocument();
  });

  it('collapses sidebar on mount', () => {
    renderPage();
    expect(mockToggleSidebar).toHaveBeenCalled();
  });
});
