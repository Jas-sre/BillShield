import { CircleDashed, ShieldCheck, Star } from 'lucide-react';
import type { Priority } from '../../types';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';

const STYLES: Record<Priority, { className: string; icon: typeof Star }> = {
  Essential: { className: 'bg-success-soft text-success border border-success/20', icon: ShieldCheck },
  Important: { className: 'bg-warn-soft text-warn border border-warn/20', icon: Star },
  Optional: { className: 'bg-slate-100 text-slate-700 border border-slate-200', icon: CircleDashed },
};

const KEYS: Record<Priority, 'priority.essential' | 'priority.important' | 'priority.optional'> = {
  Essential: 'priority.essential',
  Important: 'priority.important',
  Optional: 'priority.optional',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { t } = useTranslation();
  const style = STYLES[priority];
  const Icon = style.icon;

  return (
    <span className={cx('chip', style.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(KEYS[priority])}
    </span>
  );
}
