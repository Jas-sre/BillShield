import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';
import { ConfirmDialog } from './ConfirmDialog';

export interface StartOverButtonProps {
  className?: string;
  /** Icon-only presentation for tight toolbars. */
  compact?: boolean;
}

/**
 * Restores the seed demo data AND shows the welcome/consent screen again.
 *
 * Demo state is persisted in localStorage on purpose, so a plain reload keeps
 * whatever the presenter left behind. This is the labelled, one-click way back
 * to the original plan without editing browser storage by hand.
 */
export function StartOverButton({ className, compact = false }: StartOverButtonProps) {
  const { resetAll } = useBillShield();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = t('demo.startOver');

  return (
    <>
      <button
        type="button"
        className={cx(compact ? 'icon-btn border border-line bg-surface' : 'btn btn-outline btn-sm', className)}
        onClick={() => setOpen(true)}
        aria-label={label}
        title={compact ? label : undefined}
      >
        <RotateCcw className={compact ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
        {compact ? null : label}
      </button>

      <ConfirmDialog
        open={open}
        tone="danger"
        title={t('demo.startOverConfirmTitle')}
        body={t('demo.startOverConfirmBody')}
        confirmLabel={label}
        cancelLabel={t('common.cancel')}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          // includeOnboarding: true — resets the plan and takes the user back to
          // the welcome screen with the demo-consent checkbox unchecked.
          resetAll(true);
          setOpen(false);
        }}
      />
    </>
  );
}

export default StartOverButton;
