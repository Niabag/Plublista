import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '@/features/public/components/PublicNavbar';
import { PublicFooter } from '@/features/public/components/PublicFooter';

export function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-black text-pub-text">
      {/* Lava lamp effect layer */}
      <div className="lava-container">
        <div className="lava-blob lava-blob-1" />
        <div className="lava-blob lava-blob-2" />
        <div className="lava-blob lava-blob-3" />
        <div className="lava-blob lava-blob-4" />
        <div className="lava-blob lava-blob-5" />
      </div>

      {/* Black semi-transparent overlay */}
      <div className="fixed inset-0 z-10 bg-black/50" />

      {/* Content above overlay */}
      <div className="relative z-20">
        <PublicNavbar />
        <main>
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
