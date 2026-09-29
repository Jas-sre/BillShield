import { ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { MerchantIcon } from '../common/MerchantIcon';
import { Modal } from '../common/Modal';
import type { TranslationKey } from '../../data/translations';

const STEPS: TranslationKey[] = [
  'modal.manage.step1',
  'modal.manage.step2',
  'modal.manage.step3',
  'modal.manage.step4',
];

/**
 * Explains how a real mandate change happens in the UPI app or bank.
 * Nothing is actually opened, paused, modified or revoked by this demo.
 */
export function ManageMandateModal() {
  const { modal, closeModal, getPayment, pushToast } = useBillShield();
  const { t } = useTranslation();

  const payment = modal.paymentId ? getPayment(modal.paymentId) : undefined;
  const open = modal.kind === 'manage' && Boolean(payment);

  return (
    <Modal
      open={open}
      onClose={closeModal}
      size="md"
      title={t('modal.manage.title')}
      description={payment ? payment.merchant : undefined}
      icon={<ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-relaxed text-ink-muted">{t('modal.manage.redirectNote')}</p>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                pushToast({
                  title: t('toast.simulatedOnly'),
                  description: t('modal.manage.redirectNote'),
                  tone: 'info',
                })
              }
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t('modal.manage.cta')}
            </button>
            <button type="button" className="btn btn-primary" onClick={closeModal}>
              {t('common.gotIt')}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3">
          {payment ? <MerchantIcon name={payment.icon} color={payment.color} size="md" /> : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{payment?.merchant}</p>
            <p className="text-xs text-ink-muted">{payment?.frequency}</p>
          </div>
          <span className="chip ml-auto border border-warn/30 bg-warn-soft text-warn">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            {t('modal.manage.demoBadge')}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-ink-muted">{t('modal.manage.body')}</p>

        <ol className="space-y-2">
          {STEPS.map((stepKey, index) => (
            <li key={stepKey} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-ink">{t(stepKey)}</span>
            </li>
          ))}
        </ol>

        <DisclaimerBanner />
      </div>
    </Modal>
  );
}

export default ManageMandateModal;
