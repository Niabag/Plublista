import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { AnimatedTvLogo } from './AnimatedTvLogo';

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Pricing', to: '/public-pricing' },
      { label: 'Use Cases', to: '/pour/freelances' },
      { label: 'Templates', to: '/templates' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Changelog', to: '/changelog' },
      { label: 'Outils gratuits', to: '/tools/hashtag-generator' },
      { label: 'Comparatifs', to: '/compare/canva' },
      { label: "Centre d'aide", to: '/help' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Confidentialité', to: '/privacy' },
      { label: 'CGU', to: '/terms' },
      { label: 'Suppression données', to: '/data-deletion' },
      { label: 'Cookies', to: '/cookies' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/publista', icon: InstagramIcon },
  { label: 'TikTok', href: 'https://tiktok.com/@publista', icon: TikTokIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/publista', icon: LinkedInIcon },
  { label: 'X', href: 'https://x.com/publista', icon: XIcon },
  { label: 'YouTube', href: 'https://youtube.com/@publista', icon: YouTubeIcon },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-pub-border bg-pub-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        {/* Desktop 4-column layout */}
        <div className="hidden gap-8 md:grid md:grid-cols-4">
          {/* Column 1: Brand */}
          <BrandColumn />

          {/* Columns 2-4: Links */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold text-pub-text">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile stacked layout */}
        <div className="flex flex-col gap-6 md:hidden">
          <BrandColumn />
          {COLUMNS.map((col) => (
            <MobileColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-pub-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row lg:px-8">
          <p className="text-sm text-pub-text-muted">
            &copy; {new Date().getFullYear()} Publista. Tous droits réservés.
          </p>
          <LanguageSelector />
        </div>
      </div>
    </footer>
  );
}

function BrandColumn() {
  return (
    <div>
      <Link to="/" className="inline-block">
        <img src="/logo.png" alt="Publista" className="h-8" />
      </Link>
      <p className="mt-3 text-sm text-pub-text-secondary">
        Créez du contenu professionnel pour tous vos réseaux sociaux en quelques
        clics grâce à l'IA.
      </p>
      <div className="mt-4 flex items-center gap-3">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="text-pub-text-muted transition-colors hover:text-pub-text"
          >
            <social.icon className="size-5" />
          </a>
        ))}
      </div>
      {/* TV logo */}
      <div className="mt-6 flex items-center gap-3">
        <AnimatedTvLogo size="md" />
        <span className="text-xs text-pub-text-muted">Scannez pour une surprise</span>
      </div>
    </div>
  );
}

function MobileColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; to: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-pub-border pb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-pub-text"
      >
        {title}
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LanguageSelector() {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLang('FR')}
        className={`rounded px-2 py-1 transition-colors ${
          lang === 'FR'
            ? 'bg-pub-card text-pub-text'
            : 'text-pub-text-muted hover:text-pub-text-secondary'
        }`}
      >
        FR
      </button>
      <span className="text-pub-text-muted">/</span>
      <button
        onClick={() => setLang('EN')}
        className={`rounded px-2 py-1 transition-colors ${
          lang === 'EN'
            ? 'bg-pub-card text-pub-text'
            : 'text-pub-text-muted hover:text-pub-text-secondary'
        }`}
      >
        EN
      </button>
    </div>
  );
}

/* Inline SVG icons — kept minimal to avoid extra dependencies */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.76 1.52V7.48a4.83 4.83 0 01-1-.79z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
