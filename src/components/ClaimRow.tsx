import { Loader2, PackageSearch, Undo2, Check, X } from 'lucide-react';
import { ClaimStatusBadge } from '@/components/Badges';
import { getItemPhotoUrl } from '@/lib/items';
import { itemHref } from '@/lib/navigation';
import { timeAgo } from '@/lib/format';
import { cardClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';
import type { Claim } from '@/lib/types';

interface ClaimRowProps {
  claim: Claim;
  mode: 'incoming' | 'outgoing';
  busy: boolean;
  onRespond?: (approve: boolean) => void;
  onWithdraw?: () => void;
}

export default function ClaimRow({ claim, mode, busy, onRespond, onWithdraw }: ClaimRowProps) {
  const itemTitle = claim.item?.title ?? 'Removed item';
  const isPending = claim.status === 'pending';

  return (
    <article className={`${cardClass} flex flex-col gap-5 p-5 sm:flex-row sm:items-start`}>
      <a
        href={claim.item ? itemHref(claim.item.id) : '#/'}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800"
      >
        {claim.item?.image_path ? (
          <img src={getItemPhotoUrl(claim.item.image_path)} alt="" className="h-full w-full object-cover" />
        ) : (
          <PackageSearch className="h-7 w-7 text-stone-400 dark:text-stone-600" />
        )}
      </a>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <a href={claim.item ? itemHref(claim.item.id) : '#/'} className="font-bold leading-snug hover:underline">
              {itemTitle}
            </a>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              {mode === 'incoming'
                ? `Claimed by ${claim.claimant?.display_name ?? 'a community member'}`
                : 'Your claim'}{' '}
              · {timeAgo(claim.created_at)}
            </p>
          </div>
          <ClaimStatusBadge status={claim.status} />
        </div>

        <blockquote className="rounded-xl border-l-2 border-teal-700 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:border-teal-400 dark:bg-stone-950/60 dark:text-stone-300">
          {claim.proof}
        </blockquote>

        {isPending && mode === 'incoming' && onRespond && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => onRespond(true)} disabled={busy} className={primaryButtonClass}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve claim
            </button>
            <button type="button" onClick={() => onRespond(false)} disabled={busy} className={secondaryButtonClass}>
              <X className="h-4 w-4" />
              Decline
            </button>
            <p className="text-xs text-stone-500 dark:text-stone-400 sm:ml-2">
              Approving marks the item as claimed and declines other pending claims.
            </p>
          </div>
        )}

        {isPending && mode === 'outgoing' && onWithdraw && (
          <button type="button" onClick={onWithdraw} disabled={busy} className={secondaryButtonClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            Withdraw claim
          </button>
        )}
      </div>
    </article>
  );
}
