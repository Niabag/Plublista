import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection, useFadeUp } from './LandingSection';

export function HeroSection() {
  const fade = useFadeUp();

  return (
    <LandingSection className="pt-24 md:pt-32 lg:pt-40">
      <div
        ref={fade.ref}
        className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${fade.className}`}
      >
        {/* Text column */}
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-pub-text md:text-5xl lg:text-[64px] lg:leading-[1.1]">
            Du contenu pro, partout, en 3&nbsp;minutes
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-pub-text-secondary md:text-lg">
            Publista transforme vos clips bruts en Reels, Carousels et Posts
            optimisés pour l'algorithme — et les publie sur Instagram, TikTok,
            YouTube et 15+ plateformes en un clic.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
              <Link to="/register">Commencer gratuitement</Link>
            </Button>
            <a
              href="#demo"
              className="text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Voir la démo &darr;
            </a>
          </div>

          <p className="mt-4 text-sm text-pub-text-muted">
            Pas de carte bancaire requise
          </p>
        </div>

        {/* Visual placeholder */}
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-pub-border bg-pub-card">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-pub-accent/20">
                <svg className="size-8 text-pub-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-pub-text-muted">Démo vidéo à venir</p>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
