import { CirclePause, CirclePlay, PiggyBank, Repeat, SearchX, Flag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { SearchInput } from '../components/common/SearchInput';
import { PageHeader } from '../components/layout/PageHeader';
import { MandateCard } from '../components/mandates/MandateCard';
import { MandateTable } from '../components/mandates/MandateTable';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useBillShield } from '../hooks/useBillShield';
import { useMandateActions } from '../hooks/useMandateActions';
import { useTranslation } from '../hooks/useTranslation';
import type { Payment } from '../types';
import { cx } from '../utils/cx';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateShort, parseISODate } from '../utils/dates';
import { FORECAST_DAYS_LONG, calculateCashFlowForecast } from '../utils/forecast';

type Tab = 'all' | 'essential' | 'subscriptions' | 'review' | 'paused';

export default function MandatesPage() {
  const { state, todaysDate, metrics, visibleMonth, scenario, resumeMany } = useBillShield();
  const { t } = useTranslation();
  const handleAction = useMandateActions();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');

  const tabs: Array<{ key: Tab; labelKey: Parameters<typeof t>[0]; count: number }> = useMemo(() => {
    const payments = state.payments;
    return [
      { key: 'all', labelKey: 'mandates.tab.all', count: payments.length },
      {
        key: 'essential',
        labelKey: 'mandates.tab.essential',
        count: payments.filter((payment) => payment.priority === 'Essential').length,
      },
      {
        key: 'subscriptions',
        labelKey: 'mandates.tab.subscriptions',
        count: payments.filter((payment) => payment.category === 'Subscriptions').length,
      },
      {
        key: 'review',
        labelKey: 'mandates.tab.review',
        count: payments.filter(
          (payment) => payment.status === 'Active' && (payment.reviewRecommended || payment.priority !== 'Essential'),
        ).length,
      },
      {
        key: 'paused',
        labelKey: 'mandates.tab.paused',
        count: payments.filter((payment) => payment.status === 'Paused in plan').length,
      },
    ];
  }, [state.payments]);

  /**
   * Visible effect of the plan changes: the same projection with every mandate
   * forced active, so pausing or resuming a mandate shows a measured before/after
   * instead of an invisible state flip.
   */
  const planImpact = useMemo(() => {
    const allActive = calculateCashFlowForecast({
      startDate: todaysDate,
      days: FORECAST_DAYS_LONG,
      startingBalance: state.user.currentBalance,
      incomeEvents: [state.user.nextIncome],
      payments: state.payments.map((payment) =>
        payment.status === 'Paused in plan' ? { ...payment, status: 'Active' as const } : payment,
      ),
      comfortBuffer: state.user.comfortBuffer,
      scenarioOverrides: scenario.overrides,
    });

    const pausedIds = state.payments
      .filter((payment) => payment.status === 'Paused in plan')
      .map((payment) => payment.id);

    return { baseline: allActive, pausedIds, count: pausedIds.length };
  }, [state.payments, state.user, todaysDate, scenario]);

  const impactDelta = useMemo(() => {
    const delta = metrics.lowestBalance - planImpact.baseline.lowestBalance;
    if (delta === 0) return t('mandates.impactEqual');
    const amount = formatCurrencyINR(Math.abs(delta));
    return delta > 0
      ? t('mandates.impactHigher', { amount })
      : t('mandates.impactLower', { amount });
  }, [metrics.lowestBalance, planImpact.baseline.lowestBalance, t]);

  const visible = useMemo(() => {
    const normalised = query.trim().toLowerCase();

    const scoped = state.payments.filter((payment) => {
      switch (tab) {
        case 'essential':
          return payment.priority === 'Essential';
        case 'subscriptions':
          return payment.category === 'Subscriptions';
        case 'review':
          return payment.status === 'Active' && (payment.reviewRecommended || payment.priority !== 'Essential');
        case 'paused':
          return payment.status === 'Paused in plan';
        default:
          return true;
      }
    });

    return scoped
      .filter(
        (payment) =>
          normalised.length === 0 ||
          payment.merchant.toLowerCase().includes(normalised) ||
          payment.description.toLowerCase().includes(normalised) ||
          payment.shortName.toLowerCase().includes(normalised) ||
          payment.category.toLowerCase().includes(normalised),
      )
      .sort(compareMandates);
  }, [state.payments, tab, query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('mandates.title')}
        subtitle={t('mandates.subtitle')}
        eyebrow={t('common.demoData')}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('mandates.summary.active')}
          value={metrics.activeMandateCount}
          hint={`${t('status.pausedInPlan')}: ${metrics.pausedInPlanCount}`}
          icon={Repeat}
          tone="primary"
        />
        <MetricCard
          label={t('mandates.summary.scheduled')}
          value={formatCurrencyINR(metrics.scheduledThisMonth)}
          hint={`${visibleMonth.label} · ${metrics.scheduledThisMonthCount} ${t('nav.mandates').toLowerCase()}`}
          icon={CirclePause}
          tone="accent"
        />
        <MetricCard
          label={t('mandates.summary.optional')}
          value={formatCurrencyINR(metrics.optionalSpend)}
          hint={t('upcoming.tab.month')}
          icon={PiggyBank}
          tone="warn"
        />
        <MetricCard
          label={t('mandates.summary.review')}
          value={metrics.needsReviewCount}
          hint={t('dash.reviewFlags', { count: metrics.needsReviewCount })}
          icon={Flag}
          tone="neutral"
        />
      </section>

      <section className="card card-pad space-y-3" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">{t('mandates.impactTitle')}</h2>
            <p className="muted mt-1 leading-relaxed">
              {planImpact.count === 0
                ? t('mandates.impactNone', {
                    amount: formatCurrencyINR(metrics.lowestBalance),
                    date: formatDateShort(metrics.lowestBalanceDate),
                  })
                : t('mandates.impactSome', {
                    count: planImpact.count,
                    amount: formatCurrencyINR(metrics.lowestBalance),
                    date: formatDateShort(metrics.lowestBalanceDate),
                    baseline: `${formatCurrencyINR(planImpact.baseline.lowestBalance)} · ${formatDateShort(
                      planImpact.baseline.lowestBalanceDate,
                    )}`,
                    delta: impactDelta,
                  })}
            </p>
          </div>
          {planImpact.count > 0 ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => resumeMany(planImpact.pausedIds)}
            >
              <CirclePlay className="h-3.5 w-3.5" aria-hidden="true" />
              {t('mandates.resumeAll')}
            </button>
          ) : null}
        </div>
        {planImpact.count > 0 ? (
          <p className="text-xs leading-relaxed text-ink-muted">{t('mandates.resumeAllNote')}</p>
        ) : null}
      </section>

      <section className="card card-pad space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label={t('mandates.title')} className="flex flex-wrap gap-1 rounded-2xl border border-line bg-canvas/70 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                aria-controls="mandates-panel"
                onClick={() => setTab(item.key)}
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
          <SearchInput
            className="sm:ml-auto sm:w-72"
            value={query}
            onChange={setQuery}
            placeholder={t('mandates.searchPlaceholder')}
            label={t('common.search')}
          />
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">{t('mandates.hideNote')}</p>
      </section>

      <div id="mandates-panel" role="tabpanel">
        {visible.length === 0 ? (
          <div className="card">
            <EmptyState icon={SearchX} title={t('mandates.empty')} description={t('upcoming.emptyHint')} />
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <MandateTable payments={visible} onAction={handleAction} />
            </div>
            <ul className="grid gap-4 lg:hidden">
              {visible.map((payment) => (
                <li key={payment.id}>
                  <MandateCard payment={payment} today={todaysDate} onAction={handleAction} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="card card-pad">
        <h2 className="section-title">{t('cashflow.prioritiseTitle')}</h2>
        <p className="muted mt-1">{t('cashflow.prioritiseNote')}</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {visible.slice(0, 6).map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/50 px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{payment.merchant}</p>
                <p className="num text-xs text-ink-muted">{formatCurrencyINR(payment.amount)}</p>
              </div>
              <div className="flex gap-1.5">
                {(['Essential', 'Important', 'Optional'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    aria-pressed={payment.priority === priority}
                    onClick={() => handleAction(priority.toLowerCase() as 'essential' | 'important' | 'optional', payment)}
                    className={cx(
                      'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      payment.priority === priority
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-surface text-ink-muted hover:text-ink',
                    )}
                  >
                    {t(priority === 'Essential' ? 'priority.essential' : priority === 'Important' ? 'priority.important' : 'priority.optional')}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
    </div>
  );
}

function compareMandates(a: Payment, b: Payment) {
  const pausedDiff = Number(a.status === 'Paused in plan') - Number(b.status === 'Paused in plan');
  if (pausedDiff !== 0) return pausedDiff;
  return parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime();
}
