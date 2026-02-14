import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sidebar, SidebarContent } from './Sidebar';
import { TopBar } from './TopBar';
import { useUiStore } from '@/stores/useUiStore';
import { useAuth } from '@/features/auth/hooks/useAuth';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/create': 'Create',
  '/calendar': 'Calendar',
  '/library': 'Library',
  '/settings': 'Settings',
};

export function AppLayout() {
  const location = useLocation();
  const sidebarMobileOpen = useUiStore((s) => s.sidebarMobileOpen);
  const setSidebarMobileOpen = useUiStore((s) => s.setSidebarMobileOpen);
  const { user, isSessionLoading } = useAuth();

  const darkMode = useUiStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [location.pathname, setSidebarMobileOpen]);

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboardingCompletedAt) {
    return <Navigate to="/onboarding" replace />;
  }

  const pageTitle = pageTitles[location.pathname] ?? 'Plublista';
  const showLavaLamp = location.pathname !== '/dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarMobileOpen} onOpenChange={setSidebarMobileOpen}>
        <SheetContent side="left" className="w-full p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <SidebarContent onNavigate={() => setSidebarMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {showLavaLamp && (
          <>
            <div className="lava-container !absolute">
              <div className="lava-blob lava-blob-1" />
              <div className="lava-blob lava-blob-2" />
              <div className="lava-blob lava-blob-3" />
              <div className="lava-blob lava-blob-4" />
              <div className="lava-blob lava-blob-5" />
            </div>
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/50" />
          </>
        )}
        <TopBar title={pageTitle} />
        <main className="relative z-20 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
