import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { ToolPageLayout } from '../components/ToolPageLayout';

const TONES = ['Pro', 'Casual', 'Fun'] as const;
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube'] as const;

export function CaptionGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Pro');
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>('Instagram');
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setCaptions([]);

    try {
      const res = await fetch('/api/tools/caption-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), tone, platform }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Une erreur est survenue. Réessayez plus tard.');
      }

      const data = await res.json();
      setCaptions(data.captions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageLayout
      title="Générateur de Captions IA"
      description="Générez 5 variations de captions optimisées pour votre plateforme. Gratuit, sans inscription."
      metaTitle="Générateur de Légendes Instagram IA gratuit — Publista"
      metaDescription="Générez des captions Instagram, TikTok et LinkedIn optimisées gratuitement avec l'IA. 5 variations avec emojis et CTAs."
      seoContent={SEO_CONTENT}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="caption-topic" className="mb-2 block text-sm font-medium text-pub-text">
            Sujet de votre post
          </label>
          <textarea
            id="caption-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Nouveau menu d'été au restaurant, terrasse ouverte, cocktails frais..."
            className="w-full rounded-xl border border-pub-border bg-pub-card px-4 py-3 text-pub-text placeholder:text-pub-text-muted focus:border-pub-accent focus:outline-none focus:ring-1 focus:ring-pub-accent"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-pub-text">Ton</label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    tone === t
                      ? 'bg-pub-accent text-white'
                      : 'bg-pub-card text-pub-text-secondary hover:text-pub-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
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
        </div>

        <Button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full rounded-xl bg-pub-accent py-3 font-semibold text-white hover:bg-pub-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            'Générer mes captions'
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {captions.length > 0 && (
        <div className="mt-8 space-y-4">
          {captions.map((caption, i) => (
            <CaptionCard key={i} index={i + 1} caption={caption} />
          ))}
        </div>
      )}
    </ToolPageLayout>
  );
}

function CaptionCard({ index, caption }: { index: number; caption: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-pub-border bg-pub-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-pub-text-muted">Variation {index}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-pub-text-muted hover:text-pub-text"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-pub-text-secondary">{caption}</p>
    </div>
  );
}

const SEO_CONTENT = `Une bonne légende (caption) peut transformer un simple post en machine à engagement. Sur Instagram, les captions qui posent des questions ou racontent une histoire génèrent en moyenne 3x plus de commentaires.

Notre générateur de captions IA crée 5 variations uniques adaptées à votre plateforme cible et au ton souhaité. Que vous publiiez sur Instagram, TikTok, LinkedIn ou YouTube, chaque caption est optimisée pour maximiser l'engagement sur la plateforme choisie.

Le ton fait la différence : un post LinkedIn professionnel ne se rédige pas comme un TikTok casual. Notre IA adapte le vocabulaire, la structure et les emojis en fonction de votre choix de ton et de plateforme.

Pour aller plus loin, Publista génère automatiquement des captions optimisées pour chaque contenu que vous créez — Reels, Carousels et Posts — et les publie directement sur toutes vos plateformes en un clic.`;
