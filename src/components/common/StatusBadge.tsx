import { AlertTriangle, CircleCheck, CirclePause, EyeOff, Flag } from 'lucide-react';
import { cx } from '../../utils/cx';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../data/translations';

export type StatusBadgeVariant =
  | 'Active'
  | 'Paused in plan'
  | 'Protected'
  | 'Needs planning'
  | 'Review recommended'
  | 'Hidden from dashboard';

const STYLES: Record<StatusBadgeVariant, { className: string; icon: typeof CircleCheck; key: TranslationKey }> = {
  Active: { className: 'bg-success-soft text-success border border-success/20', icon: CircleCheck, key: 'status.active' },
  'Paused in plan': {
    className: 'bg-accent-soft text-accent-dark border border-accent/20',
    icon: CirclePause,
    key: 'status.pausedInPlan',
  },
  Protected: {
    className: 'bg-success-soft text-success border border-success/20',
    icon: CircleCheck,
    key: 'status.protected',
  },
  'Needs planning': {
    className: 'bg-warn-soft text-warn border border-warn/25',
    icon: AlertTriangle,
    key: 'status.needsPlanning',
  },
  'Review recommended': {
    className: 'bg-warn-soft text-warn border border-warn/25',
    icon: Flag,
    key: 'status.reviewRecommended',
  },
  'Hidden from dashboard': {
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: EyeOff,
    key: 'status.hidden',
  },
};

export function StatusBadge({ variant, className }: { variant: StatusBadgeVariant; className?: string }) {
  const { t } = useTranslation();
  const style = STYLES[variant];
  const Icon = style.icon;

  return (
    <span className={cx('chip', style.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(style.key)}
    </span>
  );
}
