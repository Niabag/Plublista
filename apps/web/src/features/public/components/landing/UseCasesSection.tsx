import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingSection, useFadeUp } from './LandingSection';

const PERSONAS = [
  {
    tab: 'Freelances',
    headline: '15 Reels en une matinée',
    description:
      'Sophie gère 8 comptes clients. Avec Publista, sa production du lundi est bouclée avant midi.',
    cta: 'Découvrir comment →',
    to: '/pour/freelances',
  },
  {
    tab: 'PME / Marketing',
    headline: 'Votre premier Reel pro, sans compétence vidéo',
    description:
      "Marc n'a jamais touché un logiciel de montage. Son premier Reel a dépassé les 10K vues.",
    cta: 'Découvrir comment →',
    to: '/pour/restaurants',
  },
  {
    tab: 'Agences',
    headline: 'Scalez sans embaucher',
    description:
      'Léa a pris 10 clients supplémentaires sans recruter. Ses juniors produisent comme des seniors.',
    cta: 'Découvrir comment →',
    to: '/pour/agences',
  },
] as const;

const STATS = [
  { value: '3 min', label: 'par Reel' },
  { value: '15+', label: 'plateformes' },
  { value: '0', label: 'watermark' },
];

export function UseCasesSection() {
  const [active, setActive] = useState(0);
  const fade = useFadeUp();

  const persona = PERSONAS[active];

  return (
    <LandingSection>
      <div ref={fade.ref} className={fade.className}>
        {/* Use Cases Tabs */}
        <h2 className="mb-10 text-center text-3xl font-bold text-pub-text md:text-4xl">
          Conçu pour vous
        </h2>

        {/* Tab bar */}
        <div className="mb-8 flex justify-center gap-2">
          {PERSONAS.map((p, i) => (
            <button
              key={p.tab}
              onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                i === active
                  ? 'bg-pub-accent text-white'
                  : 'bg-pub-card text-pub-text-secondary hover:text-pub-text'
              }`}
            >
              {p.tab}
            </button>
          ))}
        </div>

        {/* Active persona */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-pub-border bg-pub-card p-8 text-center transition-opacity duration-300 md:p-12">
          <h3 className="mb-4 text-2xl font-bold text-pub-text md:text-3xl">
            {persona.headline}
          </h3>
          <p className="mb-6 text-pub-text-secondary">{persona.description}</p>
          <Link
            to={persona.to}
            className="inline-block text-sm font-medium text-pub-accent transition-colors hover:text-pub-accent-hover"
          >
            {persona.cta}
          </Link>
        </div>

        {/* Stats / Metrics */}
        <div className="mt-16 grid grid-cols-3 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-bold text-pub-accent md:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-pub-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
