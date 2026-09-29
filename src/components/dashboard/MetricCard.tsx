import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type MetricTone = 'primary' | 'accent' | 'success' | 'warn' | 'neutral';

const TONES: Record<MetricTone, string> = {
  primary: 'bg-primary-soft text-primary-dark',
  accent: 'bg-accent-soft text-accent-dark',
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  neutral: 'bg-slate-100 text-slate-700',
};

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: MetricTone;
  footer?: ReactNode;
  className?: string;
  title?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  footer,
  className,
  title,
}: MetricCardProps) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cx('card card-pad flex flex-col gap-2', className)}
      title={title}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="num text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint ? <p className="text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
      {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
    </motion.article>
  );
}

export default MetricCard;
