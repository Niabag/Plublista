import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Minus } from 'lucide-react';
import { LandingSection } from '../components/landing/LandingSection';

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['5 contenus/mois', 'Watermark Publista', '1 plateforme', 'Formats basiques'],
    cta: 'Commencer gratuitement',
    to: '/register',
    highlighted: false,
  },
  {
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 23,
    features: ['20 contenus/mois', '0 watermark', '3 plateformes', 'Musique libre de droits'],
    cta: 'Essai gratuit 7 jours',
    to: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 79,
    yearlyPrice: 63,
    badge: 'Populaire',
    features: ['Contenus illimités', '0 watermark', 'Multi-plateforme', 'Musique IA', 'Calendrier avancé'],
    cta: 'Essai gratuit 7 jours',
    to: '/register',
    highlighted: true,
  },
  {
    name: 'Business',
    monthlyPrice: 199,
    yearlyPrice: 159,
    features: ['Tout Pro +', '5 utilisateurs', 'Branding personnalisé', 'Analytics avancés', 'Support prioritaire'],
    cta: 'Essai gratuit 7 jours',
    to: '/register',
    highlighted: false,
  },
  {
    name: 'Agency',
    monthlyPrice: 499,
    yearlyPrice: 399,
    features: ['Tout Business +', 'Utilisateurs illimités', 'Multi-comptes clients', 'API access', 'Support dédié'],
    cta: "Contacter l'équipe",
    to: '/register',
    highlighted: false,
  },
];

type FeatureRow = { feature: string; free: string; starter: string; pro: string; business: string; agency: string };

const COMPARISON_SECTIONS: { title: string; rows: FeatureRow[] }[] = [
  {
    title: 'Création',
    rows: [
      { feature: 'Reels IA', free: '5/mois', starter: '20/mois', pro: 'Illimité', business: 'Illimité', agency: 'Illimité' },
      { feature: 'Carousels', free: '5/mois', starter: '20/mois', pro: 'Illimité', business: 'Illimité', agency: 'Illimité' },
      { feature: 'Posts', free: '5/mois', starter: '20/mois', pro: 'Illimité', business: 'Illimité', agency: 'Illimité' },
      { feature: 'Musique IA', free: '—', starter: '—', pro: '✓', business: '✓', agency: '✓' },
      { feature: 'Copy IA', free: '✓', starter: '✓', pro: '✓', business: '✓', agency: '✓' },
    ],
  },
  {
    title: 'Publication',
    rows: [
      { feature: 'Plateformes', free: '1', starter: '3', pro: '15+', business: '15+', agency: '15+' },
      { feature: 'Programmation', free: '—', starter: '✓', pro: '✓', business: '✓', agency: '✓' },
      { feature: 'Calendrier', free: '—', starter: 'Basique', pro: 'Avancé', business: 'Avancé', agency: 'Avancé' },
    ],
  },
  {
    title: 'Limites',
    rows: [
      { feature: 'Watermark', free: 'Oui', starter: 'Non', pro: 'Non', business: 'Non', agency: 'Non' },
      { feature: 'Stockage', free: '1 Go', starter: '10 Go', pro: '100 Go', business: '500 Go', agency: 'Illimité' },
      { feature: 'Export HD', free: '720p', starter: '1080p', pro: '4K', business: '4K', agency: '4K' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { feature: 'Temps de réponse', free: '72h', starter: '48h', pro: '24h', business: '4h', agency: '1h' },
      { feature: 'Manager dédié', free: '—', starter: '—', pro: '—', business: '—', agency: '✓' },
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'Puis-je changer de plan à tout moment ?', a: "Oui. Vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement et la facturation est ajustée au prorata." },
  { q: 'Comment fonctionne la facturation annuelle ?', a: "Vous payez une fois par an et économisez 20% par rapport au tarif mensuel. Vous pouvez annuler à tout moment, le remboursement est calculé au prorata." },
  { q: "L'essai gratuit nécessite-t-il une carte bancaire ?", a: "Non. L'essai gratuit de 7 jours ne nécessite aucune carte bancaire. Vous ne serez jamais facturé sans votre consentement explicite." },
  { q: 'Comment fonctionne la facturation pour les équipes ?', a: "Les plans Business et Agency incluent des sièges utilisateurs. Chaque siège supplémentaire est facturé au tarif de base du plan divisé par le nombre de sièges inclus." },
  { q: 'Puis-je obtenir un remboursement ?', a: "Oui. Nous offrons un remboursement intégral dans les 14 jours suivant tout paiement si vous n'êtes pas satisfait." },
];

export function FullPricingPage() {
  const [annual, setAnnual] = useState(true);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  return (
    <>
      {/* Hero */}
      <LandingSection className="pt-24 text-center md:pt-32">
        <h1 className="text-4xl font-bold text-pub-text md:text-5xl">
          Un plan pour chaque ambition
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-pub-text-secondary">
          Commencez gratuitement, évoluez quand vous êtes prêt.
        </p>

        {/* Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? 'text-pub-text' : 'text-pub-text-muted'}`}>Mensuel</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${annual ? 'bg-pub-accent' : 'bg-pub-border'}`}
            aria-label="Basculer entre mensuel et annuel"
          >
            <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : ''}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-pub-text' : 'text-pub-text-muted'}`}>
            Annuel <span className="ml-1 text-pub-accent">-20%</span>
          </span>
        </div>
      </LandingSection>

      {/* Cards */}
      <LandingSection>
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {PLANS.map((plan) => {
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlighted
                    ? 'scale-[1.02] border-pub-accent/40 bg-pub-card shadow-lg shadow-pub-accent/5'
                    : 'border-pub-border bg-pub-card'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pub-accent px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-pub-text">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-pub-text">{price}€</span>
                  {price > 0 && <span className="text-sm text-pub-text-muted">/mois</span>}
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-pub-text-secondary">
                      <span className="text-pub-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    asChild
                    className={`w-full rounded-xl ${
                      plan.highlighted
                        ? 'bg-pub-accent text-white hover:bg-pub-accent-hover'
                        : 'bg-pub-card-hover text-pub-text hover:bg-pub-border'
                    }`}
                  >
                    <Link to={plan.to}>{plan.cta}</Link>
                  </Button>
                </div>
                {plan.name === 'Free' && (
                  <p className="mt-2 text-center text-xs text-pub-text-muted">Pas de carte bancaire requise</p>
                )}
              </div>
            );
          })}
        </div>
      </LandingSection>

      {/* Feature comparison table */}
      <LandingSection>
        <button
          onClick={() => setComparisonOpen((v) => !v)}
          className="mx-auto flex items-center gap-2 text-pub-accent hover:text-pub-accent-hover"
        >
          <span className="font-medium">Comparaison détaillée des plans</span>
          <ChevronDown className={`size-5 transition-transform duration-200 ${comparisonOpen ? 'rotate-180' : ''}`} />
        </button>

        {comparisonOpen && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-pub-border">
                  <th className="py-3 text-left text-pub-text-muted" />
                  {['Free', 'Starter', 'Pro', 'Business', 'Agency'].map((t) => (
                    <th key={t} className="py-3 text-center font-semibold text-pub-text">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_SECTIONS.map((section) => (
                  <ComparisonSection key={section.title} title={section.title} rows={section.rows} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LandingSection>

      {/* FAQ */}
      <LandingSection>
        <h2 className="mb-10 text-center text-3xl font-bold text-pub-text">Questions fréquentes</h2>
        <div className="mx-auto max-w-3xl divide-y divide-pub-border">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </LandingSection>

      {/* Final CTA */}
      <LandingSection className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-pub-text">
          Prêt à créer du contenu qui performe ?
        </h2>
        <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
          <Link to="/register">Commencer gratuitement</Link>
        </Button>
      </LandingSection>
    </>
  );
}

function ComparisonSection({ title, rows }: { title: string; rows: FeatureRow[] }) {
  return (
    <>
      <tr>
        <td colSpan={6} className="pt-6 pb-2 text-sm font-semibold text-pub-accent">{title}</td>
      </tr>
      {rows.map((row) => (
        <tr key={row.feature} className="border-b border-pub-border/50">
          <td className="py-3 text-pub-text-secondary">{row.feature}</td>
          {(['free', 'starter', 'pro', 'business', 'agency'] as const).map((tier) => (
            <td key={tier} className="py-3 text-center text-pub-text-secondary">
              <CellValue value={row[tier]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CellValue({ value }: { value: string }) {
  if (value === '✓') return <Check className="mx-auto size-4 text-pub-accent" />;
  if (value === '—') return <Minus className="mx-auto size-4 text-pub-text-muted" />;
  return <span>{value}</span>;
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-base font-medium text-pub-text">{question}</span>
        <ChevronDown className={`ml-4 size-5 shrink-0 text-pub-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'mt-3 max-h-40' : 'max-h-0'}`}>
        <p className="text-sm leading-relaxed text-pub-text-secondary">{answer}</p>
      </div>
    </div>
  );
}
