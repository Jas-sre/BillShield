import { Bell, Wallet } from 'lucide-react';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrencyINR } from '../../utils/currency';
import { formatDateFull } from '../../utils/dates';
import { DemoDataBadge } from '../common/DemoDataBadge';
import { LanguageToggle } from '../common/LanguageToggle';
import { ThemeToggle } from '../common/ThemeToggle';

export function TopHeader() {
  const { state, setDrawerOpen, todaysDate } = useBillShield();
  const { t } = useTranslation();
  const unread = state.notifications.filter((notification) => !notification.read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold tracking-tight text-ink sm:text-lg">
            {t('header.greeting', { name: t('user.firstName') })}
          </h1>
          <p className="truncate text-xs text-ink-muted">
            {t('header.today')} · {formatDateFull(todaysDate)}
          </p>
        </div>

        <span className="hidden items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-card sm:inline-flex">
          <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-ink-muted">{t('dash.availableBalance')}</span>
          <span className="num">{formatCurrencyINR(state.user.currentBalance)}</span>
        </span>

        <DemoDataBadge className="hidden md:inline-flex" />
        <LanguageToggle className="hidden sm:inline-flex" />
        <ThemeToggle />

        <button
          type="button"
          className="icon-btn relative border border-line bg-surface"
          onClick={() => setDrawerOpen(true)}
          aria-label={`${t('header.openNotifications')}${unread > 0 ? ` (${unread})` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </button>

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
          aria-label={state.user.name}
          title={state.user.name}
        >
          {state.user.initials}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 pb-2.5 no-scrollbar sm:hidden">
        <span className="chip shrink-0 border border-line bg-surface text-ink">
          <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="num">{formatCurrencyINR(state.user.currentBalance)}</span>
        </span>
        <DemoDataBadge className="shrink-0" />
        <LanguageToggle className="shrink-0" />
        <ThemeToggle className="shrink-0" />
      </div>
    </header>
  );
}

export default TopHeader;
