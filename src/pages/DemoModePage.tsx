import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Landmark,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DemoDataBadge } from '../components/common/DemoDataBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { TOUR_STEPS } from '../components/common/DemoWalkthrough';
import { PageHeader } from '../components/layout/PageHeader';
import { useBillShield } from '../hooks/useBillShield';
import { useTranslation } from '../hooks/useTranslation';
import { cx } from '../utils/cx';

const ARCHITECTURE: Array<{ labelKey: Parameters<ReturnType<typeof useTranslation>['t']>[0]; icon: typeof Sparkles }> = [
  { labelKey: 'common.demoData', icon: Sparkles },
  { labelKey: 'nav.insights', icon: ShieldCheck },
  { labelKey: 'nav.cashflow', icon: Users },
  { labelKey: 'mandates.action.upi', icon: Landmark },
];

export default function DemoModePage() {
  const { tourActive, tourStep, startTour, stopTour, setTourStep, resetAll, metrics, state } = useBillShield();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activeIndex = Math.min(tourStep, TOUR_STEPS.length - 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('demo.title')}
        subtitle={t('demo.subtitle')}
        eyebrow={t('common.demoData')}
        actions={
          <>
            <DemoDataBadge />
            {tourActive ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={stopTour}>
                <CircleStopIcon />
                {t('demo.stop')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={startTour}>
                <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('demo.start')}
              </button>
            )}
          </>
        }
      />

      <section className="card card-pad" aria-labelledby="demo-steps-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="demo-steps-title" className="section-title">
            {t('demo.stepLabel', { current: activeIndex + 1, total: TOUR_STEPS.length })}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (!tourActive) startTour();
                const next = Math.max(0, activeIndex - 1);
                setTourStep(next);
                navigate(TOUR_STEPS[next].route);
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.previous')}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!tourActive) startTour();
                const next = Math.min(TOUR_STEPS.length - 1, activeIndex + 1);
                setTourStep(next);
                navigate(TOUR_STEPS[next].route);
              }}
            >
              {t('common.next')}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={stopTour}>
              {t('common.skip')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('demo.resetState')}
            </button>
          </div>
        </div>

        <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TOUR_STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={step.titleKey}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: index * 0.03 }}
                  className={cx(
                    'flex h-full flex-col gap-2 rounded-2xl border p-4',
                    isActive ? 'border-primary bg-primary-soft/50' : 'border-line bg-surface',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      isActive ? 'bg-primary text-white' : 'bg-canvas text-ink-muted',
                    )}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold leading-snug text-ink">{t(step.titleKey)}</h3>
                  <p className="text-xs leading-relaxed text-ink-muted">{t(step.bodyKey)}</p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm mt-auto self-start"
                    onClick={() => {
                      setTourStep(index);
                      navigate(step.route);
                    }}
                  >
                    {t('demo.openScreen')}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </motion.div>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          {t('dash.summary', {
            total: new Intl.NumberFormat('en-IN').format(metrics.dueNext7Days),
            essential: new Intl.NumberFormat('en-IN').format(metrics.essentialNext7Days),
          })}{' '}
          · {t('cashflow.lowestBalance')}: ₹{new Intl.NumberFormat('en-IN').format(metrics.lowestBalance)}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card card-pad" aria-labelledby="demo-value-title">
          <h2 id="demo-value-title" className="section-title">
            {t('demo.valueTitle')}
          </h2>
          <ul className="mt-3 space-y-3">
            <li className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/60 px-3.5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-ink">{t('demo.valueUsers')}</p>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-line bg-canvas/60 px-3.5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-ink">{t('demo.valueInstitutions')}</p>
            </li>
          </ul>
          <p className="mt-3 text-xs font-semibold text-ink-muted">{t('demo.footer')}</p>
        </section>

        <section className="card card-pad" aria-labelledby="demo-architecture-title">
          <h2 id="demo-architecture-title" className="section-title">
            {t('demo.architectureTitle')}
          </h2>
          <ol className="mt-3 space-y-2">
            {ARCHITECTURE.map((node, index) => {
              const Icon = node.icon;
              return (
                <li key={node.labelKey} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-ink">{t(node.labelKey)}</span>
                  {index < ARCHITECTURE.length - 1 ? (
                    <ArrowRight className="ml-auto h-4 w-4 text-ink-soft" aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 rounded-2xl border border-primary/15 bg-primary-soft/50 px-3.5 py-3 text-xs leading-relaxed text-ink">
            {t('demo.architecture')}
          </p>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-muted">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
              {t('settings.privacy3')}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
              {t('modal.manage.redirectNote')}
            </li>
          </ul>
        </section>
      </div>

      <section className="card card-pad">
        <h2 className="section-title">{t('settings.about')}</h2>
        <p className="muted mt-1">
          {t('settings.aboutVersion')} · {t('settings.aboutHackathon')} · {t('settings.aboutConcept')}
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          {t('common.demoData')} — {state.payments.length} simulated recurring payments, balance{' '}
          ₹{new Intl.NumberFormat('en-IN').format(state.user.currentBalance)}.
        </p>
        <DisclaimerBanner className="mt-3" />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t('settings.resetConfirmTitle')}
        body={t('settings.resetConfirmBody')}
        confirmLabel={t('demo.resetState')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          resetAll(false);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}

function CircleStopIcon() {
  return <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />;
}
