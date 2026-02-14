import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  CalendarDays,
  Grid3X3,
  Settings,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/useUiStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Create', icon: PlusCircle, to: '/create' },
  { label: 'Calendar', icon: CalendarDays, to: '/calendar' },
  { label: 'Library', icon: Grid3X3, to: '/library' },
] as const;

const bottomItems = [{ label: 'Settings', icon: Settings, to: '/settings' }] as const;

function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: { label: string; icon: React.ComponentType<{ className?: string }>; to: string };
  collapsed: boolean;
  onClick?: () => void;
}) {
  const link = (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out',
          isActive
            ? 'border-primary bg-primary/10 text-primary dark:bg-indigo-950 dark:text-indigo-400'
            : 'border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <item.icon className="size-5 shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap transition-all duration-300 ease-in-out',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
        )}
      >
        {item.label}
      </span>
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

const HOVER_OPEN_DELAY = 200;
const HOVER_CLOSE_DELAY = 400;

export function Sidebar() {
  const [hovered, setHovered] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    openTimer.current = setTimeout(() => setHovered(true), HOVER_OPEN_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    closeTimer.current = setTimeout(() => setHovered(false), HOVER_CLOSE_DELAY);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const collapsed = !hovered;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'hidden h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:flex',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo area — stops hover propagation so clicking the small logo doesn't expand the sidebar */}
      <div
        className="flex flex-col items-center border-b px-2 py-4"
        onMouseEnter={(e) => {
          if (collapsed) {
            e.stopPropagation();
            if (openTimer.current) {
              clearTimeout(openTimer.current);
              openTimer.current = null;
            }
          }
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Full logo — fades in when expanded */}
          <div
            className={cn(
              'flex flex-col items-center transition-all duration-300 ease-in-out',
              collapsed ? 'pointer-events-none h-0 scale-90 opacity-0' : 'h-auto scale-100 opacity-100',
            )}
          >
            <img src="/logo-light.png" alt="Plublista" className="h-[160px] dark:hidden" />
            <img src="/logo.png" alt="Plublista" className="hidden h-[160px] dark:block" />
            <img src="/logo-qr.png" alt="QR Code" className="-mt-[45px] size-[80px] object-contain logo-theme" />
          </div>
          {/* Small logo — clickable link to dashboard, doesn't trigger expand */}
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center justify-center transition-all duration-300 ease-in-out',
              collapsed ? 'h-auto scale-100 opacity-100' : 'pointer-events-none absolute h-0 scale-90 opacity-0',
            )}
          >
            <img src="/logo-qr.png" alt="Plublista" className="size-12 object-contain logo-theme" />
          </Link>
        </div>
      </div>

      {/* Main nav items */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </div>

      {/* Bottom nav items */}
      <div className="flex flex-col gap-1 border-t p-2">
        {bottomItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}

/** Sidebar content for mobile Sheet — full-screen style */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav role="navigation" aria-label="Main navigation" className="flex h-full flex-col">
      {/* Logo — centered */}
      <div className="flex flex-col items-center px-6 pt-6 pb-4">
        <img src="/logo-light.png" alt="Plublista" className="h-[160px] dark:hidden" />
        <img src="/logo.png" alt="Plublista" className="hidden h-[160px] dark:block" />
        <img src="/logo-qr.png" alt="QR Code" className="-mt-[45px] size-[80px] object-contain logo-theme" />
      </div>

      {/* Nav items — centered with breathing room */}
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex w-48 items-center gap-4 rounded-lg border-l-2 px-4 py-3 text-base font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-primary dark:bg-indigo-950 dark:text-indigo-400'
                  : 'border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent',
              )
            }
          >
            <item.icon className="size-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom — Settings */}
      <div className="flex flex-col items-center border-t border-sidebar-border px-8 py-4">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex w-48 items-center gap-4 rounded-lg border-l-2 px-4 py-3 text-base font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-primary dark:bg-indigo-950 dark:text-indigo-400'
                  : 'border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent',
              )
            }
          >
            <item.icon className="size-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
