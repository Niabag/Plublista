import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Film, LayoutGrid, Share2, CalendarDays } from 'lucide-react';
import { LandingSection, useFadeUp } from './LandingSection';

const FEATURES = [
  {
    icon: Film,
    title: 'Reels en pilote automatique',
    description:
      "Uploadez vos clips, l'IA monte un Reel optimisé avec transitions, musique et textes. En 3 minutes.",
  },
  {
    icon: LayoutGrid,
    title: 'Carousels qui convertissent',
    description:
      "Images IA ou vos propres visuels, structurés en 8-10 slides avec hook et CTA final. Optimisé pour l'engagement.",
  },
  {
    icon: Share2,
    title: 'Publiez partout, en un clic',
    description:
      'Instagram, TikTok, YouTube, LinkedIn, Facebook et 15+ plateformes. Format adapté automatiquement.',
  },
  {
    icon: CalendarDays,
    title: 'Calendrier intelligent',
    description:
      'Planifiez toute votre semaine en une session. Visualisez votre mix de contenu. Publiez au moment optimal.',
  },
] as const;

export function FeaturesSection() {
  const fade = useFadeUp();

  return (
    <>
      <LandingSection>
        <div ref={fade.ref} className={fade.className}>
          <h2 className="mb-12 text-center text-3xl font-bold text-pub-text md:text-4xl">
            Tout ce qu'il faut pour créer du contenu qui performe
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-pub-border bg-pub-card p-8 transition-all duration-200 hover:scale-[1.02] hover:border-pub-accent/20"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-pub-accent/10">
                  <f.icon className="size-6 text-pub-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-pub-text">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-pub-text-secondary">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      {/* Product Demo */}
      <LandingSection id="demo">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-pub-text md:text-4xl">
            Voyez Publista en action
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-pub-text-secondary">
            De l'upload de vos clips à la publication sur toutes vos plateformes
            en quelques clics.
          </p>

          {/* Video placeholder */}
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-pub-border bg-pub-card">
            <div className="flex aspect-video items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-full bg-pub-accent/20">
                  <svg className="size-10 text-pub-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-pub-text-muted">Vidéo de démo à venir</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
              <Link to="/register">Essayez vous-même — c'est gratuit</Link>
            </Button>
          </div>
        </div>
      </LandingSection>
    </>
  );
}
