import { ArrowRight, CalendarClock, Info, PiggyBank, Repeat, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { BalanceHeroCard } from '../components/dashboard/BalanceHeroCard';
import { EssentialProtection, type EssentialProtectionItem } from '../components/dashboard/EssentialProtection';
import { MetricCard } from '../components/dashboard/MetricCard';
import { MoneyAllocationBar } from '../components/dashboard/MoneyAllocationBar';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { EmptyState } from '../components/common/EmptyState';
import { InsightCard } from '../components/insights/InsightCard';
import { PaymentCard } from '../components/payments/PaymentCard';
import { Tooltip } from '../components/common/Tooltip';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import { useMandateActions } from '../hooks/useMandateActions';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateShort } from '../utils/dates';
import { getVisibleDashboardPayments } from '../utils/forecast';

export default function DashboardPage() {
  const {
    state,
    metrics,
    fourteenDayForecast,
    dashboardInsights,
    essentialsReadiness,
    todaysDate,
    openModal,
  } = useBillShield();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleMandateAction = useMandateActions();

  const nextPayments = getVisibleDashboardPayments(state.payments, todaysDate, 4);

  const essentialItems: EssentialProtectionItem[] = essentialsReadiness.items.flatMap((item) => {
    const payment = state.payments.find((candidate) => candidate.id === item.paymentId);
    if (!payment) return [];
    return [{ ...item, icon: payment.icon, color: payment.color }];
  });

  return (
    <div className="space-y-5">
      <BalanceHeroCard
        balance={state.user.currentBalance}
        dueNext7Days={metrics.dueNext7Days}
        essentialNext7Days={metrics.essentialNext7Days}
        lowestBalance={metrics.lowestBalance}
        lowestBalanceDate={metrics.lowestBalanceDate}
        comfortBuffer={state.user.comfortBuffer}
        daysBelowBuffer={metrics.daysBelowBuffer}
        hasShortfall={metrics.hasShortfall}
        planImprovement={metrics.planImprovement}
        onReviewPlan={() => navigate('/cash-flow')}
        onSimulatePause={(paymentId) => openModal('pause', paymentId)}
      />

      <MoneyAllocationBar
        balance={state.user.currentBalance}
        essential={metrics.essentialNext7Days}
        other={metrics.otherNext7Days}
        remaining={metrics.lowestBalance}
      />

      <section aria-label={t('dash.availableBalance')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('dash.upcoming7')}
          value={formatCurrencyINR(metrics.dueNext7Days)}
          hint={`${formatCurrencyINR(metrics.essentialNext7Days)} ${t('dash.legend.essential').toLowerCase()} · ${formatCurrencyINR(
            metrics.otherNext7Days,
          )} ${t('dash.legend.other').toLowerCase()}`}
          icon={CalendarClock}
          tone="primary"
          footer={
            <Link to="/upcoming" className="text-xs font-semibold text-primary-dark underline underline-offset-2">
              {t('dash.viewAllUpcoming')}
            </Link>
          }
        />
        <MetricCard
          label={t('dash.activeMandates')}
          value={metrics.activeMandateCount}
          hint={
            metrics.pausedInPlanCount > 0
              ? `${t('status.pausedInPlan')}: ${metrics.pausedInPlanCount} · ${t('dash.managesInPlan')}`
              : t('dash.managesInPlan')
          }
          icon={Repeat}
          tone="accent"
          footer={
            <Link to="/mandates" className="text-xs font-semibold text-primary-dark underline underline-offset-2">
              {t('nav.mandates')}
            </Link>
          }
        />
        <MetricCard
          label={t('dash.potentialSavings')}
          value={formatCurrencyINR(metrics.potentialSavings)}
          hint={t('dash.reviewFlags', { count: metrics.needsReviewCount })}
          icon={PiggyBank}
          tone="warn"
          footer={
            <Link to="/insights" className="text-xs font-semibold text-primary-dark underline underline-offset-2">
              {t('nav.insights')}
            </Link>
          }
        />
        <MetricCard
          label={t('dash.essentialsProtected')}
          value={`${metrics.essentialsProtectedCount}/${metrics.essentialsTotalCount}`}
          hint={`${formatCurrencyINR(metrics.essentialsWindowAmount)} ${t('dash.acrossWindow', {
            days: metrics.essentialsWindowDays,
          })}`}
          icon={ShieldCheck}
          tone="success"
          footer={
            <span className="text-xs text-ink-muted">
              {metrics.essentialsNeedingPlanningCount} {t('status.needsPlanning').toLowerCase()}
            </span>
          }
        />
      </section>

      <section className="card card-pad" aria-labelledby="next-payments-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="next-payments-title" className="section-title">
              {t('dash.nextPayments')}
            </h2>
            <p className="muted mt-1">{t('dash.nextPaymentsNote')}</p>
          </div>
          <Link to="/upcoming" className="btn btn-outline btn-sm">
            {t('dash.viewAllUpcoming')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {nextPayments.length === 0 ? (
          <EmptyState title={t('upcoming.empty')} description={t('upcoming.emptyHint')} />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {nextPayments.map((payment) => (
              <li key={payment.id}>
                <PaymentCard
                  payment={payment}
                  today={todaysDate}
                  variant="row"
                  onViewDetails={(id) => openModal('detail', id)}
                  onSimulatePause={(id) => openModal('pause', id)}
                />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-xs text-ink-muted">{t('disclaimer.short')}</p>
      </section>

      <section className="card card-pad" aria-labelledby="cashflow-chart-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 id="cashflow-chart-title" className="section-title">
              {t('dash.cashflowTitle')}
            </h2>
            <Tooltip label={t('upcoming.balanceTooltip')} triggerLabel={t('upcoming.balanceNote')} />
          </div>
          <Link to="/cash-flow" className="btn btn-outline btn-sm">
            {t('cashflow.title')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-2">
          <CashFlowChart forecast={fourteenDayForecast} height={300} />
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-warn/25 bg-warn-soft px-3.5 py-3 text-xs leading-relaxed text-ink">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden="true" />
          {t('alerts.lowBalanceOn', {
            buffer: formatCurrencyINR(state.user.comfortBuffer),
            date: formatDateShort(metrics.lowestBalanceDate),
          })}{' '}
          {t('alerts.reviewOptional')}
        </p>
      </section>

      <section aria-labelledby="dashboard-insights-title" className="space-y-3">
        <h2 id="dashboard-insights-title" className="section-title">
          {t('dash.insightsTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardInsights.map((insight) => (
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

      <div className="grid gap-4 lg:grid-cols-2">
        <EssentialProtection
          items={essentialItems}
          onViewDetails={(id) => handleMandateAction('view', state.payments.find((p) => p.id === id)!)}
        />
        <RecentActivity items={state.activity} />
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
    </div>
  );
}
