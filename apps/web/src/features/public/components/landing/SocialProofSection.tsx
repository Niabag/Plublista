import { LandingSection, useFadeUp } from './LandingSection';
import { Check, X } from 'lucide-react';

const MARQUEE_ITEMS = [
  '1 000+ contenus créés',
  '15+ plateformes supportées',
  'Note 4.8/5',
  'Zéro watermark sur les plans payants',
  'Publication en un clic',
  'IA de montage automatique',
];

const PAIN_POINTS = [
  'Canva pour le design',
  'CapCut pour la vidéo',
  'ChatGPT pour les textes',
  'Buffer pour la programmation',
  '45 min par Reel',
  'Watermarks pénalisés',
];

const SOLUTIONS = [
  'Un seul outil',
  '3 minutes par Reel',
  "Optimisé pour l'algorithme",
  'Publication multi-plateforme',
  'Zéro watermark',
  'Zéro pénalité',
];

export function SocialProofSection() {
  const fade = useFadeUp();

  return (
    <>
      {/* Marquee */}
      <div className="overflow-hidden border-y border-pub-border py-4">
        <div
          className="flex w-max animate-marquee gap-8"
          aria-hidden="true"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-sm font-medium text-pub-text-secondary"
            >
              {item}
              <span className="ml-8 text-pub-text-muted">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Problem → Solution */}
      <LandingSection>
        <div ref={fade.ref} className={fade.className}>
          <h2 className="mb-12 text-center text-3xl font-bold text-pub-text md:text-4xl">
            5 outils. Des heures perdues. Un seul résultat.
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Before */}
            <div className="rounded-2xl border border-pub-border bg-pub-card p-8">
              <h3 className="mb-6 text-lg font-semibold text-pub-text-muted">
                Avant Publista
              </h3>
              <ul className="space-y-4">
                {PAIN_POINTS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-pub-text-muted">
                    <X className="size-5 shrink-0 text-red-500/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-pub-accent/20 bg-pub-card p-8">
              <h3 className="mb-6 text-lg font-semibold text-pub-accent">
                Avec Publista
              </h3>
              <ul className="space-y-4">
                {SOLUTIONS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-pub-text">
                    <Check className="size-5 shrink-0 text-pub-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </LandingSection>
    </>
  );
}
