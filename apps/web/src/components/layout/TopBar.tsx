import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/stores/useUiStore';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function TopBar({ title }: { title: string }) {
  const navigate = useNavigate();
  const setSidebarMobileOpen = useUiStore((s) => s.setSidebarMobileOpen);
  const darkMode = useUiStore((s) => s.darkMode);
  const toggleDarkMode = useUiStore((s) => s.toggleDarkMode);
  const { user, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center border-b bg-background px-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <h1 className="ml-2 text-lg font-semibold md:ml-0">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.displayName ?? 'User'}</span>
              <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleDarkMode}>
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
