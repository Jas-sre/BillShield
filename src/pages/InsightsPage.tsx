import { PiggyBank, Sparkles, TrendingDown, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EssentialVsOptionalChart } from '../components/charts/EssentialVsOptionalChart';
import { SpendingDonutChart } from '../components/charts/SpendingDonutChart';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { MetricCard } from '../components/dashboard/MetricCard';
import { InsightCard } from '../components/insights/InsightCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import type { InsightSection, Payment } from '../types';
import type { TranslationKey } from '../data/translations';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateMedium } from '../utils/dates';
import { getPaymentsInVisibleMonth } from '../utils/forecast';
import { calculateCategoryTotals, calculatePriorityTotals } from '../utils/insights';

const SECTIONS: Array<{ id: InsightSection; titleKey: TranslationKey }> = [
  { id: 'savings', titleKey: 'insights.savings' },
  { id: 'hygiene', titleKey: 'insights.hygiene' },
  { id: 'essential', titleKey: 'insights.essentialReadiness' },
  { id: 'pressure', titleKey: 'insights.pressure' },
  { id: 'review', titleKey: 'insights.reviewReminders' },
];

export default function InsightsPage() {
  const {
    state,
    metrics,
    insights,
    thirtyDayForecast,
    todaysDate,
    setSavingsTarget,
    pauseMany,
  } = useBillShield();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [target, setTarget] = useState(state.savingsTarget);

  const activePayments = useMemo(
    () => state.payments.filter((payment) => payment.status === 'Active'),
    [state.payments],
  );
  const monthPayments = useMemo(
    () => getPaymentsInVisibleMonth(activePayments, todaysDate),
    [activePayments, todaysDate],
  );

  const categoryTotals = useMemo(() => calculateCategoryTotals(monthPayments), [monthPayments]);
  const priorityTotals = useMemo(() => calculatePriorityTotals(monthPayments), [monthPayments]);

  const activeOptional = useMemo(
    () =>
      activePayments
        .filter((payment) => payment.priority === 'Optional')
        .sort((a, b) => b.amount - a.amount),
    [activePayments],
  );

  const maxReduction = activeOptional.reduce((sum, payment) => sum + payment.amount, 0);

  const selection = useMemo(() => {
    const picked: Payment[] = [];
    let accumulated = 0;
    for (const payment of activeOptional) {
      if (accumulated + payment.amount <= target) {
        picked.push(payment);
        accumulated += payment.amount;
      }
    }
    return { picked, accumulated };
  }, [activeOptional, target]);

  const projectedEnding = thirtyDayForecast.endingBalance + selection.accumulated;

  const applySimulation = () => {
    setSavingsTarget(target);
    pauseMany(
      selection.picked.map((payment) => payment.id),
      'Savings simulation',
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('insights.title')} subtitle={t('insights.subtitle')} eyebrow={t('common.demoData')} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('dash.potentialSavings')}
          value={formatCurrencyINR(metrics.potentialSavings)}
          hint={t('dash.reviewFlags', { count: metrics.needsReviewCount })}
          icon={PiggyBank}
          tone="warn"
        />
        <MetricCard
          label={t('mandates.summary.optional')}
          value={formatCurrencyINR(metrics.optionalSpend)}
          hint={t('upcoming.tab.month')}
          icon={Sparkles}
          tone="accent"
        />
        <MetricCard
          label={t('cashflow.lowestBalance')}
          value={formatCurrencyINR(metrics.lowestBalance)}
          hint={formatDateMedium(metrics.lowestBalanceDate)}
          icon={TrendingDown}
          tone={metrics.lowestBalance < state.user.comfortBuffer ? 'warn' : 'success'}
        />
        <MetricCard
          label={t('cashflow.daysBelowBuffer')}
          value={String(metrics.daysBelowBuffer)}
          hint={t('dash.comfortBuffer', { amount: formatCurrencyINR(state.user.comfortBuffer) })}
          icon={TriangleAlert}
          tone={metrics.daysBelowBuffer > 0 ? 'warn' : 'success'}
        />
      </section>

      <section className="card card-pad" aria-labelledby="simulator-title">
        <h2 id="simulator-title" className="section-title">
          {t('insights.simulatorTitle')}
        </h2>
        <p className="muted mt-1">{t('insights.simulatorMax')}</p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <label htmlFor="savings-slider" className="label">
              {t('common.amount')}
            </label>
            <input
              id="savings-slider"
              type="range"
              min={0}
              max={Math.max(maxReduction, 100)}
              step={50}
              value={target}
              onChange={(event) => setTarget(Number(event.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
              <span className="num font-semibold text-ink">₹0</span>
              <span className="num font-semibold text-ink">{formatCurrencyINR(maxReduction)}</span>
            </div>

            <p className="mt-4 rounded-2xl border border-primary/15 bg-primary-soft/50 px-4 py-3.5 text-sm font-medium leading-relaxed text-ink">
              {t('insights.simulatorBody', {
                amount: formatCurrencyINR(target),
                ending: formatCurrencyINR(projectedEnding),
              })}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              {selection.picked.length > 0
                ? t('insights.simulatorWillPause', {
                    merchants: selection.picked.map((payment) => payment.merchant).join(', '),
                  })
                : t('insights.simulatorNoSelection')}{' '}
              {selection.accumulated > 0 ? `(${formatCurrencyINR(selection.accumulated)})` : ''}
            </p>
          </div>

          <div className="space-y-3">
            <ul className="divide-y divide-line">
              {activeOptional.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{payment.merchant}</p>
                    <p className="text-[11px] text-ink-muted">
                      {payment.category} · {payment.frequency}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold text-ink">{formatCurrencyINR(payment.amount)}</span>
                </li>
              ))}
              {activeOptional.length === 0 ? (
                <li className="py-3 text-sm text-ink-muted">{t('insights.simulatorNoSelection')}</li>
              ) : null}
            </ul>

            <button type="button" className="btn btn-primary w-full" onClick={applySimulation} disabled={selection.picked.length === 0}>
              {t('insights.simulatorApply')}
            </button>
            <p className="text-xs leading-relaxed text-ink-muted">{t('insights.simulatorNote')}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-pad" aria-labelledby="category-chart-title">
          <h2 id="category-chart-title" className="section-title">
            {t('insights.byCategory')}
          </h2>
          <p className="muted mt-1">{t('insights.subtitle')}</p>
          <SpendingDonutChart totals={categoryTotals} />
        </section>

        <section className="card card-pad" aria-labelledby="priority-chart-title">
          <h2 id="priority-chart-title" className="section-title">
            {t('insights.essentialVsOptional')}
          </h2>
          <p className="muted mt-1">{t('upcoming.tab.month')}</p>
          <EssentialVsOptionalChart totals={priorityTotals} />
        </section>
      </div>

      {SECTIONS.map((section) => {
        const sectionInsights = insights.filter((insight) => insight.section === section.id);
        if (sectionInsights.length === 0) return null;

        return (
          <section key={section.id} className="space-y-3" aria-labelledby={`section-${section.id}`}>
            <h2 id={`section-${section.id}`} className="section-title">
              {t(section.titleKey)}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sectionInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={(selected) => {
                    if (selected.actionTo) navigate(selected.actionTo);
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      <DisclaimerBanner />
      <p className="text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
    </div>
  );
}
