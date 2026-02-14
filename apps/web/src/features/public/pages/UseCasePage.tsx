import { useParams, Navigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LandingSection } from '../components/landing/LandingSection';

interface PersonaData {
  title: string;
  headline: string;
  metaTitle: string;
  metaDescription: string;
  painPoints: string[];
  solutions: string[];
  result: string;
  recommendedPlan: string;
  recommendedPrice: string;
}

const PERSONAS: Record<string, PersonaData> = {
  freelances: {
    title: 'Freelances & Community Managers',
    headline: '15 Reels en une matinée, pour tous vos clients',
    metaTitle: 'Création Reels pour freelances — Publista',
    metaDescription:
      "Gérez tous vos comptes clients depuis un seul outil. Créez des Reels, Carousels et Posts pro en 3 minutes avec l'IA.",
    painPoints: [
      'Jongler entre 5+ outils différents pour chaque client',
      'Passer 45 min par Reel alors que le budget client est serré',
      "Impossible de scaler sans embaucher ou sacrifier la qualité",
      'Les clients veulent du contenu quotidien mais le temps manque',
    ],
    solutions: [
      'Un seul outil pour tout : montage, copy, publication',
      '3 minutes par Reel au lieu de 45 — même résultat pro',
      'Gérez 8+ comptes clients sans recruter',
      'Batch production : toute la semaine planifiée en une matinée',
    ],
    result: 'Sophie gère 8 comptes clients. Sa production du lundi est bouclée avant midi avec Publista.',
    recommendedPlan: 'Pro',
    recommendedPrice: '79€/mois',
  },
  restaurants: {
    title: 'Restaurants & Food',
    headline: 'Des Reels qui remplissent vos tables',
    metaTitle: 'Création Reels pour restaurants — Publista',
    metaDescription:
      "Filmez vos plats au téléphone, Publista crée un Reel appétissant en 3 min. Augmentez vos réservations avec du contenu pro.",
    painPoints: [
      'Pas le temps de filmer entre deux services',
      'Aucune compétence en montage vidéo',
      'Les clients scrollent sans réserver',
      "Budget marketing limité, pas d'agence",
    ],
    solutions: [
      'Filmez avec votre téléphone, Publista fait le montage',
      "L'IA ajoute musique, transitions et textes automatiquement",
      'Contenu optimisé pour stopper le scroll et donner faim',
      'Plan Starter à 29€/mois — moins cher qu\'un dessert',
    ],
    result: "Un restaurant a augmenté ses réservations de 40% avec 3 Reels/semaine créés sur Publista.",
    recommendedPlan: 'Starter',
    recommendedPrice: '29€/mois',
  },
  immobilier: {
    title: 'Immobilier',
    headline: 'Des visites virtuelles qui vendent avant la visite réelle',
    metaTitle: 'Création Reels immobilier — Publista',
    metaDescription:
      "Transformez vos vidéos de biens en Reels immobiliers pro. Attirez plus d'acheteurs sur Instagram et TikTok.",
    painPoints: [
      'Les annonces statiques ne suffisent plus pour vendre',
      'Les vidéos de biens prennent trop de temps à monter',
      "La concurrence utilise déjà la vidéo sur les réseaux",
      "Les acheteurs veulent voir le bien avant de se déplacer",
    ],
    solutions: [
      "Filmez le bien, l'IA crée une visite virtuelle engageante",
      'Reels optimisés pour Instagram et TikTok immobilier',
      'Ajoutez prix, surface et localisation automatiquement',
      'Publiez sur toutes vos plateformes en un clic',
    ],
    result: "Un agent a doublé ses demandes de visite en publiant 5 Reels/semaine de ses biens.",
    recommendedPlan: 'Pro',
    recommendedPrice: '79€/mois',
  },
  coachs: {
    title: 'Coachs & Consultants',
    headline: 'Transformez votre expertise en contenu viral',
    metaTitle: 'Création contenu pour coachs — Publista',
    metaDescription:
      "Créez des Reels, Carousels et Posts qui positionnent votre expertise. Attirez des clients avec du contenu pro en 3 min.",
    painPoints: [
      "Votre expertise est précieuse mais invisible sur les réseaux",
      'Créer du contenu vidéo prend trop de temps',
      'Les Carousels LinkedIn demandent des heures de design',
      "Vous savez que le contenu attire des clients mais vous n'avez pas le temps",
    ],
    solutions: [
      'Transformez vos idées en Reels et Carousels en 3 min',
      "L'IA rédige des captions qui reflètent votre ton d'expert",
      'Publiez sur LinkedIn, Instagram et TikTok simultanément',
      'Planifiez toute votre semaine de contenu en une session',
    ],
    result: "Un coach a multiplié par 3 ses demandes de consultation grâce à 4 posts/semaine sur LinkedIn.",
    recommendedPlan: 'Pro',
    recommendedPrice: '79€/mois',
  },
  ecommerce: {
    title: 'E-commerce',
    headline: 'Des vidéos produit qui convertissent les scrolleurs en acheteurs',
    metaTitle: 'Création vidéos e-commerce — Publista',
    metaDescription:
      "Créez des vidéos produit pro pour Instagram, TikTok et YouTube. Augmentez vos ventes avec du contenu qui convertit.",
    painPoints: [
      "Les photos produit ne suffisent plus — la vidéo est reine",
      'Chaque produit nécessite du contenu unique pour chaque plateforme',
      'Le budget vidéo explose avec des dizaines de références',
      "Les concurrents TikTok Shop produisent du contenu en masse",
    ],
    solutions: [
      'Créez des vidéos produit pro à partir de vos clips bruts',
      'Format auto-adapté pour chaque plateforme (9:16, 1:1, 16:9)',
      "Production en masse : 10 vidéos produit en moins d'une heure",
      "Hashtags et captions optimisés par l'IA pour chaque niche",
    ],
    result: "Une boutique e-commerce a augmenté ses ventes de 60% en 2 mois avec des Reels produit quotidiens.",
    recommendedPlan: 'Business',
    recommendedPrice: '199€/mois',
  },
  agences: {
    title: 'Agences',
    headline: 'Scalez sans embaucher',
    metaTitle: 'Publista pour agences — Multi-comptes et production à grande échelle',
    metaDescription:
      "Gérez plusieurs comptes clients, produisez du contenu à grande échelle et scalez votre agence sans recruter.",
    painPoints: [
      'Chaque nouveau client nécessite plus de ressources',
      'Les juniors ne produisent pas au niveau des seniors',
      'La qualité baisse quand le volume augmente',
      "Impossible de scaler sans embaucher ou sacrifier les marges",
    ],
    solutions: [
      "L'IA produit au niveau senior quel que soit l'opérateur",
      'Multi-comptes : gérez tous vos clients depuis un dashboard',
      'Qualité constante même à grande échelle',
      'Vos juniors produisent comme des seniors dès le premier jour',
    ],
    result: "Léa a pris 10 clients supplémentaires sans recruter. Ses juniors produisent comme des seniors.",
    recommendedPlan: 'Agency',
    recommendedPrice: '499€/mois',
  },
};

export function UseCasePage() {
  const { persona } = useParams<{ persona: string }>();

  const data = persona ? PERSONAS[persona] : undefined;

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
      <LandingSection className="pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-pub-accent">
            {data.title}
          </p>
          <h1 className="text-3xl font-bold text-pub-text md:text-5xl">
            {data.headline}
          </h1>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
              <Link to="/register">Commencer gratuitement</Link>
            </Button>
          </div>
        </div>
      </LandingSection>

      {/* Pain → Solution */}
      <LandingSection>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-pub-border bg-pub-card p-8">
            <h2 className="mb-6 text-lg font-semibold text-pub-text-muted">
              Vos problèmes
            </h2>
            <ul className="space-y-4">
              {data.painPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-pub-text-muted">
                  <span className="mt-1 text-red-500/60">✕</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-pub-accent/20 bg-pub-card p-8">
            <h2 className="mb-6 text-lg font-semibold text-pub-accent">
              La solution Publista
            </h2>
            <ul className="space-y-4">
              {data.solutions.map((s) => (
                <li key={s} className="flex items-start gap-3 text-pub-text">
                  <span className="mt-1 text-pub-accent">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Result */}
      <LandingSection>
        <div className="mx-auto max-w-2xl rounded-2xl border border-pub-border bg-pub-card p-8 text-center md:p-12">
          <p className="text-xl font-medium text-pub-text md:text-2xl">
            "{data.result}"
          </p>
        </div>
      </LandingSection>

      {/* Pricing recommendation */}
      <LandingSection className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-pub-text">
          Plan recommandé : {data.recommendedPlan}
        </h2>
        <p className="mb-6 text-lg text-pub-accent">{data.recommendedPrice}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
            <Link to="/register">Commencer gratuitement</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl px-8 py-4 text-pub-text-secondary hover:bg-pub-card hover:text-pub-text">
            <Link to="/public-pricing">Voir tous les plans</Link>
          </Button>
        </div>
      </LandingSection>
    </>
  );
}
