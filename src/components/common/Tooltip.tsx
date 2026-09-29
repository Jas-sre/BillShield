import { Info } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cx } from '../../utils/cx';

export interface TooltipProps {
  label: string;
  children?: ReactNode;
  className?: string;
  /** Accessible label for the trigger button. */
  triggerLabel?: string;
}

/**
 * Hover/focus tooltip. Also exposed as an accessible description so the copy is
 * available to screen readers and keyboard users.
 */
export function Tooltip({ label, children, className, triggerLabel = 'More information' }: TooltipProps) {
  const id = useId();

  return (
    <span className={cx('group relative inline-flex items-center', className)}>
      <button
        type="button"
        aria-describedby={id}
        aria-label={triggerLabel}
        className="inline-flex items-center gap-1 rounded-full text-ink-soft transition-colors hover:text-primary-dark focus-visible:text-primary-dark"
      >
        {children ?? <Info className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <span
        role="tooltip"
        id={id}
        className="tooltip-surface pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl px-3 py-2 text-left text-xs font-medium leading-relaxed shadow-lifted group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
