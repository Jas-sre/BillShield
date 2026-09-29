import { cx } from '../../utils/cx';

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-full bg-slate-200/70', className ?? 'h-3 w-full')} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx('card card-pad space-y-3', className)} aria-hidden="true">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-8 w-1/2" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  );
}

/** Full dashboard placeholder used while the demo state hydrates. */
export function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading your plan…</span>
      <SkeletonCard className="h-52" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-72" />
    </div>
  );
}
