import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '../components/landing/LandingSection';
import {
  Film,
  LayoutGrid,
  ImageIcon,
  PenTool,
  Music,
  Share2,
  CalendarDays,
  Maximize,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Film,
    title: 'Auto-Montage IA',
    headline: 'Des Reels pro en 3 minutes, sans toucher un logiciel de montage',
    points: [
      'Uploadez vos clips bruts, notre IA fait le montage',
      'Transitions, musique et textes ajoutés automatiquement',
      'Optimisé pour les algorithmes Instagram et TikTok',
      'Exportez en 9:16, 16:9 ou 1:1',
    ],
  },
  {
    icon: LayoutGrid,
    title: 'Carousel Builder',
    headline: 'Carousels qui convertissent, créés en quelques clics',
    points: [
      'Structurez 8-10 slides avec hook et CTA final',
      'Images IA ou vos propres visuels',
      "Optimisé pour l'engagement LinkedIn et Instagram",
      'Templates professionnels inclus',
    ],
  },
  {
    icon: ImageIcon,
    title: 'Créateur de Posts',
    headline: 'Posts visuels qui arrêtent le scroll',
    points: [
      "Générez des visuels percutants avec l'IA",
      'Adaptez le format à chaque plateforme',
      'Ajoutez texte, filtres et overlays',
      'Export haute qualité sans watermark',
    ],
  },
  {
    icon: PenTool,
    title: 'Copy IA',
    headline: 'Captions, hashtags et CTAs écrits par une IA experte',
    points: [
      'Captions adaptées au ton de votre marque',
      'Hashtags catégorisés : high-volume, medium, niche',
      'CTAs optimisés pour la conversion',
      'Supporte français, anglais et +10 langues',
    ],
  },
  {
    icon: Music,
    title: 'Musique IA',
    headline: 'Bandes-son originales, libres de droits',
    points: [
      'Musique générée par IA adaptée à votre contenu',
      'Aucun risque copyright sur Instagram ou TikTok',
      'Styles variés : énergique, chill, corporate...',
      'Synchronisation automatique avec les transitions',
    ],
  },
  {
    icon: Share2,
    title: 'Publication Multi-Plateforme',
    headline: 'Publiez partout en un clic, format adapté automatiquement',
    points: [
      'Instagram, TikTok, YouTube, LinkedIn, Facebook, X',
      '15+ plateformes supportées',
      'Format auto-adapté (9:16, 16:9, 1:1)',
      'Publication immédiate ou programmée',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Calendrier & Scheduling',
    headline: 'Planifiez toute votre semaine en une session',
    points: [
      'Vue calendrier de votre contenu planifié',
      'Suggestions de meilleure heure de publication',
      'Visualisez votre mix de contenu',
      'Drag & drop pour réorganiser',
    ],
  },
  {
    icon: Maximize,
    title: 'Sélection de Format',
    headline: 'Le bon format pour chaque plateforme, automatiquement',
    points: [
      'Portrait 9:16 pour Reels et TikTok',
      'Paysage 16:9 pour YouTube',
      'Carré 1:1 pour le feed Instagram',
      'Recadrage intelligent par IA',
    ],
  },
] as const;

const PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'LinkedIn',
  'X (Twitter)',
  'Pinterest',
  'Threads',
];

export function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <LandingSection className="pt-24 text-center md:pt-32">
        <h1 className="text-4xl font-bold text-pub-text md:text-5xl lg:text-6xl">
          Tout ce dont vous avez besoin pour créer du contenu pro
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pub-text-secondary">
          De la création au publishing, Publista centralise tous vos outils en
          une seule plateforme propulsée par l'IA.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
            <Link to="/register">Commencer gratuitement</Link>
          </Button>
        </div>
      </LandingSection>

      {/* Feature blocks — alternating layout */}
      {FEATURES.map((f, i) => {
        const reverse = i % 2 === 1;
        return (
          <LandingSection key={f.title}>
            <div className={`grid items-center gap-10 md:grid-cols-2 ${reverse ? 'md:[direction:rtl]' : ''}`}>
              <div className={reverse ? 'md:[direction:ltr]' : ''}>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-pub-accent/10">
                  <f.icon className="size-6 text-pub-accent" />
                </div>
                <h2 className="mb-4 text-2xl font-bold text-pub-text md:text-3xl">
                  {f.headline}
                </h2>
                <ul className="space-y-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-pub-text-secondary">
                      <span className="mt-1 text-pub-accent">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`aspect-video rounded-2xl border border-pub-border bg-pub-card ${reverse ? 'md:[direction:ltr]' : ''}`}>
                <div className="flex h-full items-center justify-center text-sm text-pub-text-muted">
                  {f.title} — visuel à venir
                </div>
              </div>
            </div>
          </LandingSection>
        );
      })}

      {/* Integrations */}
      <LandingSection className="text-center">
        <h2 className="mb-8 text-3xl font-bold text-pub-text">
          Intégrations supportées
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {PLATFORMS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-pub-border bg-pub-card px-5 py-2 text-sm text-pub-text-secondary"
            >
              {p}
            </span>
          ))}
        </div>
      </LandingSection>

      {/* Final CTA */}
      <LandingSection className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-pub-text md:text-4xl">
          Prêt à passer à la vitesse supérieure ?
        </h2>
        <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
          <Link to="/register">Commencer gratuitement</Link>
        </Button>
      </LandingSection>
    </>
  );
}
