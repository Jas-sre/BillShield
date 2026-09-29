import {
  CalendarClock,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  PlayCircle,
  Repeat,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { cx } from '../../utils/cx';
import { formatCurrencyINR } from '../../utils/currency';
import { DemoDataBadge } from '../common/DemoDataBadge';
import { StartOverButton } from '../common/StartOverButton';

export const NAV_ITEMS = [
  { to: '/', labelKey: 'nav.overview' as const, icon: LayoutDashboard },
  { to: '/upcoming', labelKey: 'nav.upcoming' as const, icon: CalendarClock },
  { to: '/mandates', labelKey: 'nav.mandates' as const, icon: Repeat },
  { to: '/cash-flow', labelKey: 'nav.cashflow' as const, icon: LineChart },
  { to: '/insights', labelKey: 'nav.insights' as const, icon: Lightbulb },
  { to: '/demo', labelKey: 'nav.demo' as const, icon: PlayCircle },
  { to: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
];

export function DesktopSidebar() {
  const { state, startTour, metrics } = useBillShield();
  const { t } = useTranslation();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-surface/95 backdrop-blur lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight text-ink">BillShield</p>
          <p className="truncate text-[11px] text-ink-muted">{t('app.tagline')}</p>
        </div>
      </div>

      <nav aria-label={t('nav.primary')} className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-primary-soft text-primary-dark'
                        : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 leading-snug">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-2xl border border-line bg-canvas/70 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-ink">{state.user.name}</p>
              <p className="text-[11px] text-ink-muted">
                {t('user.city')} · {state.user.age}
              </p>
            </div>
            <DemoDataBadge />
          </div>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-ink-muted">{t('dash.availableBalance')}</dt>
              <dd className="num font-semibold text-ink">{formatCurrencyINR(state.user.currentBalance)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-ink-muted">{t('dash.activeMandates')}</dt>
              <dd className="num font-semibold text-ink">{metrics.activeMandateCount}</dd>
            </div>
          </dl>
          <div className="mt-3 grid gap-2">
            <button type="button" className="btn btn-secondary btn-sm w-full" onClick={startTour}>
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t('demo.start')}
            </button>
            <StartOverButton className="w-full" />
          </div>
        </div>
      </nav>

      <div className="border-t border-line px-5 py-3.5">
        <p className="text-[11px] leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
