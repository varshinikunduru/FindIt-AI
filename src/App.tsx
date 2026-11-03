import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrentPath } from '@/lib/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppShell from '@/components/AppShell';
import AuthPage from '@/pages/AuthPage';
import BrowsePage from '@/pages/BrowsePage';
import ItemDetailPage from '@/pages/ItemDetailPage';
import ReportPage from '@/pages/ReportPage';
import DashboardPage from '@/pages/DashboardPage';

function AppRoutes() {
  const path = useCurrentPath();
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700 dark:text-teal-400" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  let page: ReactNode;
  const itemMatch = path.match(/^\/items\/([^/]+)$/);
  if (itemMatch) {
    page = <ItemDetailPage key={itemMatch[1]} itemId={itemMatch[1]} />;
  } else if (path === '/report') {
    page = <ReportPage />;
  } else if (path === '/dashboard') {
    page = <DashboardPage />;
  } else {
    page = <BrowsePage />;
  }

  return <AppShell path={path}>{page}</AppShell>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
