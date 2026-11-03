import { useEffect, useState } from 'react';
import { Inbox, Plus, Search } from 'lucide-react';
import ItemCard from '@/components/ItemCard';
import { fetchBrowseItems } from '@/lib/items';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Item, type ItemKind } from '@/lib/types';
import { inputClass, primaryButtonClass } from '@/lib/styles';

type KindFilter = ItemKind | 'all';

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
];

type BrowseState =
  | { status: 'loading' }
  | { status: 'ready'; items: Item[] }
  | { status: 'error' };

export default function BrowsePage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);
  const [kind, setKind] = useState<KindFilter>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [browse, setBrowse] = useState<BrowseState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setBrowse({ status: 'loading' });
    fetchBrowseItems({ query: debouncedQuery, kind, category })
      .then((items) => {
        if (active) setBrowse({ status: 'ready', items });
      })
      .catch(() => {
        if (active) setBrowse({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [debouncedQuery, kind, category, reloadKey]);

  return (
    <div className="space-y-10 animate-fade-up">
      <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700 dark:text-teal-400">Community board</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Find what's yours, or help someone find theirs.
          </h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Search by item, color, place, or category. Every claim is verified by the person who reported it.
          </p>
        </div>
        <a href="#/report" className={`${primaryButtonClass} shrink-0`}>
          <Plus className="h-4 w-4" />
          Report an item
        </a>
      </section>

      <section className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'black backpack', 'keys with red keychain', or 'Central Station'"
            aria-label="Search items"
            className={`${inputClass} py-3.5 pl-12 pr-4 text-base shadow-sm`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter by type" className="inline-flex w-fit rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900">
            {KIND_FILTERS.map((option) => {
              const active = kind === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  aria-pressed={active}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition duration-200 ${
                    active
                      ? 'bg-teal-700 text-white shadow-sm dark:bg-teal-400 dark:text-stone-950'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | 'all')}
            aria-label="Filter by category"
            className={`${inputClass} sm:w-56`}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <BrowseResults browse={browse} hasFilters={Boolean(query.trim()) || kind !== 'all' || category !== 'all'} onRetry={() => setReloadKey((key) => key + 1)} />
    </div>
  );
}

function BrowseResults({
  browse,
  hasFilters,
  onRetry,
}: {
  browse: BrowseState;
  hasFilters: boolean;
  onRetry: () => void;
}) {
  if (browse.status === 'loading') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <div className="skeleton aspect-[4/3] bg-stone-100 dark:bg-stone-800" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-4 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
              <div className="skeleton h-3 w-1/2 rounded bg-stone-200 dark:bg-stone-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (browse.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center dark:border-stone-700">
        <p className="font-medium">We couldn't load the board right now.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">Check your connection and try again.</p>
        <button type="button" onClick={onRetry} className={primaryButtonClass}>
          Try again
        </button>
      </div>
    );
  }

  if (browse.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center dark:border-stone-700">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          <Inbox className="h-7 w-7" />
        </span>
        <div>
          <p className="font-bold">{hasFilters ? 'No open reports match your search.' : 'No open reports yet.'}</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {hasFilters ? 'Try a broader term or clear the filters.' : 'Be the first to post a lost or found item.'}
          </p>
        </div>
        {!hasFilters && (
          <a href="#/report" className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            Report an item
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-sm text-stone-500 dark:text-stone-400">
        {browse.items.length} open {browse.items.length === 1 ? 'report' : 'reports'}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {browse.items.map((item) => (
          <div key={item.id} className="animate-fade-up">
            <ItemCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
