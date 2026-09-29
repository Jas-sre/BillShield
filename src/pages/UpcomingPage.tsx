import { Info, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { SearchInput } from '../components/common/SearchInput';
import { Tooltip } from '../components/common/Tooltip';
import { PageHeader } from '../components/layout/PageHeader';
import { PaymentCard } from '../components/payments/PaymentCard';
import { PaymentTimeline } from '../components/payments/PaymentTimeline';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import type { Category, Payment, Priority } from '../types';
import { cx } from '../utils/cx';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateShort } from '../utils/dates';
import {
  NEXT_DAYS_WINDOW,
  getPaymentsInNextWindow,
  getPaymentsInVisibleMonth,
  getUpcomingPayments,
  sumPayments,
} from '../utils/forecast';

type Tab = 'week' | 'month' | 'all';
type FilterKey = 'All' | Category;
type SortKey = 'dueDate' | 'amount' | 'priority';

const PRIORITY_ORDER: Record<Priority, number> = { Essential: 0, Important: 1, Optional: 2 };

const FILTER_KEYS: Array<{ key: FilterKey; labelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0] }> = [
  { key: 'All', labelKey: 'common.all' },
  { key: 'Bills', labelKey: 'category.bills' },
  { key: 'Subscriptions', labelKey: 'category.subscriptions' },
  { key: 'EMI', labelKey: 'category.emi' },
  { key: 'Insurance', labelKey: 'category.insurance' },
  { key: 'Investments', labelKey: 'category.investments' },
];

export default function UpcomingPage() {
  const { state, todaysDate, metrics, openModal } = useBillShield();
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>('week');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scopedPayments = useMemo(() => {
    if (tab === 'week') return getPaymentsInNextWindow(state.payments, todaysDate, NEXT_DAYS_WINDOW);
    if (tab === 'month') return getPaymentsInVisibleMonth(state.payments, todaysDate);
    return getUpcomingPayments(state.payments, todaysDate, { includePaused: true });
  }, [tab, state.payments, todaysDate]);

  const visible = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    const filtered = scopedPayments.filter((payment) => {
      const matchesCategory = filter === 'All' || payment.category === filter;
      const matchesDate = selectedDate === null || payment.dueDate === selectedDate;
      const matchesQuery =
        normalisedQuery.length === 0 ||
        payment.merchant.toLowerCase().includes(normalisedQuery) ||
        payment.description.toLowerCase().includes(normalisedQuery) ||
        payment.category.toLowerCase().includes(normalisedQuery);
      return matchesCategory && matchesDate && matchesQuery;
    });

    return [...filtered].sort(compareBy(sortKey));
  }, [scopedPayments, filter, selectedDate, query, sortKey]);

  const total = sumPayments(visible);
  const tabs: Array<{ key: Tab; labelKey: Parameters<typeof t>[0]; count: number }> = [
    { key: 'week', labelKey: 'upcoming.tab.week', count: getPaymentsInNextWindow(state.payments, todaysDate, NEXT_DAYS_WINDOW).length },
    { key: 'month', labelKey: 'upcoming.tab.month', count: getPaymentsInVisibleMonth(state.payments, todaysDate).length },
    { key: 'all', labelKey: 'upcoming.tab.all', count: getUpcomingPayments(state.payments, todaysDate, { includePaused: true }).length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t('upcoming.title')} subtitle={t('upcoming.subtitle')} eyebrow={t('common.demoData')} />

      <section className="card card-pad space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t('upcoming.title')} className="flex flex-wrap gap-1 rounded-2xl border border-line bg-canvas/70 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`upcoming-tab-${item.key}`}
                aria-selected={tab === item.key}
                aria-controls="upcoming-panel"
                onClick={() => {
                  setTab(item.key);
                  setSelectedDate(null);
                }}
                className={cx(
                  'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  tab === item.key ? 'bg-surface text-primary-dark shadow-card' : 'text-ink-muted hover:text-ink',
                )}
              >
                {t(item.labelKey)}
                <span className="ml-1.5 text-xs text-ink-soft">{item.count}</span>
              </button>
            ))}
          </div>

          <p className="num text-sm font-semibold text-ink">
            {t('upcoming.dayTotal', { count: visible.length, amount: formatCurrencyINR(total) })}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder={t('upcoming.searchPlaceholder')} label={t('common.search')} />
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t('upcoming.filter')}</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterKey)}
              className="input py-2"
              aria-label={t('upcoming.filter')}
            >
              {FILTER_KEYS.map((option) => (
                <option key={option.key} value={option.key}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="sr-only sm:not-sr-only">{t('upcoming.sort')}</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="input py-2"
              aria-label={t('upcoming.sort')}
            >
              <option value="dueDate">{t('upcoming.sort.dueDate')}</option>
              <option value="amount">{t('upcoming.sort.amount')}</option>
              <option value="priority">{t('upcoming.sort.priority')}</option>
            </select>
          </label>
        </div>
      </section>

      <PaymentTimeline
        payments={scopedPayments}
        today={todaysDate}
        days={14}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <section className="rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-start gap-2 text-sm font-semibold text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            {t('upcoming.warning')}
          </p>
          <div className="flex items-center gap-2">
            <span className="num chip border border-warn/25 bg-surface/70 text-warn">
              {t('cashflow.lowestBalance')}: {formatCurrencyINR(metrics.lowestBalance)} ·{' '}
              {formatDateShort(metrics.lowestBalanceDate)}
            </span>
            <Tooltip label={t('upcoming.balanceTooltip')} triggerLabel={t('upcoming.balanceNote')} />
          </div>
        </div>
      </section>

      <div id="upcoming-panel" role="tabpanel" aria-labelledby={`upcoming-tab-${tab}`}>
        {visible.length === 0 ? (
          <div className="card">
            <EmptyState title={t('upcoming.empty')} description={t('upcoming.emptyHint')} />
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((payment) => (
              <li key={payment.id}>
                <PaymentCard
                  payment={payment}
                  today={todaysDate}
                  variant="tile"
                  className="h-full"
                  onViewDetails={(id) => openModal('detail', id)}
                  onSimulatePause={(id) => openModal('pause', id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
    </div>
  );
}

function compareBy(sortKey: SortKey) {
  return (a: Payment, b: Payment) => {
    if (sortKey === 'amount') return b.amount - a.amount;
    if (sortKey === 'priority') {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.amount - b.amount;
    }
    return a.dueDate.localeCompare(b.dueDate);
  };
}
