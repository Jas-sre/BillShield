import { ShieldCheck } from 'lucide-react';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';

/** Small "Demo data" chip used in the header and on demo-only surfaces. */
export function DemoDataBadge({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cx(
        'chip border border-primary/20 bg-primary-soft text-primary-dark',
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? t('common.demoData')}
    </span>
  );
}
