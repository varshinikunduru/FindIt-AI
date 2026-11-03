import { useEffect, useState } from 'react';

function readPath(): string {
  const raw = window.location.hash.replace(/^#/, '');
  return raw.startsWith('/') ? raw : '/';
}

export function useCurrentPath(): string {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const handleChange = () => setPath(readPath());
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  return path;
}

export function itemHref(itemId: string): string {
  return `#/items/${itemId}`;
}

export function navigateTo(path: string): void {
  window.location.hash = path;
}
