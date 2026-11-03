import { MapPin, PackageSearch } from 'lucide-react';
import { itemHref } from '@/lib/navigation';
import { getItemPhotoUrl } from '@/lib/items';
import { CATEGORY_LABELS, type Item } from '@/lib/types';
import { formatDate, timeAgo } from '@/lib/format';
import { KindBadge } from '@/components/Badges';

export default function ItemCard({ item }: { item: Item }) {
  return (
    <a
      href={itemHref(item.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {item.image_path ? (
          <img
            src={getItemPhotoUrl(item.image_path)}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-stone-600">
            <PackageSearch className="h-12 w-12" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <KindBadge kind={item.kind} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-bold leading-snug">{item.title}</h3>
          <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">{timeAgo(item.created_at)}</span>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {CATEGORY_LABELS[item.category]}
          {item.color ? ` · ${item.color}` : ''}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.location_text}</span>
          </span>
          <span className="shrink-0">{formatDate(item.occurred_on)}</span>
        </div>
      </div>
    </a>
  );
}
