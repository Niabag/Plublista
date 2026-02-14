import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '../components/landing/LandingSection';

export function NotFoundPage() {
  return (
    <LandingSection className="pt-24 md:pt-32">
      <div className="mx-auto max-w-xl text-center">
        {/* TV with static/snow effect */}
        <div className="relative mx-auto mb-8 size-48 md:size-64">
          <img
            src="/logo-qr.png"
            alt="404"
            className="h-full w-full object-contain opacity-50"
          />
          <div className="absolute inset-0 rounded-xl bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+')] animate-tv-flicker mix-blend-overlay" />
        </div>

        <h1 className="mb-4 text-5xl font-bold text-pub-text">404</h1>
        <p className="mb-2 text-xl font-semibold text-pub-text">
          Oups, cette page n'existe pas
        </p>
        <p className="mb-8 text-pub-text-secondary">
          Scannez la TV pour retrouver votre chemin, ou retournez à l'accueil.
        </p>

        <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 font-semibold text-white hover:bg-pub-accent-hover">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </LandingSection>
  );
}
