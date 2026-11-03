import { useEffect, useState } from 'react';
import { Inbox, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ClaimRow from '@/components/ClaimRow';
import ReportRow from '@/components/ReportRow';
import { fetchClaimActivity, fetchMyReports, respondToClaim, withdrawClaim } from '@/lib/items';
import { cardClass, errorTextClass, primaryButtonClass } from '@/lib/styles';
import type { Claim, Item } from '@/lib/types';

type Tab = 'reports' | 'claims';

type DashboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; reports: Item[]; claims: Claim[] };

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [tab, setTab] = useState<Tab>('reports');
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchMyReports(userId), fetchClaimActivity()])
      .then(([reports, claims]) => {
        if (active) setState({ status: 'ready', reports, claims });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const runClaimAction = async (claimId: string, task: () => Promise<void>, failureMessage: string) => {
    setActionError(null);
    setBusyClaimId(claimId);
    try {
      await task();
      reload();
    } catch {
      setActionError(failureMessage);
    } finally {
      setBusyClaimId(null);
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center py-24" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700 dark:text-teal-400" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className={errorTextClass}>We couldn't load your dashboard. Check your connection and try again.</p>
        <button type="button" onClick={reload} className={primaryButtonClass}>
          Try again
        </button>
      </div>
    );
  }

  const { reports, claims } = state;
  const incomingClaims = claims
    .filter((claim) => claim.item?.user_id === userId)
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
  const outgoingClaims = claims.filter((claim) => claim.claimant_id === userId);
  const pendingIncoming = incomingClaims.filter((claim) => claim.status === 'pending').length;

  const stats = [
    { label: 'Your reports', value: reports.length },
    { label: 'Claims to review', value: pendingIncoming },
    { label: 'Your claims', value: outgoingClaims.length },
  ];

  return (
    <div className="space-y-10 animate-fade-up">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700 dark:text-teal-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your activity</h1>
        </div>
        <a href="#/report" className={primaryButtonClass}>
          <Plus className="h-4 w-4" />
          Report an item
        </a>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${cardClass} p-6`}>
            <p className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </section>

      <div role="tablist" aria-label="Dashboard sections" className="inline-flex w-full rounded-xl border border-stone-200 bg-white p-1 sm:w-auto dark:border-stone-800 dark:bg-stone-900">
        {(['reports', 'claims'] as const).map((value) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={`flex-1 rounded-lg px-5 py-2 text-sm font-medium transition duration-200 sm:flex-none ${
                active
                  ? 'bg-teal-700 text-white shadow-sm dark:bg-teal-400 dark:text-stone-950'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              {value === 'reports' ? 'My reports' : 'Claims'}
            </button>
          );
        })}
      </div>

      {tab === 'reports' ? (
        <section className="space-y-4 animate-fade-up">
          {reports.length === 0 ? (
            <EmptyPanel
              title="You have not reported anything yet."
              description="Post a lost or found item and it will appear on the board."
            />
          ) : (
            reports.map((item) => <ReportRow key={item.id} item={item} />)
          )}
        </section>
      ) : (
        <section className="space-y-10 animate-fade-up">
          {actionError && <p role="alert" className={errorTextClass}>{actionError}</p>}

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Claims on your items</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Review proof from community members and approve the rightful owner.
              </p>
            </div>
            {incomingClaims.length === 0 ? (
              <EmptyPanel title="No claims yet." description="When someone claims one of your items, it will show up here." />
            ) : (
              incomingClaims.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  mode="incoming"
                  busy={busyClaimId === claim.id}
                  onRespond={(approve) =>
                    runClaimAction(
                      claim.id,
                      () => respondToClaim(claim.id, approve),
                      "We couldn't update this claim. It may have already been answered.",
                    )
                  }
                />
              ))
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Your claims</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Track the items you have claimed.</p>
            </div>
            {outgoingClaims.length === 0 ? (
              <EmptyPanel title="You have not claimed anything." description="Open an item on the board and submit your proof." />
            ) : (
              outgoingClaims.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  mode="outgoing"
                  busy={busyClaimId === claim.id}
                  onWithdraw={() =>
                    runClaimAction(claim.id, () => withdrawClaim(claim.id), "We couldn't withdraw this claim. Please try again.")
                  }
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <Inbox className="h-6 w-6" />
      </span>
      <p className="font-bold">{title}</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{description}</p>
    </div>
  );
}
