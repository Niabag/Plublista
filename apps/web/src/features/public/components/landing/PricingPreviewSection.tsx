import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { LandingSection, useFadeUp } from './LandingSection';

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['5 contenus/mois', 'Watermark Publista', '1 plateforme'],
    cta: 'Commencer gratuitement',
    to: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 79,
    yearlyPrice: 63,
    badge: 'Populaire',
    features: ['Contenus illimités', '0 watermark', 'Multi-plateforme', 'Musique IA'],
    cta: 'Essai gratuit 7 jours',
    to: '/register',
    highlighted: true,
  },
  {
    name: 'Agency',
    monthlyPrice: 499,
    yearlyPrice: 399,
    features: ['Multi-comptes', 'Priorité de traitement', 'Support dédié'],
    cta: "Contacter l'équipe",
    to: '/register',
    highlighted: false,
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'Ai-je besoin de compétences en montage vidéo ?',
    a: "Non. L'IA fait tout. Uploadez vos clips, Publista fait le reste.",
  },
  {
    q: 'Sur quelles plateformes puis-je publier ?',
    a: 'Instagram, TikTok, YouTube, Facebook, LinkedIn, X, et 15+ autres via notre intégration.',
  },
  {
    q: 'Le plan gratuit a-t-il des limites ?',
    a: 'Oui : 5 contenus/mois et un watermark "Made with Publista". Les plans payants retirent ces limites.',
  },
  {
    q: 'Mes vidéos auront-elles un watermark ?',
    a: 'Uniquement sur le plan gratuit. Tous les plans payants produisent du contenu sans watermark.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui. Aucun engagement. Annulez en un clic depuis vos paramètres.',
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "7 jours d'accès complet au plan Pro. Pas de carte bancaire requise.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Chiffrement, RGPD-compliant, suppression des données sur demande.',
  },
];

export function PricingPreviewSection() {
  const [annual, setAnnual] = useState(true);
  const fade = useFadeUp();

  return (
    <>
      {/* Pricing */}
      <LandingSection>
        <div ref={fade.ref} className={fade.className}>
          <h2 className="mb-4 text-center text-3xl font-bold text-pub-text md:text-4xl">
            Un plan pour chaque ambition
          </h2>

          {/* Toggle */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? 'text-pub-text' : 'text-pub-text-muted'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                annual ? 'bg-pub-accent' : 'bg-pub-border'
              }`}
              aria-label="Basculer entre mensuel et annuel"
            >
              <span
                className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform ${
                  annual ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? 'text-pub-text' : 'text-pub-text-muted'}`}>
              Annuel
              <span className="ml-1 text-pub-accent">-20%</span>
            </span>
          </div>

          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-8 transition-all ${
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
                    <span className="text-4xl font-bold text-pub-text">{price}€</span>
                    {price > 0 && (
                      <span className="text-sm text-pub-text-muted">/mois</span>
                    )}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-pub-text-secondary">
                        <span className="text-pub-accent">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
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
                    <p className="mt-3 text-center text-xs text-pub-text-muted">
                      Pas de carte bancaire requise
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center">
            <Link to="/public-pricing" className="text-sm text-pub-accent hover:text-pub-accent-hover">
              Voir tous les plans &rarr;
            </Link>
          </p>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection>
        <h2 className="mb-10 text-center text-3xl font-bold text-pub-text md:text-4xl">
          Questions fréquentes
        </h2>
        <div className="mx-auto max-w-3xl divide-y divide-pub-border">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </LandingSection>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-24 md:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pub-accent/20 via-transparent to-pub-accent/10" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-pub-text md:text-5xl">
            Prêt à créer du contenu qui performe&nbsp;?
          </h2>
          <p className="mt-4 text-lg text-pub-text-secondary">
            Rejoignez les créateurs qui produisent 5x plus vite.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-xl bg-pub-accent px-8 py-4 text-lg font-semibold text-white hover:bg-pub-accent-hover">
              <Link to="/register">Commencer gratuitement &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-base font-medium text-pub-text">{question}</span>
        <ChevronDown
          className={`ml-4 size-5 shrink-0 text-pub-text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'mt-3 max-h-40' : 'max-h-0'
        }`}
      >
        <p className="text-sm leading-relaxed text-pub-text-secondary">
          {answer}
        </p>
      </div>
    </div>
  );
}
