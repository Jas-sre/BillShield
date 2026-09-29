import { ShieldCheck } from 'lucide-react';
import type { EssentialReadinessItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { MerchantIcon } from '../common/MerchantIcon';
import { StatusBadge } from '../common/StatusBadge';
import type { IconName } from '../../types';
import { getIconComponent } from '../common/MerchantIcon';

export interface EssentialProtectionItem extends EssentialReadinessItem {
  icon: IconName;
  color: string;
}

export interface EssentialProtectionProps {
  items: EssentialProtectionItem[];
  note?: string;
  onViewDetails: (paymentId: string) => void;
}

export function EssentialProtection({ items, note, onViewDetails }: EssentialProtectionProps) {
  const { t } = useTranslation();

  return (
    <section className="card card-pad" aria-labelledby="essential-protection-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="essential-protection-title" className="section-title flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
          {t('dash.essentialsTitle')}
        </h2>
        <p className="text-xs font-semibold text-ink-muted">
          {items.filter((item) => item.status === 'Protected').length}/{items.length}{' '}
          {t('status.protected').toLowerCase()}
        </p>
      </div>

      <ul className="mt-3 divide-y divide-line">
        {items.map((item) => {
          const Icon = getIconComponent(item.icon);
          return (
            <li key={item.paymentId} className="flex flex-wrap items-center gap-3 py-3">
              <MerchantIcon name={item.icon} color={item.color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.merchant}</p>
                <p className="num text-xs text-ink-muted">
                  {formatCurrencyINR(item.amount)} · {formatDateShort(item.dueDate)}
                </p>
              </div>
              <StatusBadge variant={item.status} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onViewDetails(item.paymentId)}
                aria-label={`${t('common.viewDetails')}: ${item.merchant}`}
                title={t('common.viewDetails')}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{note ?? t('dash.essentialsNote')}</p>
    </section>
  );
}

export default EssentialProtection;
