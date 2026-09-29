import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBillShield } from '../../hooks/useBillShield';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../data/translations';
import { DemoDataBadge } from './DemoDataBadge';

interface TourStep {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  route: string;
}

/** Ordered walkthrough mirrored by the Demo mode page. */
export const TOUR_STEPS: TourStep[] = [
  { titleKey: 'demo.step1.title', bodyKey: 'demo.step1.body', route: '/' },
  { titleKey: 'demo.step2.title', bodyKey: 'demo.step2.body', route: '/' },
  { titleKey: 'demo.step3.title', bodyKey: 'demo.step3.body', route: '/mandates' },
  { titleKey: 'demo.step4.title', bodyKey: 'demo.step4.body', route: '/mandates' },
  { titleKey: 'demo.step5.title', bodyKey: 'demo.step5.body', route: '/cash-flow' },
  { titleKey: 'demo.step6.title', bodyKey: 'demo.step6.body', route: '/demo' },
];

export function DemoWalkthrough() {
  const { tourActive, tourStep, setTourStep, stopTour } = useBillShield();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!tourActive) return null;

  const index = Math.min(tourStep, TOUR_STEPS.length - 1);
  const step = TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;

  const goTo = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(nextIndex, TOUR_STEPS.length - 1));
    setTourStep(clamped);
    navigate(TOUR_STEPS[clamped].route);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-scrim/55 backdrop-blur-[1px]"
          onClick={stopTour}
          aria-hidden="true"
        />
        <motion.div
          key={step.titleKey}
          role="dialog"
          aria-modal="true"
          aria-label={t('demo.title')}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-card border border-line bg-surface shadow-lifted"
        >
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <span className="chip border border-primary/20 bg-primary-soft text-primary-dark">
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {t('demo.stepLabel', { current: index + 1, total: TOUR_STEPS.length })}
            </span>
            <DemoDataBadge className="ml-auto" />
            <button type="button" className="icon-btn" onClick={stopTour} aria-label={t('demo.stop')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-5 py-5">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{t(step.titleKey)}</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{t(step.bodyKey)}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(step.route)}
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              {t('demo.openScreen')}
            </button>
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-canvas/60 px-5 py-3.5">
            <ol className="mr-auto flex items-center gap-1.5" aria-label={t('demo.title')}>
              {TOUR_STEPS.map((item, itemIndex) => (
                <li key={item.titleKey}>
                  <button
                    type="button"
                    onClick={() => goTo(itemIndex)}
                    aria-label={t('demo.stepLabel', { current: itemIndex + 1, total: TOUR_STEPS.length })}
                    aria-current={itemIndex === index ? 'step' : undefined}
                    className={
                      itemIndex === index
                        ? 'block h-2 w-6 rounded-full bg-primary'
                        : 'block h-2 w-2 rounded-full bg-slate-300 transition-colors hover:bg-slate-400'
                    }
                  />
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-ghost btn-sm" onClick={stopTour}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.skip')}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => goTo(index - 1)}
              disabled={isFirst}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.previous')}
            </button>
            {isLast ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={stopTour}>
                {t('common.gotIt')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => goTo(index + 1)}>
                {t('common.next')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
