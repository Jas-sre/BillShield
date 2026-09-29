import { BellRing, CalendarClock, CircleHelp, CirclePause, Repeat2, ShieldCheck, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import type { Priority } from '../../types';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { calculateCashFlowForecast } from '../../utils/forecast';
import { formatCurrencyINR } from '../../utils/currency';
import { addMonths, buildFutureOccurrences, formatDateMedium, formatDateShort, formatRelativeDays } from '../../utils/dates';
import { CategoryBadge } from '../common/CategoryBadge';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { MerchantIcon } from '../common/MerchantIcon';
import { Modal } from '../common/Modal';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';

const PRIORITIES: Priority[] = ['Essential', 'Important', 'Optional'];

export function PaymentDetailModal() {
  const {
    state,
    modal,
    closeModal,
    openModal,
    toggleReminder,
    setPriority,
    scenario,
    todaysDate,
    todaysDate: today,
    getPayment,
  } = useBillShield();
  const { t } = useTranslation();

  const payment = modal.paymentId ? getPayment(modal.paymentId) : undefined;
  const open = modal.kind === 'detail' && Boolean(payment);

  const { activeForecast, pausedForecast } = useMemo(() => {
    const base = {
      startDate: todaysDate,
      days: 30,
      startingBalance: state.user.currentBalance,
      incomeEvents: [state.user.nextIncome],
      comfortBuffer: state.user.comfortBuffer,
      scenarioOverrides: scenario.overrides,
    };

    if (!payment) {
      const empty = calculateCashFlowForecast(base);
      return { activeForecast: empty, pausedForecast: empty };
    }

    return {
      activeForecast: calculateCashFlowForecast({
        ...base,
        payments: state.payments.map((item) =>
          item.id === payment.id ? { ...item, status: 'Active' as const } : item,
        ),
      }),
      pausedForecast: calculateCashFlowForecast({
        ...base,
        payments: state.payments.map((item) =>
          item.id === payment.id ? { ...item, status: 'Paused in plan' as const } : item,
        ),
      }),
    };
  }, [payment, state.payments, state.user, scenario.overrides, todaysDate]);

  if (!payment) {
    return <Modal open={false} onClose={closeModal} title={t('modal.detail.title')}>{null}</Modal>;
  }

  const balanceOn = (forecast: typeof activeForecast) => {
    const day = forecast.forecast.find((entry) => entry.date === payment.dueDate);
    return day ? { amount: day.closingBalance, date: day.date } : null;
  };

  const activeImpact = balanceOn(activeForecast);
  const pausedImpact = balanceOn(pausedForecast);
  const lastPaymentDate = addMonths(payment.dueDate, -1);
  const nextDebits = buildFutureOccurrences(payment.dueDate, 3, payment.frequency);

  return (
    <Modal
      open={open}
      onClose={closeModal}
      size="lg"
      title={payment.merchant}
      description={payment.description}
      icon={<MerchantIcon name={payment.icon} color={payment.color} size="lg" />}
      footer={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {payment.status === 'Active' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal('pause', payment.id)}>
                <CirclePause className="h-3.5 w-3.5" aria-hidden="true" />
                {t('modal.pause.confirm')}
              </button>
            ) : null}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleReminder(payment.id)}>
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              {payment.reminderEnabled ? t('toast.reminderAdded') : t('modal.detail.setReminder')}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => openModal('manage', payment.id)}>
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('modal.manage.cta')}
            </button>
          </div>
          <DisclaimerBanner />
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3.5">
          <div>
            <p className="label">{t('common.amount')}</p>
            <p className="num text-2xl font-bold tracking-tight text-ink">{formatCurrencyINR(payment.amount)}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {t('common.dueDate')}: {formatDateMedium(payment.dueDate)} ({formatRelativeDays(payment.dueDate, today)})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={payment.category} />
            <PriorityBadge priority={payment.priority} />
            <StatusBadge variant={payment.status} />
            {payment.hiddenFromDashboard ? <StatusBadge variant="Hidden from dashboard" /> : null}
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Fact label={t('common.frequency')} value={payment.frequency} icon={Repeat2} />
          <Fact label={t('common.lastReviewed')} value={formatDateMedium(payment.lastReviewed)} icon={CalendarClock} />
          <Fact label={t('modal.detail.lastPayment')} value={formatDateMedium(lastPaymentDate)} icon={Wallet} />
          <Fact label={t('mandates.nextDebit')} value={formatDateMedium(payment.dueDate)} icon={CalendarClock} />
        </dl>

        <section aria-labelledby="detail-next-debits" className="space-y-2">
          <h3 id="detail-next-debits" className="text-sm font-semibold text-ink">
            {t('modal.detail.nextDebits')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {nextDebits.map((date, index) => (
              <li
                key={date}
                className="num rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted"
              >
                {formatDateShort(date)}
                {index === 0 ? <span className="ml-1 text-primary-dark">•</span> : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-soft">{t('upcoming.balanceTooltip')}</p>
        </section>

        <section className="rounded-2xl border border-primary/15 bg-primary-soft/60 px-4 py-3.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            {t('modal.detail.why')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t('modal.detail.whyBody')}</p>
        </section>

        <section aria-labelledby="detail-plan-impact" className="space-y-2">
          <h3 id="detail-plan-impact" className="text-sm font-semibold text-ink">
            {t('modal.detail.planImpact')}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <ImpactTile
              title={t('status.active')}
              text={
                activeImpact
                  ? t('modal.detail.activeImpact', {
                      amount: formatCurrencyINR(activeImpact.amount),
                      date: formatDateShort(activeImpact.date),
                    })
                  : t('upcoming.noPaymentsOnDay')
              }
              tone="active"
            />
            <ImpactTile
              title={t('status.pausedInPlan')}
              text={
                pausedImpact
                  ? t('modal.detail.pausedImpact', {
                      amount: formatCurrencyINR(pausedImpact.amount),
                      date: formatDateShort(pausedImpact.date),
                    })
                  : t('upcoming.noPaymentsOnDay')
              }
              tone="paused"
            />
          </div>
        </section>

        <section aria-labelledby="detail-priority" className="space-y-2">
          <h3 id="detail-priority" className="text-sm font-semibold text-ink">
            {t('modal.detail.markPriority')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                aria-pressed={payment.priority === priority}
                onClick={() => setPriority(payment.id, priority)}
                className={
                  payment.priority === priority
                    ? 'btn btn-primary btn-sm'
                    : 'btn btn-outline btn-sm'
                }
              >
                <PriorityBadge priority={priority} className="bg-transparent px-0 py-0" />
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-soft">{t('cashflow.prioritiseNote')}</p>
        </section>

        {payment.reminderEnabled ? (
          <p className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft px-3 py-2 text-xs font-semibold text-success">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            {t('modal.detail.reminderSet')}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
      <div>
        <dt className="label">{label}</dt>
        <dd className="text-sm font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}

function ImpactTile({ title, text, tone }: { title: string; text: string; tone: 'active' | 'paused' }) {
  return (
    <div
      className={
        tone === 'active'
          ? 'rounded-2xl border border-line bg-surface px-3.5 py-3'
          : 'rounded-2xl border border-accent/20 bg-accent-soft/60 px-3.5 py-3'
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{text}</p>
    </div>
  );
}

export default PaymentDetailModal;
