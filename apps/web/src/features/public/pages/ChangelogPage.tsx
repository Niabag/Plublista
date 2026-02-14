import { LandingSection, useFadeUp } from '../components/landing/LandingSection';

type EntryCategory = 'Nouveau' | 'Amélioration' | 'Correction';

interface ChangelogEntry {
  date: string;
  headline: string;
  description: string;
  category: EntryCategory;
}

const CATEGORY_COLORS: Record<EntryCategory, string> = {
  Nouveau: 'bg-green-500/20 text-green-400',
  Amélioration: 'bg-blue-500/20 text-blue-400',
  Correction: 'bg-yellow-500/20 text-yellow-400',
};

// Changelog entries — add new entries at the top
const ENTRIES: ChangelogEntry[] = [
  {
    date: '14 février 2026',
    headline: 'Lancement du site marketing Publista',
    description:
      "Le nouveau site vitrine est en ligne ! Landing page immersive, pages de fonctionnalités, pricing détaillé, pages par persona, outils gratuits (générateur de hashtags, captions, meilleure heure de publication), et le système \"Scan the TV\" intégré.",
    category: 'Nouveau',
  },
  {
    date: '10 février 2026',
    headline: 'Watermark intelligent avec QR code',
    description:
      "Le watermark du plan gratuit inclut maintenant le logo TV Publista avec un QR code scannable. Les viewers de votre contenu peuvent découvrir Publista directement depuis vos vidéos.",
    category: 'Nouveau',
  },
  {
    date: '5 février 2026',
    headline: 'Amélioration du traitement vidéo',
    description:
      "Performance améliorée sur le pipeline de traitement vidéo. Les Reels sont maintenant générés 30% plus vite grâce à l'optimisation du système de queue BullMQ et une meilleure classification des erreurs.",
    category: 'Amélioration',
  },
  {
    date: '1 février 2026',
    headline: 'Publication multi-plateforme',
    description:
      'Publiez votre contenu sur Instagram, TikTok, YouTube, LinkedIn, Facebook et plus encore — directement depuis Publista, en un clic.',
    category: 'Nouveau',
  },
];

export function ChangelogPage() {
  return (
    <>
      <LandingSection className="pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-pub-text md:text-5xl">
            Changelog
          </h1>
          <p className="mb-8 text-pub-text-secondary">
            Les dernières nouveautés et améliorations de Publista.
          </p>

          {/* Newsletter CTA — visual only */}
          <div className="mx-auto flex max-w-md gap-2">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 rounded-xl border border-pub-border bg-pub-card px-4 py-2.5 text-sm text-pub-text placeholder:text-pub-text-muted focus:border-pub-accent focus:outline-none focus:ring-1 focus:ring-pub-accent"
            />
            <button className="rounded-xl bg-pub-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-pub-accent-hover">
              S'abonner
            </button>
          </div>
        </div>
      </LandingSection>

      <LandingSection>
        <div className="mx-auto max-w-3xl space-y-8">
          {ENTRIES.map((entry) => (
            <ChangelogCard key={entry.date + entry.headline} entry={entry} />
          ))}
        </div>
      </LandingSection>
    </>
  );
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const fade = useFadeUp();

  return (
    <div
      ref={fade.ref}
      className={`rounded-2xl border border-pub-border bg-pub-card p-6 md:p-8 ${fade.className}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-pub-text-muted">{entry.date}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[entry.category]}`}>
          {entry.category}
        </span>
      </div>
      <h2 className="mb-3 text-lg font-semibold text-pub-text">{entry.headline}</h2>
      <p className="text-sm leading-relaxed text-pub-text-secondary">{entry.description}</p>
      {/* Visual placeholder */}
      <div className="mt-4 aspect-video rounded-xl border border-pub-border/50 bg-pub-card-hover">
        <div className="flex h-full items-center justify-center text-xs text-pub-text-muted">
          Capture d'écran à venir
        </div>
      </div>
    </div>
  );
}
