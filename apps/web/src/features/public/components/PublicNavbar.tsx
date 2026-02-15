import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTvLogo } from './AnimatedTvLogo';

const USE_CASES = [
  { label: 'Freelances & Community Managers', to: '/pour/freelances' },
  { label: 'Restaurants & Food', to: '/pour/restaurants' },
  { label: 'Immobilier', to: '/pour/immobilier' },
  { label: 'Coachs & Consultants', to: '/pour/coachs' },
  { label: 'E-commerce', to: '/pour/ecommerce' },
  { label: 'Agences', to: '/pour/agences' },
] as const;

const TOOLS = [
  { label: 'Générateur de hashtags IA', to: '/tools/hashtag-generator' },
  { label: 'Générateur de captions IA', to: '/tools/caption-generator' },
  { label: 'Meilleure heure de publication', to: '/tools/best-time-to-post' },
] as const;

function useScrolled(threshold = 64) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; to: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleEnter() {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  // Close on outside click (mainly for keyboard users)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute left-0 top-full z-50 mt-2 min-w-[240px] rounded-lg border border-pub-border bg-pub-card p-2 shadow-xl transition-all duration-200 ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-pub-text-secondary transition-colors hover:bg-pub-card-hover hover:text-pub-text"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicNavbar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:h-16 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <AnimatedTvLogo size="md" interactive tooltipText="Scannez-moi !" />
          <img src="/logo.png" alt="Publista" className="hidden h-[170px] sm:block" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/features"
            className="text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
          >
            Features
          </Link>
          <Link
            to="/public-pricing"
            className="text-sm text-pub-text-secondary transition-colors hover:text-pub-text"
          >
            Pricing
          </Link>
          <NavDropdown label="Use Cases" items={USE_CASES} />
          <NavDropdown label="Tools" items={TOOLS} />
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild className="text-pub-text-secondary hover:text-pub-text hover:bg-pub-card">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/register">Commencer gratuitement</Link>
          </Button>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/register">Commencer</Link>
          </Button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-pub-text"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-14 z-40 bg-pub-bg md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <div className="flex flex-col gap-1 overflow-y-auto p-4">
            <MobileLink to="/features" label="Features" onClose={() => setMobileOpen(false)} />
            <MobileLink to="/public-pricing" label="Pricing" onClose={() => setMobileOpen(false)} />

            <MobileSection title="Use Cases">
              {USE_CASES.map((item) => (
                <MobileLink key={item.to} to={item.to} label={item.label} onClose={() => setMobileOpen(false)} />
              ))}
            </MobileSection>

            <MobileSection title="Tools">
              {TOOLS.map((item) => (
                <MobileLink key={item.to} to={item.to} label={item.label} onClose={() => setMobileOpen(false)} />
              ))}
            </MobileSection>

            <div className="mt-4 border-t border-pub-border pt-4">
              <Button
                variant="ghost"
                asChild
                className="w-full justify-start text-pub-text-secondary hover:text-pub-text hover:bg-pub-card"
              >
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({
  to,
  label,
  onClose,
}: {
  to: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="rounded-md px-3 py-2.5 text-base text-pub-text-secondary transition-colors hover:bg-pub-card hover:text-pub-text"
    >
      {label}
    </Link>
  );
}

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base text-pub-text-secondary transition-colors hover:bg-pub-card hover:text-pub-text"
      >
        {title}
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="ml-3 flex flex-col gap-1">{children}</div>}
    </div>
  );
}
