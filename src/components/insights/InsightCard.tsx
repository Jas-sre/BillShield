import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Insight, InsightTone } from '../../types';
import { cx } from '../../utils/cx';
import { getIconComponent } from '../common/MerchantIcon';

const TONES: Record<InsightTone, { wrap: string; icon: string }> = {
  info: { wrap: 'border-line', icon: 'bg-primary-soft text-primary-dark' },
  good: { wrap: 'border-success/20', icon: 'bg-success-soft text-success' },
  attention: { wrap: 'border-warn/25', icon: 'bg-warn-soft text-warn' },
  alert: { wrap: 'border-danger/20', icon: 'bg-danger-soft text-danger' },
};

export interface InsightCardProps {
  insight: Insight;
  onAction?: (insight: Insight) => void;
  className?: string;
}

export function InsightCard({ insight, onAction, className }: InsightCardProps) {
  const Icon = getIconComponent(insight.icon);
  const tone = TONES[insight.tone];

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cx('card card-pad flex h-full flex-col gap-3', tone.wrap, className)}
    >
      <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', tone.icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <h3 className="text-sm font-semibold leading-snug text-ink">{insight.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{insight.body}</p>
      </div>
      {insight.actionLabel && onAction ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm self-start"
          onClick={() => onAction(insight)}
        >
          {insight.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </motion.article>
  );
}

export default InsightCard;
