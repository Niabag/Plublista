import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingSection } from '../components/landing/LandingSection';

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Page';

  return (
    <LandingSection className="pt-24 md:pt-32">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="mb-4 text-3xl font-bold text-pub-text">{title}</h1>
        <p className="mb-8 text-pub-text-secondary">
          Cette page arrive bientôt. Restez connecté !
        </p>
        <Button asChild variant="ghost" className="text-pub-accent hover:text-pub-accent-hover hover:bg-pub-card">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </LandingSection>
  );
}
