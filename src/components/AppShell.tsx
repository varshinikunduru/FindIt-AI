import { useState, type ReactNode } from 'react';
import { LayoutDashboard, LogOut, Moon, PackageSearch, Plus, Search, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_ITEMS = [
  { path: '/', label: 'Browse', icon: Search },
  { path: '/report', label: 'Report item', icon: Plus },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

interface AppShellProps {
  path: string;
  children: ReactNode;
}

export default function AppShell({ path, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) || user?.email || 'Member';

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition duration-200 ${
      active
        ? 'bg-teal-700 text-white dark:bg-teal-400 dark:text-stone-950'
        : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
    }`;

  const navLinks = NAV_ITEMS.map(({ path: itemPath, label, icon: Icon }) => (
    <a
      key={itemPath}
      href={`#${itemPath}`}
      aria-current={path === itemPath ? 'page' : undefined}
      className={linkClass(path === itemPath)}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  ));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white dark:bg-teal-400 dark:text-stone-950">
              <PackageSearch className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">FindIt AI</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navLinks}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition duration-200 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className="hidden max-w-[10rem] truncate text-sm text-stone-600 lg:block dark:text-stone-400">
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-stone-200 px-4 py-2 md:hidden dark:border-stone-800" aria-label="Mobile">
          {navLinks}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
