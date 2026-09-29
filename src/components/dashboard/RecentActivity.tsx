import { History } from 'lucide-react';
import type { ActivityItem } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDateMedium } from '../../utils/dates';
import { MerchantIcon } from '../common/MerchantIcon';

export interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  const { t } = useTranslation();

  return (
    <section className="card card-pad" aria-labelledby="recent-activity-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-activity-title" className="section-title flex items-center gap-2">
          <History className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('dash.activityTitle')}
        </h2>
        <span className="chip border border-line bg-surface text-ink-muted">{t('common.demoData')}</span>
      </div>

      <ol className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <MerchantIcon name={item.icon} color="#0F766E" size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug text-ink">{item.text}</p>
              <p className="text-[11px] text-ink-soft">{formatDateMedium(item.date)}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs text-ink-muted">{t('dash.activityNote')}</p>
    </section>
  );
}

export default RecentActivity;
