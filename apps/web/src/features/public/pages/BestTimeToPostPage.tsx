import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ToolPageLayout } from '../components/ToolPageLayout';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook'] as const;

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
const HOURS = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'] as const;

interface TimeSlot {
  day: number;
  hour: number;
  score: number; // 0-100
}

export function BestTimeToPostPage() {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>('Instagram');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) return;

    setLoading(true);
    setError('');
    setSlots([]);

    try {
      const res = await fetch('/api/tools/best-time-to-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, niche: niche.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Une erreur est survenue. Réessayez plus tard.');
      }

      const data = await res.json();
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageLayout
      title="Meilleure Heure de Publication"
      description="Trouvez les créneaux optimaux pour publier sur vos réseaux selon votre niche. Gratuit, sans inscription."
      metaTitle="Meilleure heure pour publier sur Instagram — Publista"
      metaDescription="Découvrez les meilleurs moments pour publier sur Instagram, TikTok, LinkedIn et YouTube selon votre niche. Outil gratuit propulsé par l'IA."
      seoContent={SEO_CONTENT}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-pub-text">Plateforme</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  platform === p
                    ? 'bg-pub-accent text-white'
                    : 'bg-pub-card text-pub-text-secondary hover:text-pub-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="niche" className="mb-2 block text-sm font-medium text-pub-text">
            Votre niche / industrie
          </label>
          <input
            id="niche"
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: Food & Restaurant, Fitness, Real Estate, E-commerce..."
            className="w-full rounded-xl border border-pub-border bg-pub-card px-4 py-3 text-pub-text placeholder:text-pub-text-muted focus:border-pub-accent focus:outline-none focus:ring-1 focus:ring-pub-accent"
            maxLength={100}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !niche.trim()}
          className="w-full rounded-xl bg-pub-accent py-3 font-semibold text-white hover:bg-pub-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            'Trouver les meilleurs créneaux'
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {slots.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-center text-sm font-semibold text-pub-text">
            Créneaux recommandés pour {platform}
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header row */}
              <div className="mb-2 grid grid-cols-[60px_repeat(9,1fr)] gap-1">
                <div />
                {HOURS.map((h) => (
                  <div key={h} className="text-center text-xs text-pub-text-muted">{h}</div>
                ))}
              </div>
              {/* Grid rows */}
              {DAYS.map((day, dayIdx) => (
                <div key={day} className="mb-1 grid grid-cols-[60px_repeat(9,1fr)] gap-1">
                  <div className="flex items-center text-xs font-medium text-pub-text-secondary">{day}</div>
                  {HOURS.map((_, hourIdx) => {
                    const slot = slots.find((s) => s.day === dayIdx && s.hour === hourIdx);
                    const score = slot?.score ?? 0;
                    return (
                      <div
                        key={hourIdx}
                        className="flex aspect-square items-center justify-center rounded-md text-xs"
                        style={{
                          backgroundColor: score > 0
                            ? `rgba(124, 58, 237, ${score / 100})`
                            : 'rgba(39, 39, 42, 0.5)',
                        }}
                        title={`${day} ${HOURS[hourIdx]} — Score: ${score}%`}
                      >
                        {score > 60 && <span className="text-white text-[10px]">{score}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-pub-text-muted">
                <span>Faible</span>
                <div className="flex gap-0.5">
                  {[20, 40, 60, 80, 100].map((v) => (
                    <div
                      key={v}
                      className="size-4 rounded-sm"
                      style={{ backgroundColor: `rgba(124, 58, 237, ${v / 100})` }}
                    />
                  ))}
                </div>
                <span>Optimal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}

const SEO_CONTENT = `Publier au bon moment peut multiplier par 2 à 3 votre engagement sur les réseaux sociaux. Chaque plateforme a ses propres créneaux de pointe, et ceux-ci varient selon votre niche et votre audience cible.

Notre outil analyse votre niche et votre plateforme pour recommander les meilleurs créneaux de publication de la semaine. Les résultats sont présentés sous forme de grille visuelle avec un score de 0 à 100 pour chaque créneau horaire.

Sur Instagram, les meilleurs moments varient selon que vous ciblez des professionnels (pauses déjeuner, fin de journée) ou des consommateurs (soirées, week-ends). Sur LinkedIn, les horaires de bureau sont généralement les plus performants. TikTok a ses propres dynamiques avec des pics le soir et le week-end.

Avec Publista, vous pouvez non seulement identifier les meilleurs moments pour publier, mais aussi programmer automatiquement vos contenus pour qu'ils soient publiés au créneau optimal. Notre calendrier intelligent suggère les meilleurs horaires lors de la planification.`;
