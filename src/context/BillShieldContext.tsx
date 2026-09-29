import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type {
  AccessibilityPreferences,
  DemoState,
  EssentialReadiness,
  ForecastResult,
  ForecastScenarioOverrides,
  IncomeEvent,
  Insight,
  Language,
  ModalState,
  NotificationPreferences,
  Payment,
  PlanningSummary,
  Priority,
  Scenario,
  ScenarioId,
  Theme,
  Toast,
  ToastTone,
  UserProfile,
} from '../types';
import { createInitialDemoState, DEMO_TODAY } from '../data/mockData';
import { createTranslator, type Translator } from '../data/translations';
import { loadDemoState, saveDemoState } from '../utils/storage';
import { demoReducer, type DemoAction } from './demoReducer';
import {
  FORECAST_DAYS_LONG,
  FORECAST_DAYS_SHORT,
  NEXT_DAYS_WINDOW,
  SCENARIOS,
  calculateCashFlowForecast,
  getActiveMandateCount,
  getEssentialReadiness,
  getPaymentsDueInNextDays,
  getPaymentsInVisibleMonth,
  getVisibleMonthWindow,
  getOptionalSpend,
  getPausedInPlanCount,
  getPaymentTotals,
  getPotentialSavings,
  getSafeToSpendOrPlanningSummary,
  getScenarioById,
  sumPayments,
  type PaymentTotals,
  type VisibleMonthWindow,
} from '../utils/forecast';
import { buildRecommendedPlan, generateInsights, getDashboardInsights } from '../utils/insights';
import { formatCurrencyINR } from '../utils/currency';
import { formatDateShort } from '../utils/dates';

/* ------------------------------------------------------------------ *
 * Reducer (pure, unit tested in ./demoReducer.test.ts)
 * ------------------------------------------------------------------ */

export { demoReducer } from './demoReducer';
export type { DemoAction } from './demoReducer';

/* ------------------------------------------------------------------ *
 * Derived metrics
 * ------------------------------------------------------------------ */

export interface PlanImprovement {
  payment: Payment;
  merchant: string;
  currentLowest: number;
  improvedLowest: number;
  improvedDate: string;
}

export interface BillShieldMetrics {
  dueNext7Days: number;
  essentialNext7Days: number;
  otherNext7Days: number;
  dueNext7DaysCount: number;
  activeMandateCount: number;
  pausedInPlanCount: number;
  optionalSpend: number;
  potentialSavings: number;
  essentialsProtectedCount: number;
  essentialsTotalCount: number;
  essentialsNeedingPlanningCount: number;
  /** Window (days) the essential-protection card summarises. */
  essentialsWindowDays: number;
  /** Total essential spend inside that window. */
  essentialsWindowAmount: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  daysBelowBuffer: number;
  firstBelowBufferDate: string | null;
  endingBalance: number;
  safeToSpend: number;
  scheduledThisMonth: number;
  scheduledThisMonthCount: number;
  needsReviewCount: number;
  hasShortfall: boolean;
  planImprovement: PlanImprovement | null;
}

interface UIState {
  modal: ModalState;
  toasts: Toast[];
  drawerOpen: boolean;
  tourActive: boolean;
  tourStep: number;
}

let toastCounter = 0;

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

export interface BillShieldContextValue {
  state: DemoState;
  language: Language;
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  t: Translator;
  todaysDate: string;

  scenario: Scenario;
  scenarios: Scenario[];
  thirtyDayForecast: ForecastResult;
  fourteenDayForecast: ForecastResult;
  next7Totals: PaymentTotals;
  metrics: BillShieldMetrics;
  essentialsReadiness: EssentialReadiness;
  insights: Insight[];
  dashboardInsights: Insight[];
  recommendedPlan: string;
  visibleMonth: VisibleMonthWindow;

  previewForecast: (overrides: ForecastScenarioOverrides, days?: number) => ForecastResult;
  getPayment: (id: string) => Payment | undefined;
  getPaymentById: (id: string) => Payment | undefined;

  modal: ModalState;
  openModal: (kind: Exclude<ModalState['kind'], null>, paymentId: string) => void;
  closeModal: () => void;

  toasts: Toast[];
  pushToast: (toast: { title: string; description?: string; tone?: ToastTone }) => void;
  dismissToast: (id: string) => void;

  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  tourActive: boolean;
  tourStep: number;
  startTour: () => void;
  stopTour: () => void;
  setTourStep: (step: number) => void;

  completeOnboarding: () => void;
  setLanguage: (language: Language) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  setPriority: (id: string, priority: Priority) => void;
  pausePayment: (id: string) => void;
  pauseMany: (ids: string[], label: string) => void;
  resumePayment: (id: string) => void;
  resumeMany: (ids: string[]) => void;
  toggleReminder: (id: string) => void;
  setHidden: (id: string, hidden: boolean) => void;
  updateBalance: (amount: number) => void;
  updateComfortBuffer: (amount: number) => void;
  updateIncome: (patch: Partial<IncomeEvent>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setScenario: (id: ScenarioId) => void;
  setSavingsTarget: (value: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  setAccessibilityPreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
  resetAll: (includeOnboarding: boolean) => void;
  addActivity: (text: string, icon: Payment['icon']) => void;
}

export const BillShieldContext = createContext<BillShieldContextValue | null>(null);

function createInitialUIState(): UIState {
  return {
    modal: { kind: null, paymentId: null },
    toasts: [],
    drawerOpen: false,
    tourActive: false,
    tourStep: 0,
  };
}

export function BillShieldProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, () => loadDemoState() ?? createInitialDemoState());
  const [ui, setUI] = useState<UIState>(createInitialUIState);

  // Persist every change to localStorage (demo state only).
  useEffect(() => {
    saveDemoState(state);
  }, [state]);

  // Apply the saved colour theme to the document root (light is the default).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', state.theme === 'dark');
    root.style.colorScheme = state.theme;
  }, [state.theme]);

  // Tag the document with the active language. Tamil copy is longer, so
  // `lang-ta` also switches on the compact type scale in index.css.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = state.language === 'ta' ? 'ta-IN' : 'en-IN';
    root.classList.toggle('lang-ta', state.language === 'ta');
  }, [state.language]);

  const t = useMemo(() => createTranslator(state.language), [state.language]);

  const scenario = useMemo(() => getScenarioById(state.scenarioId), [state.scenarioId]);
  const visibleMonth = useMemo(() => getVisibleMonthWindow(DEMO_TODAY), []);

  const baseForecastInput = useMemo(
    () => ({
      startDate: DEMO_TODAY,
      startingBalance: state.user.currentBalance,
      incomeEvents: [state.user.nextIncome],
      payments: state.payments,
      comfortBuffer: state.user.comfortBuffer,
      scenarioOverrides: scenario.overrides,
    }),
    [state.user.currentBalance, state.user.nextIncome, state.user.comfortBuffer, state.payments, scenario],
  );

  const thirtyDayForecast = useMemo(
    () => calculateCashFlowForecast({ ...baseForecastInput, days: FORECAST_DAYS_LONG }),
    [baseForecastInput],
  );

  const fourteenDayForecast = useMemo(
    () => calculateCashFlowForecast({ ...baseForecastInput, days: FORECAST_DAYS_SHORT }),
    [baseForecastInput],
  );

  const previewForecast = useCallback(
    (overrides: ForecastScenarioOverrides, days = FORECAST_DAYS_LONG): ForecastResult =>
      calculateCashFlowForecast({
        ...baseForecastInput,
        days,
        scenarioOverrides: {
          ...scenario.overrides,
          ...overrides,
          pausePaymentIds: [
            ...(scenario.overrides.pausePaymentIds ?? []),
            ...(overrides.pausePaymentIds ?? []),
          ],
          deferredPaymentIds: [
            ...(scenario.overrides.deferredPaymentIds ?? []),
            ...(overrides.deferredPaymentIds ?? []),
          ],
        },
      }),
    [baseForecastInput, scenario.overrides],
  );

  const next7Payments = useMemo(
    () => getPaymentsDueInNextDays(state.payments, DEMO_TODAY, NEXT_DAYS_WINDOW),
    [state.payments],
  );
  const next7Totals = useMemo(() => getPaymentTotals(next7Payments), [next7Payments]);

  // Essentials inside the same 14-day window the EssentialProtection widget
  // shows, so the summary card and the list below it always agree.
  const essentialReadiness14 = useMemo(
    () =>
      getEssentialReadiness({
        payments: state.payments,
        forecast: thirtyDayForecast,
        fromDate: DEMO_TODAY,
        days: FORECAST_DAYS_SHORT,
        limit: 4,
      }),
    [state.payments, thirtyDayForecast],
  );

  const planningSummary = useMemo(
    () =>
      getSafeToSpendOrPlanningSummary({
        currentBalance: state.user.currentBalance,
        payments: state.payments,
        fromDate: DEMO_TODAY,
        incomeDate: state.user.nextIncome.date,
        comfortBuffer: state.user.comfortBuffer,
        forecast: thirtyDayForecast,
      }),
    [state.user.currentBalance, state.user.nextIncome.date, state.user.comfortBuffer, state.payments, thirtyDayForecast],
  );

  const visibleMonthPayments = useMemo(
    () => getPaymentsInVisibleMonth(state.payments, DEMO_TODAY),
    [state.payments],
  );

  const metrics = useMemo<BillShieldMetrics>(() => {
    const activeOptionalReview = state.payments
      .filter((payment) => payment.status === 'Active' && payment.priority === 'Optional' && payment.reviewRecommended)
      .sort((a, b) => b.amount - a.amount)[0];

    let planImprovement: PlanImprovement | null = null;
    if (activeOptionalReview) {
      const preview = previewForecast({ pausePaymentIds: [activeOptionalReview.id] });
      if (preview.lowestBalance > thirtyDayForecast.lowestBalance) {
        planImprovement = {
          payment: activeOptionalReview,
          merchant: activeOptionalReview.merchant,
          currentLowest: thirtyDayForecast.lowestBalance,
          improvedLowest: preview.lowestBalance,
          improvedDate: preview.lowestBalanceDate,
        };
      }
    }

    const needsReviewCount = state.payments.filter(
      (payment) => payment.status === 'Active' && (payment.reviewRecommended || payment.priority !== 'Essential'),
    ).length;

    return {
      dueNext7Days: next7Totals.total,
      essentialNext7Days: next7Totals.essential,
      otherNext7Days: next7Totals.other,
      dueNext7DaysCount: next7Totals.count,
      activeMandateCount: getActiveMandateCount(state.payments),
      pausedInPlanCount: getPausedInPlanCount(state.payments),
      optionalSpend: getOptionalSpend(state.payments),
      potentialSavings: getPotentialSavings(state.payments),
      essentialsProtectedCount: essentialReadiness14.protectedCount,
      essentialsTotalCount: essentialReadiness14.total,
      essentialsNeedingPlanningCount: essentialReadiness14.needsPlanningCount,
      essentialsWindowDays: FORECAST_DAYS_SHORT,
      essentialsWindowAmount: essentialReadiness14.items.reduce((sum, item) => sum + item.amount, 0),
      lowestBalance: thirtyDayForecast.lowestBalance,
      lowestBalanceDate: thirtyDayForecast.lowestBalanceDate,
      daysBelowBuffer: thirtyDayForecast.daysBelowBuffer,
      firstBelowBufferDate: thirtyDayForecast.firstBelowBufferDate,
      endingBalance: thirtyDayForecast.endingBalance,
      safeToSpend: planningSummary.safeToSpend,
      scheduledThisMonth: sumPayments(visibleMonthPayments),
      scheduledThisMonthCount: visibleMonthPayments.length,
      needsReviewCount,
      hasShortfall: thirtyDayForecast.forecast.some((day) => day.negativeBalance),
      planImprovement,
    };
  }, [
    state.payments,
    next7Totals,
    essentialReadiness14,
    thirtyDayForecast,
    planningSummary,
    visibleMonthPayments,
    previewForecast,
  ]);

  const insightContext = useMemo(
    () => ({
      payments: state.payments,
      today: DEMO_TODAY,
      user: state.user,
      forecast: thirtyDayForecast,
      next7Totals,
      optionalSpend: metrics.optionalSpend,
      potentialSavings: metrics.potentialSavings,
      pausedInPlanCount: metrics.pausedInPlanCount,
      scenario,
    }),
    [state.payments, state.user, thirtyDayForecast, next7Totals, metrics, scenario],
  );

  const insights = useMemo(() => generateInsights(insightContext), [insightContext]);
  const dashboardInsights = useMemo(() => getDashboardInsights(insightContext), [insightContext]);

  const recommendedPlan = useMemo(
    () =>
      buildRecommendedPlan({
        payments: state.payments,
        today: DEMO_TODAY,
        incomeDate: state.user.nextIncome.date,
        comfortBuffer: state.user.comfortBuffer,
        forecast: thirtyDayForecast,
        reviewPayment: metrics.planImprovement?.payment ?? null,
        improvedLowest: metrics.planImprovement?.improvedLowest ?? null,
        scenario,
      }),
    [state.payments, state.user.nextIncome.date, state.user.comfortBuffer, thirtyDayForecast, metrics, scenario],
  );

  /* ---------------- ui actions ---------------- */

  const pushToast = useCallback((toast: { title: string; description?: string; tone?: ToastTone }) => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    setUI((previous) => ({
      ...previous,
      toasts: [...previous.toasts, { id, title: toast.title, description: toast.description, tone: toast.tone ?? 'info' }],
    }));
    window.setTimeout(() => {
      setUI((previous) => ({ ...previous, toasts: previous.toasts.filter((item) => item.id !== id) }));
    }, 7000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setUI((previous) => ({ ...previous, toasts: previous.toasts.filter((item) => item.id !== id) }));
  }, []);

  const openModal = useCallback((kind: Exclude<ModalState['kind'], null>, paymentId: string) => {
    setUI((previous) => ({ ...previous, modal: { kind, paymentId } }));
  }, []);

  const closeModal = useCallback(() => {
    setUI((previous) => ({ ...previous, modal: { kind: null, paymentId: null } }));
  }, []);

  const setDrawerOpen = useCallback((open: boolean) => {
    setUI((previous) => ({ ...previous, drawerOpen: open }));
  }, []);

  const startTour = useCallback(() => {
    setUI((previous) => ({ ...previous, tourActive: true, tourStep: 0 }));
  }, []);

  const stopTour = useCallback(() => {
    setUI((previous) => ({ ...previous, tourActive: false, tourStep: 0 }));
  }, []);

  const setTourStep = useCallback((step: number) => {
    setUI((previous) => ({ ...previous, tourStep: Math.max(0, step) }));
  }, []);

  /* ---------------- data actions ---------------- */

  const addActivity = useCallback((text: string, icon: Payment['icon']) => {
    dispatch({
      type: 'ADD_ACTIVITY',
      item: { id: `act-${Date.now()}`, text, date: DEMO_TODAY, icon },
    });
  }, []);

  const completeOnboarding = useCallback(() => dispatch({ type: 'COMPLETE_ONBOARDING' }), []);
  const setLanguage = useCallback((language: Language) => dispatch({ type: 'SET_LANGUAGE', language }), []);
  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'SET_THEME', theme }), []);
  const updatePayment = useCallback((id: string, patch: Partial<Payment>) => dispatch({ type: 'UPDATE_PAYMENT', id, patch }), []);

  const setPriority = useCallback(
    (id: string, priority: Priority) => {
      dispatch({ type: 'SET_PRIORITY', id, priority });
      const payment = state.payments.find((item) => item.id === id);
      if (payment) {
        pushToast({
          title: t('toast.priorityChanged', { merchant: payment.merchant, priority: t(priorityKey(priority)) }),
          description: t('toast.simulatedOnly'),
          tone: 'info',
        });
        addActivity(`${payment.merchant} marked ${priority.toLowerCase()} in the plan.`, payment.icon);
      }
    },
    [state.payments, pushToast, t, addActivity],
  );

  const pausePayment = useCallback(
    (id: string) => {
      const payment = state.payments.find((item) => item.id === id);
      if (!payment) return;
      // Project the plan *with* this pause applied so the user immediately sees
      // what changed, not just that a button was pressed.
      const afterChange = previewForecast({ pausePaymentIds: [id] });
      dispatch({ type: 'PAUSE_PAYMENT', id });
      addActivity(`${payment.merchant} paused in plan.`, payment.icon);
      pushToast({
        title: t('toast.paused', { merchant: payment.merchant }),
        description: t('toast.pausedLowest', {
          amount: formatCurrencyINR(afterChange.lowestBalance),
          date: formatDateShort(afterChange.lowestBalanceDate),
        }),
        tone: 'warning',
      });
    },
    [state.payments, previewForecast, t, pushToast, addActivity],
  );

  /** Used by the insights savings simulator: one dispatch, one toast. */
  const pauseMany = useCallback(
    (ids: string[], label: string) => {
      if (ids.length === 0) {
        pushToast({ title: t('toast.noChange'), tone: 'info' });
        return;
      }
      const preview = previewForecast({ pausePaymentIds: ids });
      ids.forEach((id) => dispatch({ type: 'PAUSE_PAYMENT', id }));
      addActivity(`${label} applied to ${ids.length} subscription(s).`, 'palette');
      pushToast({
        title: t('toast.savingsApplied', {
          count: ids.length,
          amount: formatCurrencyINR(preview.lowestBalance),
        }),
        description: t('toast.simulatedOnly'),
        tone: 'success',
      });
    },
    [previewForecast, pushToast, t, addActivity],
  );

  const resumePayment = useCallback(
    (id: string) => {
      const payment = state.payments.find((item) => item.id === id);
      dispatch({ type: 'RESUME_PAYMENT', id });
      if (payment) {
        // Same idea in reverse: show the projected balance once this mandate is
        // back in the plan, so the effect of resuming is visible straight away.
        const afterChange = calculateCashFlowForecast({
          ...baseForecastInput,
          days: FORECAST_DAYS_LONG,
          payments: state.payments.map((item) =>
            item.id === id ? { ...item, status: 'Active' as const } : item,
          ),
        });
        addActivity(`${payment.merchant} kept active in plan.`, payment.icon);
        pushToast({
          title: t('toast.resumed', { merchant: payment.merchant }),
          description: t('toast.resumedLowest', {
            amount: formatCurrencyINR(afterChange.lowestBalance),
            date: formatDateShort(afterChange.lowestBalanceDate),
          }),
          tone: 'info',
        });
      }
    },
    [state.payments, baseForecastInput, t, pushToast, addActivity],
  );

  /** Reverse of `pauseMany`: keep several paused-in-plan mandates active again. */
  const resumeMany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        pushToast({ title: t('toast.noChange'), tone: 'info' });
        return;
      }
      const resumedIds = new Set(ids);
      const afterChange = calculateCashFlowForecast({
        ...baseForecastInput,
        days: FORECAST_DAYS_LONG,
        payments: state.payments.map((item) =>
          resumedIds.has(item.id) ? { ...item, status: 'Active' as const } : item,
        ),
      });
      ids.forEach((id) => dispatch({ type: 'RESUME_PAYMENT', id }));
      const icon = state.payments.find((item) => resumedIds.has(item.id))?.icon ?? 'trending-up';
      addActivity(`${ids.length} mandate(s) kept active in plan.`, icon);
      pushToast({
        title: t('toast.resumedMany', { count: ids.length }),
        description: t('toast.resumedLowest', {
          amount: formatCurrencyINR(afterChange.lowestBalance),
          date: formatDateShort(afterChange.lowestBalanceDate),
        }),
        tone: 'success',
      });
    },
    [state.payments, baseForecastInput, t, pushToast, addActivity],
  );

  const toggleReminder = useCallback(
    (id: string) => {
      const payment = state.payments.find((item) => item.id === id);
      dispatch({ type: 'TOGGLE_REMINDER', id });
      if (payment && !payment.reminderEnabled) {
        pushToast({ title: t('toast.reminderAdded'), tone: 'success' });
        addActivity(`Reminder set for ${payment.merchant}.`, payment.icon);
      }
    },
    [state.payments, t, pushToast, addActivity],
  );

  const setHidden = useCallback(
    (id: string, hidden: boolean) => {
      const payment = state.payments.find((item) => item.id === id);
      dispatch({ type: 'SET_HIDDEN', id, hidden });
      if (payment) {
        pushToast({
          title: hidden
            ? t('toast.hidden', { merchant: payment.merchant })
            : t('toast.restored', { merchant: payment.merchant }),
          tone: 'info',
        });
        addActivity(
          hidden ? `${payment.merchant} hidden from dashboard.` : `${payment.merchant} restored to dashboard.`,
          payment.icon,
        );
      }
    },
    [state.payments, t, pushToast, addActivity],
  );

  const updateBalance = useCallback((amount: number) => dispatch({ type: 'UPDATE_USER', patch: { currentBalance: amount } }), []);
  const updateComfortBuffer = useCallback(
    (amount: number) => dispatch({ type: 'UPDATE_USER', patch: { comfortBuffer: amount } }),
    [],
  );
  const updateIncome = useCallback((patch: Partial<IncomeEvent>) => dispatch({ type: 'UPDATE_INCOME', patch }), []);
  const updateProfile = useCallback((patch: Partial<UserProfile>) => dispatch({ type: 'UPDATE_USER', patch }), []);

  const setScenario = useCallback(
    (id: ScenarioId) => {
      dispatch({ type: 'SET_SCENARIO', id });
      pushToast({ title: t('toast.scenarioApplied', { scenario: getScenarioById(id).title }), tone: 'info' });
    },
    [pushToast, t],
  );

  const setSavingsTarget = useCallback((value: number) => dispatch({ type: 'SET_SAVINGS_TARGET', value }), []);
  const markNotificationRead = useCallback((id: string) => dispatch({ type: 'READ_NOTIFICATION', id }), []);
  const markAllNotificationsRead = useCallback(() => dispatch({ type: 'READ_ALL_NOTIFICATIONS' }), []);
  const setNotificationPreference = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => dispatch({ type: 'SET_NOTIFICATION_PREF', key, value }),
    [],
  );
  const setAccessibilityPreference = useCallback(
    (key: keyof AccessibilityPreferences, value: boolean) => dispatch({ type: 'SET_ACCESSIBILITY_PREF', key, value }),
    [],
  );

  const resetAll = useCallback(
    (includeOnboarding: boolean) => {
      dispatch({ type: 'RESET', includeOnboarding });
      pushToast({ title: t('toast.reset'), description: t('toast.simulatedOnly'), tone: 'success' });
    },
    [pushToast, t],
  );

  const getPayment = useCallback((id: string) => state.payments.find((payment) => payment.id === id), [state.payments]);

  const value = useMemo<BillShieldContextValue>(
    () => ({
      state,
      language: state.language,
      theme: state.theme,
      isDark: state.theme === 'dark',
      setTheme,
      t,
      todaysDate: DEMO_TODAY,
      scenario,
      scenarios: SCENARIOS,
      thirtyDayForecast,
      fourteenDayForecast,
      next7Totals,
      metrics,
      essentialsReadiness: essentialReadiness14,
      insights,
      dashboardInsights,
      recommendedPlan,
      visibleMonth,
      previewForecast,
      getPayment,
      getPaymentById: getPayment,
      modal: ui.modal,
      openModal,
      closeModal,
      toasts: ui.toasts,
      pushToast,
      dismissToast,
      drawerOpen: ui.drawerOpen,
      setDrawerOpen,
      tourActive: ui.tourActive,
      tourStep: ui.tourStep,
      startTour,
      stopTour,
      setTourStep,
      completeOnboarding,
      setLanguage,
      updatePayment,
      setPriority,
      pausePayment,
      pauseMany,
      resumeMany,
      resumePayment,
      toggleReminder,
      setHidden,
      updateBalance,
      updateComfortBuffer,
      updateIncome,
      updateProfile,
      setScenario,
      setSavingsTarget,
      markNotificationRead,
      markAllNotificationsRead,
      setNotificationPreference,
      setAccessibilityPreference,
      resetAll,
      addActivity,
    }),
    [
      state,
      t,
      scenario,
      thirtyDayForecast,
      fourteenDayForecast,
      next7Totals,
      metrics,
      essentialReadiness14,
      insights,
      dashboardInsights,
      recommendedPlan,
      visibleMonth,
      previewForecast,
      getPayment,
      ui,
      openModal,
      closeModal,
      pushToast,
      dismissToast,
      setDrawerOpen,
      startTour,
      stopTour,
      setTourStep,
      completeOnboarding,
      setLanguage,
      setTheme,
      updatePayment,
      setPriority,
      pausePayment,
      pauseMany,
      resumeMany,
      resumePayment,
      toggleReminder,
      setHidden,
      updateBalance,
      updateComfortBuffer,
      updateIncome,
      updateProfile,
      setScenario,
      setSavingsTarget,
      markNotificationRead,
      markAllNotificationsRead,
      setNotificationPreference,
      setAccessibilityPreference,
      resetAll,
      addActivity,
    ],
  );

  return <BillShieldContext.Provider value={value}>{children}</BillShieldContext.Provider>;
}

export function priorityKey(priority: Priority) {
  if (priority === 'Essential') return 'priority.essential' as const;
  if (priority === 'Important') return 'priority.important' as const;
  return 'priority.optional' as const;
}
