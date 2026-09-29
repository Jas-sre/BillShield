import { BellRing, Repeat2 } from 'lucide-react';
import type { Payment } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateMedium, formatRelativeDays } from '../../utils/dates';
import { CategoryBadge } from '../common/CategoryBadge';
import { MerchantIcon } from '../common/MerchantIcon';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MandateActionsMenu, type MandateActionId } from './MandateActionsMenu';

export interface MandateCardProps {
  payment: Payment;
  today: string;
  onAction: (action: MandateActionId, payment: Payment) => void;
}

/** Mobile view of a mandate — the table becomes cards so nothing overflows. */
export function MandateCard({ payment, today, onAction }: MandateCardProps) {
  const { t } = useTranslation();

  return (
    <article className="card card-pad space-y-3">
      <div className="flex items-start gap-3">
        <MerchantIcon name={payment.icon} color={payment.color} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">{payment.merchant}</h3>
          <p className="truncate text-xs text-ink-muted">{payment.description}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
            <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
            {payment.frequency}
          </p>
        </div>
        <MandateActionsMenu payment={payment} onAction={onAction} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/60 px-3 py-2.5">
        <div>
          <p className="label">{t('common.amount')}</p>
          <p className="num text-base font-bold text-ink">{formatCurrencyINR(payment.amount)}</p>
        </div>
        <div className="text-right">
          <p className="label">{t('mandates.nextDebit')}</p>
          <p className="num text-sm font-semibold text-ink">
            {formatDateMedium(payment.dueDate)} · {formatRelativeDays(payment.dueDate, today)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={payment.category} />
        <PriorityBadge priority={payment.priority} />
        <StatusBadge variant={payment.status} />
        {payment.reviewRecommended && payment.status === 'Active' ? (
          <StatusBadge variant="Review recommended" />
        ) : null}
        {payment.hiddenFromDashboard ? <StatusBadge variant="Hidden from dashboard" /> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <span>
          {t('common.lastReviewed')}: <span className="num">{formatDateMedium(payment.lastReviewed)}</span>
        </span>
        {payment.reminderEnabled ? (
          <span className="chip border border-success/20 bg-success-soft text-success">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            {t('modal.detail.reminderSet')}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default MandateCard;
