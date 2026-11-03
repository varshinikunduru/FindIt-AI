import { CheckCircle2, Clock, Lock, XCircle } from 'lucide-react';
import type { ClaimStatus, ItemKind, ItemStatus } from '@/lib/types';

const BADGE_BASE = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium';

export function KindBadge({ kind }: { kind: ItemKind }) {
  const tone =
    kind === 'lost'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300'
      : 'bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300';
  return <span className={`${BADGE_BASE} ${tone}`}>{kind === 'lost' ? 'Lost' : 'Found'}</span>;
}

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  open: 'Open',
  claimed: 'Claim approved',
  resolved: 'Resolved',
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const tone =
    status === 'open'
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-300'
      : status === 'claimed'
        ? 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300'
        : 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200';
  return <span className={`${BADGE_BASE} ${tone}`}>{ITEM_STATUS_LABELS[status]}</span>;
}

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string; tone: string; Icon: typeof Clock }> = {
  pending: {
    label: 'Pending review',
    tone: 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300',
    Icon: Clock,
  },
  approved: {
    label: 'Approved',
    tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Not approved',
    tone: 'bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-300',
    Icon: XCircle,
  },
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const { label, tone, Icon } = CLAIM_STATUS_CONFIG[status];
  return (
    <span className={`${BADGE_BASE} ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function ClosedBadge() {
  return (
    <span className={`${BADGE_BASE} bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200`}>
      <Lock className="h-3.5 w-3.5" />
      Closed
    </span>
  );
}
