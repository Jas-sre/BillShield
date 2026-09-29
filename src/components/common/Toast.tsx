import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { Toast, ToastTone } from '../../types';
import { cx } from '../../utils/cx';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';

const TONES: Record<ToastTone, { className: string; icon: typeof Info }> = {
  info: { className: 'border-primary/20 bg-primary-soft text-primary-dark', icon: Info },
  success: { className: 'border-success/20 bg-success-soft text-success', icon: CheckCircle2 },
  warning: { className: 'border-warn/30 bg-warn-soft text-warn', icon: AlertTriangle },
};

export function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone = TONES[toast.tone];
  const Icon = tone.icon;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-lifted"
    >
      <div className="flex items-start gap-3 p-3.5">
        <span className={cx('chip mt-0.5 shrink-0', tone.className)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-ink">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{toast.description}</p>
          ) : null}
        </div>
        <button type="button" className="icon-btn h-7 w-7" onClick={onDismiss} aria-label="Dismiss notification">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.li>
  );
}

/** Fixed toast stack, polite live region. */
export function ToastViewport() {
  const { toasts, dismissToast } = useBillShield();
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0">
      <p className="sr-only" aria-live="polite">
        {toasts.length > 0 ? toasts[toasts.length - 1].title : ''}
      </p>
      <ul className="flex w-full flex-col items-center gap-2 sm:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
          ))}
        </AnimatePresence>
      </ul>
      <p aria-hidden="true" className="mt-1 hidden text-[11px] text-ink-soft sm:block">
        {t('disclaimer.short')}
      </p>
    </div>
  );
}
