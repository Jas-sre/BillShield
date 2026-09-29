import { CirclePause, CirclePlay, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateShort } from '../../utils/dates';
import { FORECAST_DAYS_LONG, calculateCashFlowForecast } from '../../utils/forecast';
import { DEMO_TODAY } from '../../data/mockData';
import { cx } from '../../utils/cx';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { MerchantIcon } from '../common/MerchantIcon';
import { Modal } from '../common/Modal';

/**
 * "Simulate pause in plan" — the language here is deliberate: this only changes
 * the BillShield plan and never claims to pause a real payment.
 */
export function SimulatePauseModal() {
  const {
    modal,
    closeModal,
    getPayment,
    pausePayment,
    resumePayment,
    previewForecast,
    metrics,
    state,
    scenario,
  } = useBillShield();
  const { t } = useTranslation();

  const payment = modal.paymentId ? getPayment(modal.paymentId) : undefined;
  const open = modal.kind === 'pause' && Boolean(payment);
  const isPaused = payment?.status === 'Paused in plan';

  /**
   * Preview both directions: pausing an active mandate, and putting a
   * paused-in-plan mandate back, so either action shows a measured before/after.
   */
  const preview = useMemo(() => {
    if (!payment) return null;
    if (payment.status === 'Paused in plan') {
      return calculateCashFlowForecast({
        startDate: DEMO_TODAY,
        days: FORECAST_DAYS_LONG,
        startingBalance: state.user.currentBalance,
        incomeEvents: [state.user.nextIncome],
        payments: state.payments.map((item) =>
          item.id === payment.id ? { ...item, status: 'Active' as const } : item,
        ),
        comfortBuffer: state.user.comfortBuffer,
        scenarioOverrides: scenario.overrides,
      });
    }
    return previewForecast({ pausePaymentIds: [payment.id] });
  }, [payment, previewForecast, state.user, state.payments, scenario]);

  if (!payment) {
    return (
      <Modal open={false} onClose={closeModal} title={t('modal.pause.title')}>
        {null}
      </Modal>
    );
  }

  const current = metrics.lowestBalance;
  const afterChange = preview?.lowestBalance ?? current;
  const improves = afterChange > current;
  const changes = afterChange !== current;
  const comfortBuffer = state.user.comfortBuffer;

  return (
    <Modal
      open={open}
      onClose={closeModal}
      size="sm"
      title={isPaused ? t('mandates.action.resume') : t('modal.pause.title')}
      icon={<MerchantIcon name={payment.icon} color={payment.color} size="md" />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={closeModal}>
            {isPaused ? t('common.cancel') : t('modal.pause.keep')}
          </button>
          <button
            type="button"
            className={isPaused ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={() => {
              if (isPaused) {
                resumePayment(payment.id);
              } else {
                pausePayment(payment.id);
              }
              closeModal();
            }}
          >
            {isPaused ? (
              <CirclePlay className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CirclePause className="h-4 w-4" aria-hidden="true" />
            )}
            {isPaused ? t('modal.resume.confirm') : t('modal.pause.confirm')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn-soft px-3.5 py-3 text-sm font-semibold leading-snug text-warn">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t('modal.pause.warning')}
        </p>

        <div className="rounded-2xl border border-line bg-canvas/60 px-4 py-3.5">
          <p className="text-xs text-ink-muted">
            {payment.merchant} · {formatCurrencyINR(payment.amount)} · {t('mandates.nextDebit')}{' '}
            {formatDateShort(payment.dueDate)}
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink">
            {isPaused
              ? t('modal.resume.impact', {
                  merchant: payment.merchant,
                  from: formatCurrencyINR(current),
                  to: formatCurrencyINR(afterChange),
                })
              : t('modal.pause.impact', {
                  merchant: payment.merchant,
                  from: formatCurrencyINR(current),
                  to: formatCurrencyINR(afterChange),
                })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cx(
                'chip border',
                improves
                  ? 'border-success/20 bg-success-soft text-success'
                  : 'border-danger/20 bg-danger-soft text-danger',
              )}
            >
              {improves ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {changes
                ? `${improves ? '+' : '-'}${formatCurrencyINR(Math.abs(afterChange - current))}`
                : t('toast.noChange')}
            </span>
            <span className="num text-ink-muted">
              {t('dash.comfortBuffer', { amount: formatCurrencyINR(comfortBuffer) })}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-ink-muted">{t('modal.manage.redirectNote')}</p>

        <DisclaimerBanner />
      </div>
    </Modal>
  );
}

export default SimulatePauseModal;
