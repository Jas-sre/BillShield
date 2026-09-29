import { motion } from 'framer-motion';
import { ArrowRight, CirclePause, Info, ShieldCheck, TrendingUp, TriangleAlert, Wallet } from 'lucide-react';
import type { PlanImprovement } from '../../context/BillShieldContext';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';

export interface BalanceHeroCardProps {
  balance: number;
  dueNext7Days: number;
  essentialNext7Days: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  comfortBuffer: number;
  daysBelowBuffer: number;
  hasShortfall: boolean;
  planImprovement: PlanImprovement | null;
  onReviewPlan: () => void;
  onSimulatePause: (paymentId: string) => void;
}

/**
 * The hero: what is available, what is already committed, and the calm warning
 * when the projection dips below the comfort buffer.
 */
export function BalanceHeroCard({
  balance,
  dueNext7Days,
  essentialNext7Days,
  lowestBalance,
  lowestBalanceDate,
  comfortBuffer,
  daysBelowBuffer,
  hasShortfall,
  planImprovement,
  onReviewPlan,
  onSimulatePause,
}: BalanceHeroCardProps) {
  const { t } = useTranslation();

  const status: 'shortfall' | 'plan-needed' | 'on-track' = hasShortfall
    ? 'shortfall'
    : lowestBalance < comfortBuffer
      ? 'plan-needed'
      : 'on-track';

  const statusLabel =
    status === 'shortfall'
      ? t('dash.planChipShortfall')
      : status === 'plan-needed'
        ? t('dash.planChip')
        : t('dash.planChipHealthy');

  const statusClass =
    status === 'shortfall'
      ? 'bg-danger-soft text-danger border-danger/20'
      : status === 'plan-needed'
        ? 'bg-warn-soft text-warn border-warn/25'
        : 'bg-success-soft text-success border-success/20';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="balance-hero-title"
      className="overflow-hidden rounded-card border border-primary/15 bg-surface shadow-card"
    >
      <div className="bg-gradient-to-br from-primary-soft via-surface to-surface px-5 py-5 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              {t('dash.availableBalance')}
            </p>
            <h2 id="balance-hero-title" className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {t('dash.title', { amount: formatCurrencyINR(balance) })}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {t('dash.summary', {
                total: formatCurrencyINR(dueNext7Days),
                essential: formatCurrencyINR(essentialNext7Days),
              })}
            </p>
          </div>

          <span className={cx('chip border', statusClass)}>
            {status === 'on-track' ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {statusLabel}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="surface-inset px-4 py-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t('dash.afterPayments', { amount: formatCurrencyINR(lowestBalance) })}
            </dt>
            <dd className="mt-1 text-xs text-ink-muted">
              {t('cashflow.lowestBalance')} · {formatDateShort(lowestBalanceDate)}
            </dd>
          </div>
          <div className="surface-inset px-4 py-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Info className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {t('dash.comfortBuffer', { amount: formatCurrencyINR(comfortBuffer) })}
            </dt>
            <dd className="mt-1 text-xs text-ink-muted">
              {t('cashflow.daysBelowBuffer')}: {daysBelowBuffer}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-3">
          <p
            className={cx(
              'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
              status === 'on-track'
                ? 'border-success/20 bg-success-soft text-ink'
                : 'border-warn/25 bg-warn-soft text-ink',
            )}
          >
            {lowestBalance < comfortBuffer
              ? `${t('alerts.lowBalanceOn', {
                  buffer: formatCurrencyINR(comfortBuffer),
                  date: formatDateShort(lowestBalanceDate),
                })} ${t('alerts.reviewOptional')}`
              : `${t('alerts.lowBalanceGeneric')} ${t('cashflow.safeToSpendNote')}`}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={onReviewPlan}>
              {t('dash.reviewCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {planImprovement ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onSimulatePause(planImprovement.payment.id)}
              >
                <CirclePause className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('dash.compareCta')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {planImprovement ? (
        <div className="border-t border-line bg-canvas/70 px-5 py-4 sm:px-7">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            <CirclePause className="h-3.5 w-3.5" aria-hidden="true" />
            {t('dash.planIdea')}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {t('dash.simulateImprovement', {
              merchant: planImprovement.merchant,
              from: formatCurrencyINR(planImprovement.currentLowest),
              to: formatCurrencyINR(planImprovement.improvedLowest),
            })}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{t('modal.pause.warning')}</p>
        </div>
      ) : (
        <div className="border-t border-line bg-canvas/70 px-5 py-4 sm:px-7">
          <p className="text-xs leading-relaxed text-ink-muted">{t('dash.essentialsNote')}</p>
        </div>
      )}
    </motion.section>
  );
}

export default BalanceHeroCard;
