import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Lazy-loaded public pages
const LandingPage = lazy(() => import('./features/public/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const FeaturesPage = lazy(() => import('./features/public/pages/FeaturesPage').then(m => ({ default: m.FeaturesPage })));
const FullPricingPage = lazy(() => import('./features/public/pages/FullPricingPage').then(m => ({ default: m.FullPricingPage })));
const TermsPage = lazy(() => import('./features/public/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PlaceholderPage = lazy(() => import('./features/public/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));
const UseCasePage = lazy(() => import('./features/public/pages/UseCasePage').then(m => ({ default: m.UseCasePage })));
const ComparePage = lazy(() => import('./features/public/pages/ComparePage').then(m => ({ default: m.ComparePage })));
const HashtagGeneratorPage = lazy(() => import('./features/public/pages/HashtagGeneratorPage').then(m => ({ default: m.HashtagGeneratorPage })));
const CaptionGeneratorPage = lazy(() => import('./features/public/pages/CaptionGeneratorPage').then(m => ({ default: m.CaptionGeneratorPage })));
const BestTimeToPostPage = lazy(() => import('./features/public/pages/BestTimeToPostPage').then(m => ({ default: m.BestTimeToPostPage })));
const TvRedirectPage = lazy(() => import('./features/public/pages/TvRedirectPage').then(m => ({ default: m.TvRedirectPage })));
const NotFoundPage = lazy(() => import('./features/public/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ChangelogPage = lazy(() => import('./features/public/pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })));

// Lazy-loaded auth pages
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('./features/auth/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const ListaCodePage = lazy(() => import('./features/promo/pages/ListaCodePage').then(m => ({ default: m.ListaCodePage })));

// Lazy-loaded app pages
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CreatePage = lazy(() => import('./features/content/pages/CreatePage').then(m => ({ default: m.CreatePage })));
const CreateReelPage = lazy(() => import('./features/content/pages/CreateReelPage').then(m => ({ default: m.CreateReelPage })));
const CreateCarouselPage = lazy(() => import('./features/content/pages/CreateCarouselPage').then(m => ({ default: m.CreateCarouselPage })));
const CreatePostPage = lazy(() => import('./features/content/pages/CreatePostPage').then(m => ({ default: m.CreatePostPage })));
const ProgressPage = lazy(() => import('./features/content/pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const ContentPreviewPage = lazy(() => import('./features/content/pages/ContentPreviewPage').then(m => ({ default: m.ContentPreviewPage })));
const CalendarPage = lazy(() => import('./features/calendar/pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const LibraryPage = lazy(() => import('./features/publishing/pages/LibraryPage').then(m => ({ default: m.LibraryPage })));
const SettingsPage = lazy(() => import('./features/auth/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const BillingPage = lazy(() => import('./features/billing/pages/BillingPage').then(m => ({ default: m.BillingPage })));
const PricingPage = lazy(() => import('./features/billing/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const CheckoutSuccessPage = lazy(() => import('./features/billing/pages/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage').then(m => ({ default: m.AdminPage })));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Public marketing routes (PublicLayout — navbar + footer, no auth)
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LazyPage><LandingPage /></LazyPage> },
      { path: '/features', element: <LazyPage><FeaturesPage /></LazyPage> },
      { path: '/public-pricing', element: <LazyPage><FullPricingPage /></LazyPage> },
      { path: '/terms', element: <LazyPage><TermsPage /></LazyPage> },
      // Placeholder public pages
      { path: '/privacy', element: <LazyPage><PlaceholderPage /></LazyPage> },
      { path: '/data-deletion', element: <LazyPage><PlaceholderPage /></LazyPage> },
      { path: '/cookies', element: <LazyPage><PlaceholderPage /></LazyPage> },
      { path: '/changelog', element: <LazyPage><ChangelogPage /></LazyPage> },
      { path: '/templates', element: <LazyPage><PlaceholderPage /></LazyPage> },
      { path: '/help', element: <LazyPage><PlaceholderPage /></LazyPage> },
      // SEO pages (CF-4)
      { path: '/pour/:persona', element: <LazyPage><UseCasePage /></LazyPage> },
      { path: '/compare/:competitor', element: <LazyPage><ComparePage /></LazyPage> },
      // Micro-tools (CF-5)
      { path: '/tools/hashtag-generator', element: <LazyPage><HashtagGeneratorPage /></LazyPage> },
      { path: '/tools/caption-generator', element: <LazyPage><CaptionGeneratorPage /></LazyPage> },
      { path: '/tools/best-time-to-post', element: <LazyPage><BestTimeToPostPage /></LazyPage> },
      // Scan the TV (CF-6)
      { path: '/tv', element: <LazyPage><TvRedirectPage /></LazyPage> },
      // Catch-all 404
      { path: '*', element: <LazyPage><NotFoundPage /></LazyPage> },
    ],
  },

  // Auth routes (no layout wrapper)
  {
    path: '/register',
    element: <LazyPage><RegisterPage /></LazyPage>,
  },
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: '/onboarding',
    element: <LazyPage><OnboardingPage /></LazyPage>,
  },
  {
    path: '/lista-code',
    element: <LazyPage><ListaCodePage /></LazyPage>,
  },

  // Authenticated routes (AppLayout with sidebar + topbar)
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <LazyPage><DashboardPage /></LazyPage> },
      { path: '/create', element: <LazyPage><CreatePage /></LazyPage> },
      { path: '/create/reel', element: <LazyPage><CreateReelPage /></LazyPage> },
      { path: '/create/reel/:id/progress', element: <LazyPage><ProgressPage /></LazyPage> },
      { path: '/create/reel/:id/preview', element: <LazyPage><ContentPreviewPage /></LazyPage> },
      { path: '/create/carousel', element: <LazyPage><CreateCarouselPage /></LazyPage> },
      { path: '/create/carousel/:id/preview', element: <LazyPage><ContentPreviewPage /></LazyPage> },
      { path: '/create/post', element: <LazyPage><CreatePostPage /></LazyPage> },
      { path: '/create/post/:id/preview', element: <LazyPage><ContentPreviewPage /></LazyPage> },
      { path: '/calendar', element: <LazyPage><CalendarPage /></LazyPage> },
      { path: '/library', element: <LazyPage><LibraryPage /></LazyPage> },
      { path: '/billing', element: <LazyPage><BillingPage /></LazyPage> },
      { path: '/pricing', element: <LazyPage><PricingPage /></LazyPage> },
      { path: '/pricing/success', element: <LazyPage><CheckoutSuccessPage /></LazyPage> },
      { path: '/settings', element: <LazyPage><SettingsPage /></LazyPage> },
      { path: '/admin', element: <LazyPage><AdminPage /></LazyPage> },
    ],
  },
]);
