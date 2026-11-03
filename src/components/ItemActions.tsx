import { useState } from 'react';
import { CheckCheck, Loader2, LayoutDashboard, Trash2, Undo2 } from 'lucide-react';
import Modal from '@/components/Modal';
import ClaimModal from '@/components/ClaimModal';
import { ClaimStatusBadge } from '@/components/Badges';
import { deleteItem, markItemResolved, withdrawClaim } from '@/lib/items';
import { navigateTo } from '@/lib/navigation';
import { cardClass, dangerButtonClass, errorTextClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';
import type { Claim, Item } from '@/lib/types';

interface ItemActionsProps {
  item: Item;
  claims: Claim[];
  userId: string;
  onChanged: () => void;
}

type PendingAction = 'resolve' | 'delete' | 'withdraw';

export default function ItemActions({ item, claims, userId, onChanged }: ItemActionsProps) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner = item.user_id === userId;
  const myClaim = claims.find((claim) => claim.claimant_id === userId) ?? null;
  const pendingClaimCount = claims.filter((claim) => claim.status === 'pending').length;

  const runAction = async (action: PendingAction, task: () => Promise<void>, failureMessage: string) => {
    setActionError(null);
    setPending(action);
    try {
      await task();
      return true;
    } catch {
      setActionError(failureMessage);
      return false;
    } finally {
      setPending(null);
    }
  };

  const handleResolve = async () => {
    if (await runAction('resolve', () => markItemResolved(item.id), "We couldn't mark this item as resolved. Please try again.")) {
      onChanged();
    }
  };

  const handleDelete = async () => {
    const deleted = await runAction('delete', () => deleteItem(item), "We couldn't delete this report. Please try again.");
    if (deleted) navigateTo('/dashboard');
  };

  const handleWithdraw = async () => {
    if (!myClaim) return;
    const claimId = myClaim.id;
    if (await runAction('withdraw', () => withdrawClaim(claimId), "We couldn't withdraw your claim. Please try again.")) {
      onChanged();
    }
  };

  const handleClaimSubmitted = () => {
    setClaimOpen(false);
    onChanged();
  };

  return (
    <div className="space-y-4">
      {isOwner ? (
        <div className={`${cardClass} space-y-5 p-6`}>
          <div>
            <h2 className="text-lg font-bold">Your report</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {item.status === 'open' && 'Your report is live. Review claims as they come in.'}
              {item.status === 'claimed' && 'A claim was approved. Mark this report as resolved once the item is handed back.'}
              {item.status === 'resolved' && 'This report is resolved and closed to new claims.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {claims.length > 0 && (
              <a href="#/dashboard" className={secondaryButtonClass}>
                <LayoutDashboard className="h-4 w-4" />
                Review claims
                {pendingClaimCount > 0 && (
                  <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white dark:bg-sky-400 dark:text-stone-950">
                    {pendingClaimCount} pending
                  </span>
                )}
              </a>
            )}
            {item.status !== 'resolved' && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={pending !== null}
                className={primaryButtonClass}
              >
                {pending === 'resolve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                Mark as resolved
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={pending !== null}
              className={dangerButtonClass}
            >
              <Trash2 className="h-4 w-4" />
              Delete report
            </button>
          </div>
          {actionError && <p role="alert" className={errorTextClass}>{actionError}</p>}
        </div>
      ) : myClaim ? (
        <div className={`${cardClass} space-y-5 p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Your claim</h2>
            <ClaimStatusBadge status={myClaim.status} />
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {myClaim.status === 'pending' && 'The reporter will review your proof. You can withdraw the claim while it is pending.'}
            {myClaim.status === 'approved' && 'The reporter approved your claim. This item is now reserved for you.'}
            {myClaim.status === 'rejected' && 'The reporter did not approve this claim.'}
          </p>
          {myClaim.status === 'pending' && (
            <button type="button" onClick={handleWithdraw} disabled={pending !== null} className={secondaryButtonClass}>
              {pending === 'withdraw' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Withdraw claim
            </button>
          )}
          {actionError && <p role="alert" className={errorTextClass}>{actionError}</p>}
        </div>
      ) : item.status === 'open' ? (
        <div className={`${cardClass} space-y-5 p-6`}>
          <div>
            <h2 className="text-lg font-bold">Is this yours?</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Submit proof of ownership or describe where you found it. The reporter decides who receives it.
            </p>
          </div>
          <button type="button" onClick={() => setClaimOpen(true)} className={`${primaryButtonClass} w-full`}>
            Claim this item
          </button>
        </div>
      ) : (
        <div className={`${cardClass} p-6`}>
          <p className="text-sm text-stone-600 dark:text-stone-400">This item is no longer open for claims.</p>
        </div>
      )}

      {claimOpen && (
        <ClaimModal
          itemId={item.id}
          itemTitle={item.title}
          onClose={() => setClaimOpen(false)}
          onSubmitted={handleClaimSubmitted}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete this report?" onClose={() => setConfirmDelete(false)}>
          <div className="space-y-6">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              This removes &quot;{item.title}&quot; and any claims on it from the board. This cannot be undone.
            </p>
            {actionError && <p role="alert" className={errorTextClass}>{actionError}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmDelete(false)} className={secondaryButtonClass}>
                Keep report
              </button>
              <button type="button" onClick={handleDelete} disabled={pending !== null} className={dangerButtonClass}>
                {pending === 'delete' && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
