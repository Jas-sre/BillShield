import { CalendarClock, LayoutDashboard, Lightbulb, LineChart, MoreHorizontal, PlayCircle, Repeat, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';
import { StartOverButton } from '../common/StartOverButton';

const PRIMARY_ITEMS = [
  { to: '/', labelKey: 'nav.overview' as const, icon: LayoutDashboard },
  { to: '/upcoming', labelKey: 'nav.upcoming' as const, icon: CalendarClock },
  { to: '/mandates', labelKey: 'nav.mandates' as const, icon: Repeat },
  { to: '/insights', labelKey: 'nav.insights' as const, icon: Lightbulb },
];

const MORE_ITEMS = [
  { to: '/cash-flow', labelKey: 'nav.cashflow' as const, icon: LineChart },
  { to: '/demo', labelKey: 'nav.demo' as const, icon: PlayCircle },
  { to: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const moreIsActive = MORE_ITEMS.some((item) => item.to === location.pathname);

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 flex items-end lg:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            className="absolute inset-0 bg-scrim/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative z-10 w-full rounded-t-card border-t border-line bg-surface px-4 pb-24 pt-4 shadow-lifted">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{t('nav.more')}</p>
              <button type="button" className="icon-btn" onClick={() => setMoreOpen(false)} aria-label={t('common.close')}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="grid gap-1">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cx(
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors',
                          isActive ? 'bg-primary-soft text-primary-dark' : 'text-ink-muted hover:bg-slate-100',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(item.labelKey)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            <StartOverButton className="mt-3 w-full" />
            <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
          </div>
        </div>
      ) : null}

      <nav
        aria-label={t('nav.primary')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cx(
                      'flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition-colors',
                      isActive ? 'text-primary-dark' : 'text-ink-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cx('h-5 w-5', isActive && 'text-primary')} aria-hidden="true" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={cx(
                'flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition-colors',
                moreIsActive ? 'text-primary-dark' : 'text-ink-muted',
              )}
            >
              <MoreHorizontal className={cx('h-5 w-5', moreIsActive && 'text-primary')} aria-hidden="true" />
              <span>{t('nav.more')}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default MobileBottomNav;
