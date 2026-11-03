import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, PackageSearch, Palette, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ItemActions from '@/components/ItemActions';
import ItemCard from '@/components/ItemCard';
import { ItemStatusBadge, KindBadge } from '@/components/Badges';
import { fetchClaimsForItem, fetchItem, fetchPossibleMatches, getItemPhotoUrl } from '@/lib/items';
import { formatDate, timeAgo } from '@/lib/format';
import { cardClass, errorTextClass } from '@/lib/styles';
import { CATEGORY_LABELS, type Claim, type Item } from '@/lib/types';

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; item: Item | null; claims: Claim[]; matches: Item[] };

async function loadDetail(itemId: string, userId: string): Promise<DetailState> {
  const item = await fetchItem(itemId);
  if (!item) return { status: 'ready', item: null, claims: [], matches: [] };
  const [claims, matches] = await Promise.all([
    fetchClaimsForItem(itemId),
    item.status === 'open' ? fetchPossibleMatches(item, userId) : Promise.resolve<Item[]>([]),
  ]);
  return { status: 'ready', item, claims, matches };
}

export default function ItemDetailPage({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [detail, setDetail] = useState<DetailState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    loadDetail(itemId, userId)
      .then((next) => {
        if (active) setDetail(next);
      })
      .catch(() => {
        if (active) setDetail({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [itemId, userId, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  if (detail.status === 'loading') {
    return (
      <div className="grid gap-10 lg:grid-cols-5" aria-busy="true">
        <div className="skeleton aspect-[4/3] rounded-2xl bg-stone-200 dark:bg-stone-800 lg:col-span-3" />
        <div className="space-y-4 lg:col-span-2">
          <div className="skeleton h-8 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
          <div className="skeleton h-4 w-1/2 rounded bg-stone-200 dark:bg-stone-800" />
          <div className="skeleton h-32 rounded-2xl bg-stone-200 dark:bg-stone-800" />
        </div>
      </div>
    );
  }

  if (detail.status === 'error') {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className={errorTextClass}>We couldn't load this report. Check your connection and try again.</p>
        <button type="button" onClick={reload} className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
          Try again
        </button>
      </div>
    );
  }

  const { item, claims, matches } = detail;

  if (!item) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-bold">This report could not be found.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">It may have been removed by its reporter.</p>
        <a href="#/" className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
          Back to browse
        </a>
      </div>
    );
  }

  const matchesSorted = [...matches].sort(
    (a, b) =>
      Number(b.color.toLowerCase() === item.color.toLowerCase()) - Number(a.color.toLowerCase() === item.color.toLowerCase()),
  );
  const occurredLabel = item.kind === 'lost' ? 'Date lost' : 'Date found';
  const locationLabel = item.kind === 'lost' ? 'Last seen' : 'Found at';

  return (
    <div className="space-y-14 animate-fade-up">
      <a href="#/" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </a>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            {item.image_path ? (
              <img
                src={getItemPhotoUrl(item.image_path)}
                alt={item.title}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-stone-400 dark:text-stone-600">
                <PackageSearch className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <KindBadge kind={item.kind} />
              <ItemStatusBadge status={item.status} />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">{item.title}</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Reported by {item.reporter?.display_name ?? 'a community member'} · {timeAgo(item.created_at)}
            </p>
          </div>

          <dl className={`${cardClass} grid grid-cols-2 gap-5 p-6`}>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Tag className="h-3.5 w-3.5" /> Category
              </dt>
              <dd className="mt-1.5 font-medium">{CATEGORY_LABELS[item.category]}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Palette className="h-3.5 w-3.5" /> Color
              </dt>
              <dd className="mt-1.5 font-medium">{item.color || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <MapPin className="h-3.5 w-3.5" /> {locationLabel}
              </dt>
              <dd className="mt-1.5 font-medium">{item.location_text}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Calendar className="h-3.5 w-3.5" /> {occurredLabel}
              </dt>
              <dd className="mt-1.5 font-medium">{formatDate(item.occurred_on)}</dd>
            </div>
          </dl>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">Description</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700 dark:text-stone-300">
              {item.description || 'No description was provided.'}
            </p>
          </div>

          <ItemActions item={item} claims={claims} userId={userId} onChanged={reload} />
        </div>
      </div>

      {item.status === 'open' && matchesSorted.length > 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Possible matches</h2>
            <p className="mt-1 text-stone-600 dark:text-stone-400">
              Open reports from the opposite side in the same category. Matching colors are listed first.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchesSorted.map((match) => (
              <ItemCard key={match.id} item={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
