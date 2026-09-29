import type { Payment } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { CategoryBadge } from '../common/CategoryBadge';
import { MerchantIcon } from '../common/MerchantIcon';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MandateActionsMenu, type MandateActionId } from './MandateActionsMenu';

export interface MandateTableProps {
  payments: Payment[];
  onAction: (action: MandateActionId, payment: Payment) => void;
}

/** Desktop table view. Mobile uses MandateCard instead so nothing overflows. */
export function MandateTable({ payments, onAction }: MandateTableProps) {
  const { t } = useTranslation();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">{t('mandates.title')}</caption>
          <thead>
            <tr className="border-b border-line bg-canvas/70">
              <Th>{t('common.merchant')}</Th>
              <Th>{t('common.category')}</Th>
              <Th align="right">{t('common.amount')}</Th>
              <Th>{t('common.frequency')}</Th>
              <Th>{t('mandates.nextDebit')}</Th>
              <Th>{t('common.status')}</Th>
              <Th>{t('common.priority')}</Th>
              <Th>{t('common.lastReviewed')}</Th>
              <Th align="right">{t('mandates.actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.map((payment) => (
              <tr key={payment.id} className="transition-colors hover:bg-canvas/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <MerchantIcon name={payment.icon} color={payment.color} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{payment.merchant}</p>
                      <p className="truncate text-[11px] text-ink-soft">{payment.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={payment.category} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="num text-sm font-bold text-ink">{formatCurrencyINR(payment.amount)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted">{payment.frequency}</td>
                <td className="px-4 py-3 text-sm text-ink-muted">
                  <span className="num">{formatDateShort(payment.dueDate)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge variant={payment.status} />
                    {payment.reviewRecommended && payment.status === 'Active' ? (
                      <StatusBadge variant="Review recommended" />
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={payment.priority} />
                </td>
                <td className="px-4 py-3 text-sm text-ink-muted">
                  <span className="num">{formatDateShort(payment.lastReviewed)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <MandateActionsMenu payment={payment} onAction={onAction} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export default MandateTable;
