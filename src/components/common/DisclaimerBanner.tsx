import { Info } from 'lucide-react';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';

export interface DisclaimerBannerProps {
  variant?: 'inline' | 'bar';
  className?: string;
  text?: string;
}

/**
 * The required demo/legal disclaimer. It is rendered in the dashboard footer,
 * the settings page and inside payment/mandate action modals.
 */
export function DisclaimerBanner({ variant = 'inline', className, text }: DisclaimerBannerProps) {
  const { t } = useTranslation();
  const message = text ?? t('disclaimer.long');

  if (variant === 'bar') {
    return (
      <div className={cx('no-print border-t border-line/80 bg-surface/70 px-4 py-3', className)}>
        <p className="mx-auto flex max-w-6xl items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span>{message}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cx(
        'flex items-start gap-2 rounded-2xl border border-line bg-canvas/70 px-3.5 py-3 text-xs leading-relaxed text-ink-muted',
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
