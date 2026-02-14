import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { OnboardingPage } from './features/auth/pages/OnboardingPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { CreatePage } from './features/content/pages/CreatePage';
import { CreateReelPage } from './features/content/pages/CreateReelPage';
import { CreateCarouselPage } from './features/content/pages/CreateCarouselPage';
import { CreatePostPage } from './features/content/pages/CreatePostPage';
import { ProgressPage } from './features/content/pages/ProgressPage';
import { ContentPreviewPage } from './features/content/pages/ContentPreviewPage';
import { CalendarPage } from './features/calendar/pages/CalendarPage';
import { LibraryPage } from './features/publishing/pages/LibraryPage';
import { SettingsPage } from './features/auth/pages/SettingsPage';
import { ListaCodePage } from './features/promo/pages/ListaCodePage';

export const router = createBrowserRouter([
  // Public routes (no layout)
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/lista-code',
    element: <ListaCodePage />,
  },

  // Authenticated routes (AppLayout with sidebar + topbar)
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/create', element: <CreatePage /> },
      { path: '/create/reel', element: <CreateReelPage /> },
      { path: '/create/reel/:id/progress', element: <ProgressPage /> },
      { path: '/create/reel/:id/preview', element: <ContentPreviewPage /> },
      { path: '/create/carousel', element: <CreateCarouselPage /> },
      { path: '/create/carousel/:id/preview', element: <ContentPreviewPage /> },
      { path: '/create/post', element: <CreatePostPage /> },
      { path: '/create/post/:id/preview', element: <ContentPreviewPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/library', element: <LibraryPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]);
