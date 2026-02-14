import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { ToolPageLayout } from '../components/ToolPageLayout';

interface HashtagResult {
  highVolume: string[];
  medium: string[];
  niche: string[];
}

export function HashtagGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashtagResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tools/hashtag-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Une erreur est survenue. Réessayez plus tard.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageLayout
      title="Générateur de Hashtags IA"
      description="Générez 30 hashtags optimisés pour votre niche en quelques secondes. Gratuit, sans inscription."
      metaTitle="Générateur de Hashtags Instagram IA gratuit — Publista"
      metaDescription="Générez des hashtags Instagram optimisés gratuitement avec l'IA. 30 hashtags catégorisés par volume pour maximiser votre reach."
      seoContent={SEO_CONTENT}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-medium text-pub-text">
            Décrivez votre contenu ou votre niche
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Restaurant italien à Paris, plats faits maison, ambiance cozy..."
            className="w-full rounded-xl border border-pub-border bg-pub-card px-4 py-3 text-pub-text placeholder:text-pub-text-muted focus:border-pub-accent focus:outline-none focus:ring-1 focus:ring-pub-accent"
            rows={3}
            maxLength={500}
          />
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
            'Générer mes hashtags'
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <HashtagGroup title="High Volume (10)" hashtags={result.highVolume} color="text-green-400" />
          <HashtagGroup title="Medium Volume (10)" hashtags={result.medium} color="text-yellow-400" />
          <HashtagGroup title="Niche (10)" hashtags={result.niche} color="text-pub-accent" />
        </div>
      )}
    </ToolPageLayout>
  );
}

function HashtagGroup({ title, hashtags, color }: { title: string; hashtags: string[]; color: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(hashtags.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-pub-border bg-pub-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-pub-text-muted hover:text-pub-text"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copié !' : 'Copier tout'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((h) => (
          <span key={h} className="rounded-full bg-pub-card-hover px-3 py-1 text-sm text-pub-text-secondary">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

const SEO_CONTENT = `Les hashtags sont essentiels pour augmenter la visibilité de vos publications sur Instagram, TikTok et LinkedIn. Un bon mix de hashtags populaires et de niche permet de toucher un public large tout en ciblant votre audience idéale.

Notre générateur de hashtags IA analyse votre description et génère 30 hashtags optimisés répartis en 3 catégories : high volume (grande portée), medium volume (bon engagement) et niche (audience qualifiée). Cette stratégie en trois niveaux est recommandée par les experts en social media marketing.

Contrairement aux générateurs classiques qui se basent sur des listes statiques, notre outil utilise l'intelligence artificielle pour comprendre le contexte de votre contenu et générer des hashtags pertinents et actuels. Chaque set de hashtags est unique et adapté à votre niche spécifique.

Pour maximiser l'impact de vos hashtags, utilisez-les en combinaison avec du contenu de qualité. Publista vous permet de créer des Reels, Carousels et Posts professionnels en quelques minutes grâce à l'IA, et de les publier directement sur toutes vos plateformes.`;
