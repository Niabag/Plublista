import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '@/features/public/components/PublicNavbar';
import { PublicFooter } from '@/features/public/components/PublicFooter';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-pub-bg text-pub-text">
      <PublicNavbar />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
