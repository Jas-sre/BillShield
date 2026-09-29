import { motion } from 'framer-motion';
import { ArrowRight, BellRing, CalendarClock, PlayCircle, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoDataBadge } from '../components/common/DemoDataBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { LanguageToggle } from '../components/common/LanguageToggle';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';

const BENEFITS = [
  { titleKey: 'onboarding.benefit1.title' as const, bodyKey: 'onboarding.benefit1.body' as const, icon: CalendarClock },
  { titleKey: 'onboarding.benefit2.title' as const, bodyKey: 'onboarding.benefit2.body' as const, icon: TrendingDown },
  { titleKey: 'onboarding.benefit3.title' as const, bodyKey: 'onboarding.benefit3.body' as const, icon: BellRing },
];

/** First-run onboarding with the required demo-consent checkbox. */
export default function WelcomePage() {
  const { completeOnboarding, startTour, state } = useBillShield();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);

  const handleOpen = () => {
    completeOnboarding();
    navigate('/');
  };

  const handleTour = () => {
    completeOnboarding();
    startTour();
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold tracking-tight text-ink">BillShield</p>
          <p className="truncate text-[11px] text-ink-muted">{t('app.tagline')}</p>
        </div>
        <DemoDataBadge />
        <LanguageToggle className="hidden sm:inline-flex" />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="card card-pad sm:p-8"
          >
            <span className="chip border border-primary/20 bg-primary-soft text-primary-dark">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              DRUNIX Hackathon prototype
            </span>
            <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              {t('onboarding.title')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
              {t('onboarding.subtitle')}
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.li
                    key={benefit.titleKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 * index }}
                    className="rounded-2xl border border-line bg-canvas/60 p-3.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2.5 text-sm font-semibold leading-snug text-ink">{t(benefit.titleKey)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t(benefit.bodyKey)}</p>
                  </motion.li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary-soft/50 p-4">
              <p className="text-sm font-semibold text-primary-dark">{t('onboarding.consent')}</p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary-light"
                />
                <span className="leading-relaxed">{t('onboarding.checkbox')}</span>
              </label>
              <p className="mt-2 text-xs text-ink-muted">{t('onboarding.notice')}</p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button type="button" className="btn btn-primary" onClick={handleOpen} disabled={!consent}>
                {t('onboarding.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-outline" onClick={handleTour} disabled={!consent}>
                <PlayCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('onboarding.secondary')}
              </button>
            </div>

            {!consent ? (
              <p className="mt-2 text-xs text-ink-soft" role="status">
                {t('onboarding.checkbox')}
              </p>
            ) : null}
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="card card-pad">
              <h2 className="section-title">Demo persona</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
                  {state.user.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{state.user.name}</p>
                  <p className="text-xs text-ink-muted">
                    {state.user.age} · {state.user.city}, {state.user.state}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">{t('dash.availableBalance')}</dt>
                  <dd className="num font-semibold text-ink">₹{state.user.currentBalance.toLocaleString('en-IN')}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">{t('cashflow.nextIncome')}</dt>
                  <dd className="num font-semibold text-ink">
                    ₹{state.user.nextIncome.amount.toLocaleString('en-IN')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted">{t('cashflow.comfortBuffer')}</dt>
                  <dd className="num font-semibold text-ink">₹{state.user.comfortBuffer.toLocaleString('en-IN')}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                {state.payments.length} recurring payments — bills, EMIs, insurance, investments and subscriptions.
              </p>
            </div>

            <div className="card card-pad">
              <h2 className="section-title">What BillShield is not</h2>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                <li>• Not a UPI app and not a payment processor.</li>
                <li>• No account access, no live UPI data, no real mandates.</li>
                <li>• No UPI PIN, OTP, account number or card details — ever.</li>
                <li>• A mandate-intelligence and cash-flow-planning layer only.</li>
              </ul>
            </div>

            <DisclaimerBanner />
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
