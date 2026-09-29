import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';

export interface MoneyAllocationBarProps {
  balance: number;
  essential: number;
  other: number;
  remaining: number;
  className?: string;
}

interface Segment {
  key: 'essential' | 'other' | 'remaining';
  label: string;
  amount: number;
  className: string;
  dot: string;
}

/**
 * A single visual sentence: how the available balance is already committed in
 * the next 7 days, and what is left afterwards.
 */
export function MoneyAllocationBar({ balance, essential, other, remaining, className }: MoneyAllocationBarProps) {
  const { t } = useTranslation();

  const safeTotal = balance > 0 ? balance : 1;
  const segments: Segment[] = [
    {
      key: 'essential',
      label: t('dash.legend.essential'),
      amount: essential,
      className: 'bg-primary',
      dot: 'bg-primary',
    },
    {
      key: 'other',
      label: t('dash.legend.other'),
      amount: other,
      className: 'bg-accent',
      dot: 'bg-accent',
    },
    {
      key: 'remaining',
      label: t('dash.legend.remaining'),
      amount: Math.max(0, remaining),
      className: 'bg-slate-300',
      dot: 'bg-slate-300',
    },
  ];

  return (
    <section className={cx('card card-pad', className)} aria-labelledby="allocation-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="allocation-title" className="section-title">
            {t('dash.allocationTitle')}
          </h2>
          <p className="muted mt-1 max-w-xl">{t('dash.allocationNote')}</p>
        </div>
        <p className="num text-sm font-semibold text-ink">
          {t('dash.availableBalance')}: {formatCurrencyINR(balance)}
        </p>
      </div>

      <div
        className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`${t('dash.legend.essential')} ${formatCurrencyINR(essential)}, ${t('dash.legend.other')} ${formatCurrencyINR(
          other,
        )}, ${t('dash.legend.remaining')} ${formatCurrencyINR(Math.max(0, remaining))}`}
      >
        {segments.map((segment, index) => (
          <motion.span
            key={segment.key}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (Math.max(0, segment.amount) / safeTotal) * 100)}%` }}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={cx('h-full', segment.className)}
          />
        ))}
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-2">
            <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', segment.dot)} aria-hidden="true" />
            <div className="min-w-0">
              <dt className="truncate text-xs text-ink-muted">{segment.label}</dt>
              <dd className="num text-sm font-semibold text-ink">{formatCurrencyINR(segment.amount)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default MoneyAllocationBar;
