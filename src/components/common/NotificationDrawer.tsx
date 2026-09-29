import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, BellRing, CheckCheck, CircleAlert, Flag, Sparkles, X } from 'lucide-react';
import { useEffect } from 'react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { DemoDataBadge } from './DemoDataBadge';
import { EmptyState } from './EmptyState';
import type { NotificationKind } from '../../types';
import { cx } from '../../utils/cx';
import { formatDateMedium } from '../../utils/dates';

const KIND_STYLES: Record<NotificationKind, { className: string; icon: typeof BellRing }> = {
  essential: { className: 'bg-primary-soft text-primary-dark', icon: BellRing },
  'low-balance': { className: 'bg-warn-soft text-warn', icon: CircleAlert },
  review: { className: 'bg-accent-soft text-accent-dark', icon: Flag },
  summary: { className: 'bg-slate-100 text-slate-700', icon: Sparkles },
};

export function NotificationDrawer() {
  const {
    state,
    drawerOpen,
    setDrawerOpen,
    markNotificationRead,
    markAllNotificationsRead,
  } = useBillShield();
  const { t } = useTranslation();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  const unread = state.notifications.filter((notification) => !notification.read).length;

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-scrim/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t('notif.title')}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface shadow-lifted"
          >
            <header className="flex items-center gap-3 border-b border-line px-5 py-4">
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight text-ink">{t('notif.title')}</h2>
                <p className="text-xs text-ink-muted">
                  {unread > 0 ? t('notif.unread', { count: unread }) : t('notif.empty')}
                </p>
              </div>
              <DemoDataBadge className="hidden sm:inline-flex" />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {state.notifications.length > 0 ? (
              <div className="border-b border-line px-5 py-2.5">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={markAllNotificationsRead}
                  disabled={unread === 0}
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('notif.markAllRead')}
                </button>
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto">
              {state.notifications.length === 0 ? (
                <EmptyState
                  icon={BellOff}
                  title={t('notif.empty')}
                  description={t('notif.emptyHint')}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {state.notifications.map((notification) => {
                    const style = KIND_STYLES[notification.kind];
                    const Icon = style.icon;
                    return (
                      <li key={notification.id} className={cx('px-5 py-4', !notification.read && 'bg-canvas/60')}>
                        <div className="flex gap-3">
                          <span className={cx('chip h-8 w-8 shrink-0 justify-center rounded-xl', style.className)}>
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug text-ink">{notification.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{notification.body}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-[11px] text-ink-soft">{formatDateMedium(notification.date)}</span>
                              {!notification.read ? (
                                <button
                                  type="button"
                                  className="text-[11px] font-semibold text-primary-dark underline underline-offset-2"
                                  onClick={() => markNotificationRead(notification.id)}
                                >
                                  {t('notif.markRead')}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-line bg-canvas/70 px-5 py-3">
              <p className="text-[11px] leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
            </footer>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
