import { BellRing, EyeOff, Languages, Lock, RotateCcw, Sparkles, SunMoon, User } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { EmptyState } from '../components/common/EmptyState';
import { LanguageToggle } from '../components/common/LanguageToggle';
import { MerchantIcon } from '../components/common/MerchantIcon';
import { Switch } from '../components/common/Switch';
import { ThemeSegmented } from '../components/common/ThemeToggle';
import { PageHeader } from '../components/layout/PageHeader';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import type { AccessibilityPreferences, NotificationPreferences } from '../types';
import { formatCurrencyINR } from '../utils/currency';
import { getHiddenDashboardPayments } from '../utils/forecast';

const NOTIFICATION_KEYS: Array<{ key: keyof NotificationPreferences; labelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0] }> = [
  { key: 'essentialBills', labelKey: 'settings.notif.essential' },
  { key: 'lowBalance', labelKey: 'settings.notif.lowBalance' },
  { key: 'subscriptionReview', labelKey: 'settings.notif.review' },
  { key: 'weeklySummary', labelKey: 'settings.notif.weekly' },
];

const ACCESSIBILITY_KEYS: Array<{ key: keyof AccessibilityPreferences; labelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0] }> = [
  { key: 'reduceMotion', labelKey: 'settings.reduceMotion' },
  { key: 'largeText', labelKey: 'settings.largeText' },
  { key: 'highContrast', labelKey: 'settings.highContrast' },
];

export default function SettingsPage() {
  const {
    state,
    resetAll,
    setHidden,
    setNotificationPreference,
    setAccessibilityPreference,
    todaysDate,
    openModal,
  } = useBillShield();
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [includeOnboarding, setIncludeOnboarding] = useState(true);

  const hiddenPayments = getHiddenDashboardPayments(state.payments);

  return (
    <div className="space-y-5">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} eyebrow={t('common.demoData')} />

      <section className="card card-pad" aria-labelledby="settings-profile">
        <h2 id="settings-profile" className="section-title flex items-center gap-2">
          <User className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('settings.profile')}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-base font-bold text-white">
            {state.user.initials}
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">{state.user.name}</p>
            <p className="text-sm text-ink-muted">
              {state.user.city}, {state.user.state} · {state.user.age}
            </p>
            <p className="text-xs text-ink-muted">
              {t('dash.availableBalance')}: <span className="num">{formatCurrencyINR(state.user.currentBalance)}</span> ·{' '}
              {t('cashflow.nextIncome')}: <span className="num">{formatCurrencyINR(state.user.nextIncome.amount)}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{t('settings.language')}</p>
              <p className="text-xs text-ink-muted">{t('settings.subtitle')}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <SunMoon className="h-4 w-4 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{t('theme.appearance')}</p>
              <p className="text-xs text-ink-muted">
                {t('theme.light')} / {t('theme.dark')}
              </p>
            </div>
          </div>
          <ThemeSegmented />
        </div>

        <h3 className="mt-5 text-sm font-semibold text-ink">{t('settings.accessibility')}</h3>
        <div className="mt-1 divide-y divide-line">
          {ACCESSIBILITY_KEYS.map((item) => (
            <Switch
              key={item.key}
              label={t(item.labelKey)}
              checked={state.accessibility[item.key]}
              onChange={(value) => setAccessibilityPreference(item.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="settings-privacy">
        <h2 id="settings-privacy" className="section-title flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('settings.privacy')}
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
          <li>• {t('settings.privacy1')}</li>
          <li>• {t('settings.privacy2')}</li>
          <li>• {t('settings.privacy3')}</li>
          <li>• {t('settings.privacy4')}</li>
        </ul>
        <DisclaimerBanner className="mt-4" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmOpen(true)}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('settings.reset')}
          </button>
          <p className="text-xs text-ink-muted">{t('settings.resetNote')}</p>
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="settings-hidden">
        <h2 id="settings-hidden" className="section-title flex items-center gap-2">
          <EyeOff className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('settings.restoreHidden')}
        </h2>
        <p className="muted mt-1">{t('settings.restoreHiddenNote')}</p>

        {hiddenPayments.length === 0 ? (
          <EmptyState title={t('settings.restoreHiddenEmpty')} description={t('mandates.hideNote')} />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {hiddenPayments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center gap-3 py-3">
                <MerchantIcon name={payment.icon} color={payment.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{payment.merchant}</p>
                  <p className="num text-xs text-ink-muted">
                    {formatCurrencyINR(payment.amount)} · {payment.category}
                  </p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHidden(payment.id, false)}>
                  {t('common.restore')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card-pad" aria-labelledby="settings-notifications">
        <h2 id="settings-notifications" className="section-title flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('settings.notifications')}
        </h2>
        <div className="mt-1 divide-y divide-line">
          {NOTIFICATION_KEYS.map((item) => (
            <Switch
              key={item.key}
              label={t(item.labelKey)}
              checked={state.notificationPreferences[item.key]}
              onChange={(value) => setNotificationPreference(item.key, value)}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.payments.slice(0, 3).map((payment) => (
            <button
              key={payment.id}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => openModal('detail', payment.id)}
            >
              {payment.merchant} {payment.reminderEnabled ? '· 1d' : ''}
            </button>
          ))}
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="settings-about">
        <h2 id="settings-about" className="section-title flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          {t('settings.about')}
        </h2>
        <p className="mt-3 text-xs font-semibold text-ink-muted">{t('settings.aboutVersion')}</p>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{t('settings.aboutHackathon')}</dt>
            <dd className="text-ink">{t('settings.aboutConcept')}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{t('header.today')}</dt>
            <dd className="num text-ink">{todaysDate}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{t('disclaimer.long')}</p>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t('settings.resetConfirmTitle')}
        body={
          <div className="space-y-3">
            <p>{t('settings.resetConfirmBody')}</p>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={includeOnboarding}
                onChange={(event) => setIncludeOnboarding(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary-light"
              />
              <span>{t('settings.resetWithOnboarding')}</span>
            </label>
          </div>
        }
        confirmLabel={t('settings.reset')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          resetAll(includeOnboarding);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
