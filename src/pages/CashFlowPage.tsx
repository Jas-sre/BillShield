import { motion } from 'framer-motion';
import { Check, LineChart, Lightbulb, Pencil, RotateCcw, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { PageHeader } from '../components/layout/PageHeader';
import { ScenarioCard } from '../components/insights/ScenarioCard';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import { cx } from '../utils/cx';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateMedium, formatDateShort } from '../utils/dates';
import { FORECAST_DAYS_LONG, calculateCashFlowForecast } from '../utils/forecast';

interface Draft {
  balance: string;
  income: string;
  incomeDate: string;
  buffer: string;
}

export default function CashFlowPage() {
  const {
    state,
    todaysDate,
    metrics,
    thirtyDayForecast,
    scenarios,
    scenario,
    setScenario,
    updateBalance,
    updateIncome,
    updateComfortBuffer,
    setPriority,
    recommendedPlan,
    openModal,
  } = useBillShield();
  const { t } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    balance: String(state.user.currentBalance),
    income: String(state.user.nextIncome.amount),
    incomeDate: state.user.nextIncome.date,
    buffer: String(state.user.comfortBuffer),
  });

  // Each card projects its own scenario from the base plan — deliberately NOT
  // through previewForecast(), which layers a change on top of the currently
  // selected scenario and would make the four cards indistinguishable.
  const scenarioForecasts = useMemo(
    () =>
      scenarios.map((item) => ({
        scenario: item,
        forecast: calculateCashFlowForecast({
          startDate: todaysDate,
          days: FORECAST_DAYS_LONG,
          startingBalance: state.user.currentBalance,
          incomeEvents: [state.user.nextIncome],
          payments: state.payments,
          comfortBuffer: state.user.comfortBuffer,
          scenarioOverrides: item.overrides,
        }),
      })),
    [scenarios, state.user, state.payments, todaysDate],
  );

  const activePayments = state.payments.filter((payment) => payment.status === 'Active');

  const startEditing = () => {
    setDraft({
      balance: String(state.user.currentBalance),
      income: String(state.user.nextIncome.amount),
      incomeDate: state.user.nextIncome.date,
      buffer: String(state.user.comfortBuffer),
    });
    setEditing(true);
  };

  const save = () => {
    const balance = Number.parseFloat(draft.balance);
    const income = Number.parseFloat(draft.income);
    const buffer = Number.parseFloat(draft.buffer);

    if (Number.isFinite(balance)) updateBalance(Math.max(0, Math.round(balance)));
    if (Number.isFinite(income)) updateIncome({ amount: Math.max(0, Math.round(income)) });
    if (draft.incomeDate) updateIncome({ date: draft.incomeDate });
    if (Number.isFinite(buffer)) updateComfortBuffer(Math.max(0, Math.round(buffer)));
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('cashflow.title')}
        subtitle={t('cashflow.subtitle')}
        eyebrow={t('common.demoData')}
        actions={
          editing ? (
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t('cashflow.cancelEdits')}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                {t('cashflow.saveEdits')}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {t('cashflow.editControls')}
            </button>
          )
        }
      />

      <section className="card card-pad" aria-labelledby="cashflow-controls-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="cashflow-controls-title" className="section-title">
            {t('cashflow.editControls')}
          </h2>
          <p className="text-xs text-ink-muted">{t('cashflow.editNote')}</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ControlField
            label={t('cashflow.currentBalance')}
            editing={editing}
            value={formatCurrencyINR(state.user.currentBalance)}
            input={
              <input
                type="number"
                min={0}
                step={100}
                value={draft.balance}
                onChange={(event) => setDraft((previous) => ({ ...previous, balance: event.target.value }))}
                className="input num"
                aria-label={t('cashflow.currentBalance')}
              />
            }
          />
          <ControlField
            label={t('cashflow.nextIncome')}
            editing={editing}
            value={formatCurrencyINR(state.user.nextIncome.amount)}
            input={
              <input
                type="number"
                min={0}
                step={500}
                value={draft.income}
                onChange={(event) => setDraft((previous) => ({ ...previous, income: event.target.value }))}
                className="input num"
                aria-label={t('cashflow.nextIncome')}
              />
            }
          />
          <ControlField
            label={t('cashflow.incomeDate')}
            editing={editing}
            value={formatDateMedium(state.user.nextIncome.date)}
            input={
              <input
                type="date"
                value={draft.incomeDate}
                onChange={(event) => setDraft((previous) => ({ ...previous, incomeDate: event.target.value }))}
                className="input num"
                aria-label={t('cashflow.incomeDate')}
              />
            }
          />
          <ControlField
            label={t('cashflow.comfortBuffer')}
            editing={editing}
            value={formatCurrencyINR(state.user.comfortBuffer)}
            input={
              <input
                type="number"
                min={0}
                step={100}
                value={draft.buffer}
                onChange={(event) => setDraft((previous) => ({ ...previous, buffer: event.target.value }))}
                className="input num"
                aria-label={t('cashflow.comfortBuffer')}
              />
            }
          />
        </div>
        <p className="mt-3 text-xs text-ink-muted">{state.user.nextIncome.label}</p>
      </section>

      <section className="card card-pad" aria-labelledby="cashflow-chart-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="cashflow-chart-title" className="section-title flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('cashflow.chartTitle')}
            </h2>
            <p className="muted mt-1">{t('cashflow.chartNote')}</p>
          </div>
          <span className="chip border border-line bg-surface text-ink-muted">
            {formatDateShort(thirtyDayForecast.startDate)} –{' '}
            {formatDateShort(thirtyDayForecast.forecast[thirtyDayForecast.forecast.length - 1].date)}
          </span>
        </div>

        <div className="mt-3">
          <CashFlowChart forecast={thirtyDayForecast} height={340} />
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label={t('cashflow.lowestBalance')}
            value={formatCurrencyINR(metrics.lowestBalance)}
            hint={formatDateMedium(metrics.lowestBalanceDate)}
            tone={metrics.lowestBalance < state.user.comfortBuffer ? 'warn' : 'good'}
          />
          <Stat
            label={t('cashflow.daysBelowBuffer')}
            value={String(metrics.daysBelowBuffer)}
            hint={formatCurrencyINR(state.user.comfortBuffer)}
            tone={metrics.daysBelowBuffer > 0 ? 'warn' : 'good'}
          />
          <Stat label={t('cashflow.endingBalance')} value={formatCurrencyINR(metrics.endingBalance)} hint={t('cashflow.totalInflow') + ': ' + formatCurrencyINR(thirtyDayForecast.totalInflow)} />
          <Stat
            label={t('cashflow.safeToSpend')}
            value={formatCurrencyINR(metrics.safeToSpend)}
            hint={t('cashflow.safeToSpendNote')}
          />
        </dl>
      </section>

      <section className="space-y-3" aria-labelledby="scenarios-title">
        <div>
          <h2 id="scenarios-title" className="section-title">
            {t('cashflow.scenariosTitle')}
          </h2>
          <p className="muted mt-1">{t('cashflow.scenariosNote')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scenarioForecasts.map(({ scenario: item, forecast }) => (
            <ScenarioCard
              key={item.id}
              scenario={item}
              forecast={forecast}
              selected={scenario.id === item.id}
              onSelect={setScenario}
            />
          ))}
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="recommended-plan-title">
        <h2 id="recommended-plan-title" className="section-title flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warn" aria-hidden="true" />
          {t('cashflow.recommendedTitle')}
        </h2>
        <motion.p
          key={recommendedPlan}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="mt-2 rounded-2xl border border-primary/15 bg-primary-soft/50 px-4 py-3.5 text-sm font-medium leading-relaxed text-ink"
        >
          {recommendedPlan}
        </motion.p>
        <p className="mt-2 text-xs text-ink-muted">{t('cashflow.recommendedNote')}</p>
      </section>

      <section className="card card-pad" aria-labelledby="prioritise-title">
        <h2 id="prioritise-title" className="section-title">
          {t('cashflow.prioritiseTitle')}
        </h2>
        <p className="muted mt-1">{t('cashflow.prioritiseNote')}</p>

        <ul className="mt-3 divide-y divide-line">
          {activePayments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{payment.merchant}</p>
                <p className="num text-xs text-ink-muted">
                  {formatCurrencyINR(payment.amount)} · {formatDateShort(payment.dueDate)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['Essential', 'Important', 'Optional'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    aria-pressed={payment.priority === priority}
                    onClick={() => setPriority(payment.id, priority)}
                    className={cx(
                      'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      payment.priority === priority
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-surface text-ink-muted hover:text-ink',
                    )}
                  >
                    {payment.priority === priority ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                    {t(
                      priority === 'Essential'
                        ? 'priority.essential'
                        : priority === 'Important'
                          ? 'priority.important'
                          : 'priority.optional',
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openModal('detail', payment.id)}
                >
                  {t('common.viewDetails')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card card-pad space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('cashflow.scenariosTitle')}
        </h2>
        <p className="muted">{t('cashflow.scenariosNote')}</p>
        <DisclaimerBanner />
      </section>

      <p className="text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
    </div>
  );
}

function ControlField({
  label,
  value,
  input,
  editing,
}: {
  label: string;
  value: string;
  input: React.ReactNode;
  editing: boolean;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      {editing ? (
        <div className="mt-1.5">{input}</div>
      ) : (
        <p className="num mt-1 text-lg font-bold tracking-tight text-ink">{value}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'warn' | 'good';
}) {
  return (
    <div className="surface-inset px-3.5 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd
        className={cx(
          'num mt-1 text-lg font-bold tracking-tight',
          tone === 'warn' && 'text-warn',
          tone === 'good' && 'text-success',
          tone === 'neutral' && 'text-ink',
        )}
      >
        {value}
      </dd>
      {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{hint}</p> : null}
    </div>
  );
}
