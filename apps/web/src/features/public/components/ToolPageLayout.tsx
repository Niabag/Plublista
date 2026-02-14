import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from './landing/LandingSection';

export function ToolPageLayout({
  title,
  description,
  metaTitle,
  metaDescription,
  children,
  seoContent,
}: {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  children: ReactNode;
  seoContent: string;
}) {
  // Set meta tags
  if (typeof document !== 'undefined') {
    document.title = metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', metaDescription);
  }

  return (
    <>
      <LandingSection className="pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-center text-3xl font-bold text-pub-text md:text-4xl">
            {title}
          </h1>
          <p className="mb-10 text-center text-pub-text-secondary">
            {description}
          </p>

          {/* Tool form + results */}
          {children}

          {/* Soft CTA */}
          <div className="mt-10 rounded-2xl border border-pub-accent/20 bg-pub-card p-6 text-center">
            <p className="mb-4 text-pub-text-secondary">
              Transformez ces résultats en contenu pro avec Publista
            </p>
            <Button asChild className="rounded-xl bg-pub-accent px-6 py-3 font-semibold text-white hover:bg-pub-accent-hover">
              <Link to="/register">Essayez Publista gratuitement</Link>
            </Button>
          </div>
        </div>
      </LandingSection>

      {/* SEO content block */}
      <LandingSection>
        <div className="mx-auto max-w-3xl">
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-pub-text-muted">
            {seoContent.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </LandingSection>
    </>
  );
}
