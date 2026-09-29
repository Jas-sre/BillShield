import { BellRing, CirclePause, CirclePlay, Eye, EyeOff, MoreVertical, ShieldCheck, Star, CircleDashed } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Payment } from '../../types';
import type { TranslationKey } from '../../data/translations';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';

export type MandateActionId =
  | 'view'
  | 'essential'
  | 'important'
  | 'optional'
  | 'reminder'
  | 'pause'
  | 'resume'
  | 'upi'
  | 'hide'
  | 'unhide';

interface MenuEntry {
  id: MandateActionId;
  labelKey: TranslationKey;
  icon: typeof Eye;
  separator?: boolean;
}

export interface MandateActionsMenuProps {
  payment: Payment;
  onAction: (action: MandateActionId, payment: Payment) => void;
  className?: string;
}

/** Keyboard accessible actions menu with outside-click and Escape handling. */
export function MandateActionsMenu({ payment, onAction, className }: MandateActionsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const entries: MenuEntry[] = [
    { id: 'view', labelKey: 'mandates.action.view', icon: Eye },
    { id: 'essential', labelKey: 'mandates.action.essential', icon: ShieldCheck },
    { id: 'important', labelKey: 'mandates.action.important', icon: Star },
    { id: 'optional', labelKey: 'mandates.action.optional', icon: CircleDashed },
    { id: 'reminder', labelKey: 'mandates.action.reminder', icon: BellRing },
    payment.status === 'Active'
      ? { id: 'pause', labelKey: 'mandates.action.pause', icon: CirclePause, separator: true }
      : { id: 'resume', labelKey: 'mandates.action.resume', icon: CirclePlay, separator: true },
    { id: 'upi', labelKey: 'mandates.action.upi', icon: ShieldCheck },
    payment.hiddenFromDashboard
      ? { id: 'unhide', labelKey: 'mandates.action.unhide', icon: Eye }
      : { id: 'hide', labelKey: 'mandates.action.hide', icon: EyeOff },
  ];

  return (
    <div ref={containerRef} className={cx('relative', className)}>
      <button
        type="button"
        className="icon-btn border border-line bg-surface"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('mandates.actions.menu')}: ${payment.merchant}`}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('mandates.actions')}
          className="absolute right-0 z-40 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-lifted"
        >
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <div key={entry.id}>
                {entry.separator ? <div className="my-1 border-t border-line" /> : null}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                  onClick={() => {
                    setOpen(false);
                    onAction(entry.id, payment);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 leading-snug break-words">{t(entry.labelKey)}</span>
                </button>
              </div>
            );
          })}
          <p className="border-t border-line px-3.5 py-2 text-[11px] leading-relaxed text-ink-soft">
            {t('mandates.hideNote')}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default MandateActionsMenu;
