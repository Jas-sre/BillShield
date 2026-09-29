import { CirclePause, CirclePlay, Clock, EyeOff, Repeat2 } from 'lucide-react';
import type { Payment } from '../../types';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort, formatRelativeDays } from '../../utils/dates';
import { useTranslation } from '../../hooks/useTranslation';
import { CategoryBadge } from '../common/CategoryBadge';
import { MerchantIcon } from '../common/MerchantIcon';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';

export interface PaymentCardProps {
  payment: Payment;
  today: string;
  onViewDetails: (paymentId: string) => void;
  onSimulatePause?: (paymentId: string) => void;
  variant?: 'row' | 'tile';
  className?: string;
}

/**
 * One recurring payment. Rows are used inside lists, tiles inside grids —
 * tiles become rows on smaller screens so tables never overflow on mobile.
 */
export function PaymentCard({
  payment,
  today,
  onViewDetails,
  onSimulatePause,
  variant = 'row',
  className,
}: PaymentCardProps) {
  const { t } = useTranslation();
  const isPaused = payment.status === 'Paused in plan';

  const dueLine = (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {formatDateShort(payment.dueDate)} · {formatRelativeDays(payment.dueDate, today)}
    </span>
  );

  return (
    <article
      className={cx(
        'group flex flex-col gap-3 border-line transition-colors',
        variant === 'tile' ? 'card card-pad hover:border-primary/25' : 'py-3.5 sm:flex-row sm:items-center',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <MerchantIcon name={payment.icon} color={payment.color} size={variant === 'tile' ? 'lg' : 'md'} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink sm:text-base">{payment.merchant}</h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{payment.description}</p>
            </div>
            <div className="shrink-0 text-right sm:hidden">
              <p className="num text-sm font-bold text-ink">{formatCurrencyINR(payment.amount)}</p>
              <p className="text-[11px] text-ink-soft">{payment.frequency}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {dueLine}
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
              {payment.frequency}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={payment.category} />
            <PriorityBadge priority={payment.priority} />
            {isPaused ? (
              <StatusBadge variant="Paused in plan" />
            ) : payment.reviewRecommended ? (
              <StatusBadge variant="Review recommended" />
            ) : null}
            {payment.hiddenFromDashboard ? (
              <span className="chip border border-slate-200 bg-slate-100 text-slate-600">
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                {t('status.hidden')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="hidden shrink-0 text-right sm:block">
          <p className="num text-base font-bold text-ink">{formatCurrencyINR(payment.amount)}</p>
          <p className="text-[11px] text-ink-soft">{payment.frequency}</p>
        </div>

        <div className="flex items-center gap-2">
          {onSimulatePause ? (
            <button
              type="button"
              className={cx('btn btn-sm', isPaused ? 'btn-secondary' : 'btn-ghost')}
              onClick={() => onSimulatePause(payment.id)}
              title={isPaused ? t('mandates.action.resume') : t('mandates.action.pause')}
              aria-label={`${isPaused ? t('mandates.action.resume') : t('mandates.action.pause')}: ${
                payment.merchant
              }`}
            >
              {isPaused ? (
                <CirclePlay className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CirclePause className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isPaused ? t('mandates.action.resume') : t('modal.pause.confirm')}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onViewDetails(payment.id)}
            aria-label={`${t('common.viewDetails')}: ${payment.merchant}`}
          >
            {t('common.viewDetails')}
          </button>
        </div>
      </div>
    </article>
  );
}

export default PaymentCard;
