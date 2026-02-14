import { useParams, Navigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Minus } from 'lucide-react';
import { LandingSection } from '../components/landing/LandingSection';

interface CompetitorData {
  name: string;
  metaTitle: string;
  metaDescription: string;
  verdict: string;
  strengths: string[];
  publistaDiff: string[];
  features: { feature: string; publista: string; competitor: string }[];
  pricingNote: string;
}

const COMPETITORS: Record<string, CompetitorData> = {
  canva: {
    name: 'Canva',
    metaTitle: 'Publista vs Canva — Comparatif complet 2026',
    metaDescription:
      'Comparaison détaillée entre Publista et Canva pour la création de contenu social media. Fonctionnalités, prix et différences clés.',
    verdict:
      "Canva excelle dans le design graphique statique et les templates. Publista se concentre sur la création vidéo IA automatisée et la publication multi-plateforme. Si votre priorité est les Reels et la vidéo, Publista est le meilleur choix.",
    strengths: [
      'Bibliothèque massive de templates graphiques',
      'Éditeur de design intuitif et mature',
      'Version gratuite très généreuse pour le design statique',
      'Collaboration en temps réel sur les designs',
    ],
    publistaDiff: [
      'Auto-montage IA de Reels à partir de clips bruts',
      'Publication directe sur 15+ plateformes',
      'Musique IA libre de droits intégrée',
      'Optimisation algorithmique du contenu',
      'Calendrier de publication intelligent',
    ],
    features: [
      { feature: 'Montage vidéo IA', publista: '✓', competitor: 'Limité' },
      { feature: 'Templates design', publista: 'Basique', competitor: '✓' },
      { feature: 'Carousels', publista: '✓', competitor: '✓' },
      { feature: 'Publication multi-plateforme', publista: '✓', competitor: '—' },
      { feature: 'Musique IA', publista: '✓', competitor: '—' },
      { feature: 'Calendrier scheduling', publista: '✓', competitor: 'Via Content Planner' },
      { feature: 'Copy IA (captions)', publista: '✓', competitor: 'Magic Write' },
      { feature: 'Optimisation algorithme', publista: '✓', competitor: '—' },
    ],
    pricingNote:
      'Canva Pro : 11,99€/mois. Publista Pro : 79€/mois. Publista remplace Canva + CapCut + ChatGPT + Buffer, ce qui revient moins cher que 4 abonnements séparés.',
  },
  capcut: {
    name: 'CapCut',
    metaTitle: 'Publista vs CapCut — Comparatif complet 2026',
    metaDescription:
      'Comparaison entre Publista et CapCut pour le montage vidéo. Auto-montage IA vs éditeur manuel, publication, pricing.',
    verdict:
      "CapCut est un excellent éditeur vidéo manuel avec des effets TikTok. Publista automatise le montage entier avec l'IA et ajoute la publication multi-plateforme. Si vous voulez gagner du temps, Publista est le choix évident.",
    strengths: [
      'Éditeur vidéo puissant avec timeline complète',
      'Effets et filtres optimisés pour TikTok',
      'Version gratuite très complète',
      'Intégration native avec TikTok',
    ],
    publistaDiff: [
      'Montage 100% automatique par IA (pas de timeline)',
      'De 45 min à 3 min par Reel',
      'Publication sur 15+ plateformes (pas juste TikTok)',
      'Génération de captions et hashtags par IA',
      'Calendrier de planification intégré',
    ],
    features: [
      { feature: 'Montage vidéo IA auto', publista: '✓', competitor: '—' },
      { feature: 'Éditeur timeline manuel', publista: '—', competitor: '✓' },
      { feature: 'Effets TikTok', publista: 'Basique', competitor: '✓' },
      { feature: 'Publication multi-plateforme', publista: '✓', competitor: 'TikTok uniquement' },
      { feature: 'Musique IA', publista: '✓', competitor: 'Bibliothèque' },
      { feature: 'Captions IA', publista: '✓', competitor: 'Sous-titres auto' },
      { feature: 'Carousels', publista: '✓', competitor: '—' },
      { feature: 'Calendrier', publista: '✓', competitor: '—' },
    ],
    pricingNote:
      "CapCut Pro : 7,99€/mois. Publista Pro : 79€/mois. CapCut est un éditeur, Publista est une plateforme complète qui remplace l'éditeur + le scheduling + le copywriting.",
  },
  'opus-clip': {
    name: 'Opus Clip',
    metaTitle: 'Publista vs Opus Clip — Comparatif complet 2026',
    metaDescription:
      "Comparaison entre Publista et Opus Clip pour la création de clips courts. IA, multi-plateforme, pricing et différences clés.",
    verdict:
      "Opus Clip est spécialisé dans le découpage de vidéos longues en clips courts. Publista va plus loin avec la création complète (Reels, Carousels, Posts), la publication et le scheduling. Si vous cherchez un outil all-in-one, Publista gagne.",
    strengths: [
      "Excellent pour découper des podcasts/webinaires en clips",
      "Détection automatique des moments forts",
      "Score de viralité par clip",
      "Sous-titres automatiques de qualité",
    ],
    publistaDiff: [
      "Création de contenu original (pas juste du découpage)",
      "Carousels et Posts en plus des vidéos",
      "Publication directe sur 15+ plateformes",
      "Calendrier de planification intégré",
      "Musique IA originale libre de droits",
    ],
    features: [
      { feature: 'Découpe vidéo longue → clips', publista: '—', competitor: '✓' },
      { feature: 'Création de Reels originaux', publista: '✓', competitor: '—' },
      { feature: 'Carousels', publista: '✓', competitor: '—' },
      { feature: 'Posts statiques', publista: '✓', competitor: '—' },
      { feature: 'Publication multi-plateforme', publista: '✓', competitor: 'Limité' },
      { feature: 'Musique IA', publista: '✓', competitor: '—' },
      { feature: 'Captions IA', publista: '✓', competitor: 'Sous-titres' },
      { feature: 'Calendrier', publista: '✓', competitor: '—' },
    ],
    pricingNote:
      "Opus Clip Pro : 19€/mois. Publista Pro : 79€/mois. Opus Clip est un outil de découpe, Publista est une plateforme complète de création et publication.",
  },
};

export function ComparePage() {
  const { competitor } = useParams<{ competitor: string }>();
  const data = competitor ? COMPETITORS[competitor] : undefined;

  useEffect(() => {
    if (data) {
      document.title = data.metaTitle;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', data.metaDescription);
    }
  }, [data]);

  if (!data) return <Navigate to="/" replace />;

  return (
    <>
      {/* Hero */}
      <LandingSection className="pt-24 text-center md:pt-32">
        <h1 className="text-3xl font-bold text-pub-text md:text-5xl">
          Publista vs {data.name}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pub-text-secondary">
          {data.verdict}
        </p>
      </LandingSection>

      {/* Feature comparison table */}
      <LandingSection>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-pub-border">
                <th className="py-3 text-left text-pub-text-muted">Fonctionnalité</th>
                <th className="py-3 text-center font-semibold text-pub-accent">Publista</th>
                <th className="py-3 text-center font-semibold text-pub-text-secondary">{data.name}</th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((row) => (
                <tr key={row.feature} className="border-b border-pub-border/50">
                  <td className="py-3 text-pub-text-secondary">{row.feature}</td>
                  <td className="py-3 text-center"><CellValue value={row.publista} /></td>
                  <td className="py-3 text-center"><CellValue value={row.competitor} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LandingSection>

      {/* Strengths */}
      <LandingSection>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-pub-border bg-pub-card p-8">
            <h2 className="mb-6 text-lg font-semibold text-pub-text">
              Ce que {data.name} fait bien
            </h2>
            <ul className="space-y-3">
              {data.strengths.map((s) => (
                <li key={s} className="flex items-start gap-3 text-pub-text-secondary">
                  <Check className="mt-1 size-4 shrink-0 text-pub-text-muted" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-pub-accent/20 bg-pub-card p-8">
            <h2 className="mb-6 text-lg font-semibold text-pub-accent">
              Ce que Publista fait en plus
            </h2>
            <ul className="space-y-3">
              {data.publistaDiff.map((d) => (
                <li key={d} className="flex items-start gap-3 text-pub-text">
                  <Check className="mt-1 size-4 shrink-0 text-pub-accent" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Pricing note */}
      <LandingSection>
        <div className="mx-auto max-w-2xl rounded-2xl border border-pub-border bg-pub-card p-8 text-center">
          <h2 className="mb-4 text-lg font-semibold text-pub-text">Comparaison des prix</h2>
          <p className="text-pub-text-secondary">{data.pricingNote}</p>
        </div>
      </LandingSection>

      {/* Final CTA */}
      <LandingSection className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-pub-text md:text-3xl">
          Prêt à essayer Publista ?
        </h2>
        <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
          <Link to="/register">Essayez Publista gratuitement</Link>
        </Button>
      </LandingSection>
    </>
  );
}

function CellValue({ value }: { value: string }) {
  if (value === '✓') return <Check className="mx-auto size-4 text-pub-accent" />;
  if (value === '—') return <Minus className="mx-auto size-4 text-pub-text-muted" />;
  return <span className="text-pub-text-secondary">{value}</span>;
}
