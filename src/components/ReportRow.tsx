import { MapPin, PackageSearch } from 'lucide-react';
import { ItemStatusBadge, KindBadge } from '@/components/Badges';
import { getItemPhotoUrl } from '@/lib/items';
import { itemHref } from '@/lib/navigation';
import { formatDate } from '@/lib/format';
import { cardClass } from '@/lib/styles';
import type { Item } from '@/lib/types';

export default function ReportRow({ item }: { item: Item }) {
  return (
    <a
      href={itemHref(item.id)}
      className={`${cardClass} flex items-center gap-5 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
        {item.image_path ? (
          <img src={getItemPhotoUrl(item.image_path)} alt="" className="h-full w-full object-cover" />
        ) : (
          <PackageSearch className="h-7 w-7 text-stone-400 dark:text-stone-600" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <KindBadge kind={item.kind} />
          <ItemStatusBadge status={item.status} />
        </div>
        <p className="truncate font-bold">{item.title}</p>
        <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.location_text}</span>
          <span>· {formatDate(item.occurred_on)}</span>
        </p>
      </div>
    </a>
  );
}
