import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { useTranslation } from '../../hooks/useTranslation';
import { DisclaimerBanner } from './DisclaimerBanner';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'primary' | 'danger';
  showDisclaimer?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'primary',
  showDisclaimer = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title ?? t('modal.confirm.defaultTitle')}
      icon={<AlertTriangle className="h-5 w-5 text-warn" aria-hidden="true" />}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.reset')}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="text-sm leading-relaxed text-ink-muted">{body ?? t('modal.confirm.defaultBody')}</div>
        {showDisclaimer ? <DisclaimerBanner /> : null}
      </div>
    </Modal>
  );
}
