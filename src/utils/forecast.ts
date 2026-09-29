import type {
  EssentialReadiness,
  EssentialReadinessItem,
  ForecastDay,
  ForecastEvent,
  ForecastInput,
  ForecastResult,
  ForecastScenarioOverrides,
  IncomeEvent,
  Payment,
  PlanningSummary,
  Scenario,
  ScenarioId,
} from '../types';
import { addDays, addMonths, diffInDays, formatMonthYear, isWithinRange, parseISODate, toISODate } from './dates';
import { formatCurrencyINR } from './currency';

/**
 * Cash-flow forecast engine.
 *
 * This module is the ONLY place where money is projected. The dashboard, charts,
 * insights and metrics all read from the results of these functions.
 *
 * Rules encoded here:
 *  - Payments with status "Paused in plan" are excluded from the projection.
 *  - Payments hidden from the dashboard are still projected (hiding is cosmetic).
 *  - Scenario overrides can pause, defer (move one month out) or top up income.
 */

export const FORECAST_DAYS_SHORT = 14;
export const FORECAST_DAYS_LONG = 30;
export const NEXT_DAYS_WINDOW = 7;
export const ESSENTIAL_WINDOW_DAYS = 14;

export const EXCLUDED_FROM_PLAN_STATUS = 'Paused in plan';

function isPausedInPlan(payment: Payment): boolean {
  return payment.status === 'Paused in plan';
}

/** Due date used by the projection, taking scenario deferrals into account. */
export function getEffectiveDueDate(payment: Payment, overrides: ForecastScenarioOverrides = {}): string {
  if ((overrides.deferredPaymentIds ?? []).includes(payment.id)) {
    return addMonths(payment.dueDate, 1);
  }
  return payment.dueDate;
}

/** Income events with any scenario top-up applied to the next expected income. */
export function getEffectiveIncomeEvents(
  incomeEvents: IncomeEvent[],
  overrides: ForecastScenarioOverrides = {},
): IncomeEvent[] {
  const adjustment = overrides.incomeAdjustment ?? 0;
  if (!adjustment || incomeEvents.length === 0) {
    return incomeEvents.map((event) => ({ ...event }));
  }

  const earliestIndex = incomeEvents.reduce(
    (bestIndex, event, index) =>
      parseISODate(event.date).getTime() < parseISODate(incomeEvents[bestIndex].date).getTime() ? index : bestIndex,
    0,
  );

  return incomeEvents.map((event, index) =>
    index === earliestIndex ? { ...event, amount: event.amount + adjustment } : { ...event },
  );
}

export function calculateCashFlowForecast(input: ForecastInput): ForecastResult {
  const {
    startDate,
    startingBalance,
    incomeEvents = [],
    payments = [],
    comfortBuffer = 0,
    scenarioOverrides = {},
  } = input;

  const days = Math.max(1, Math.floor(input.days));
  const endDate = addDays(startDate, days - 1);
  const pauseIds = new Set(scenarioOverrides.pausePaymentIds ?? []);

  const eventsByDate = new Map<string, ForecastEvent[]>();
  const pushEvent = (date: string, event: ForecastEvent) => {
    const bucket = eventsByDate.get(date);
    if (bucket) {
      bucket.push(event);
    } else {
      eventsByDate.set(date, [event]);
    }
  };

  for (const income of getEffectiveIncomeEvents(incomeEvents, scenarioOverrides)) {
    if (isWithinRange(income.date, startDate, endDate)) {
      pushEvent(income.date, {
        type: 'income',
        label: income.label,
        amount: income.amount,
        simulated: (scenarioOverrides.incomeAdjustment ?? 0) > 0,
      });
    }
  }

  for (const payment of payments) {
    // "Paused in plan" never appears in the projection. Hiding from the
    // dashboard is presentational only, so hidden payments remain projected.
    if (isPausedInPlan(payment) || pauseIds.has(payment.id)) continue;

    const effectiveDueDate = getEffectiveDueDate(payment, scenarioOverrides);
    if (!isWithinRange(effectiveDueDate, startDate, endDate)) continue;

    pushEvent(effectiveDueDate, {
      type: 'payment',
      label: payment.merchant,
      amount: payment.amount,
      paymentId: payment.id,
      category: payment.category,
      priority: payment.priority,
      simulated: effectiveDueDate !== payment.dueDate,
    });
  }

  const forecast: ForecastDay[] = [];
  let runningBalance = startingBalance;
  let totalInflow = 0;
  let totalOutflow = 0;

  for (let index = 0; index < days; index += 1) {
    const date = addDays(startDate, index);
    const dayEvents = (eventsByDate.get(date) ?? [])
      .slice()
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'income' ? -1 : 1));

    const inflow = dayEvents
      .filter((event) => event.type === 'income')
      .reduce((sum, event) => sum + event.amount, 0);
    const outflow = dayEvents
      .filter((event) => event.type === 'payment')
      .reduce((sum, event) => sum + event.amount, 0);

    const openingBalance = runningBalance;
    const closingBalance = openingBalance + inflow - outflow;
    runningBalance = closingBalance;
    totalInflow += inflow;
    totalOutflow += outflow;

    forecast.push({
      date,
      openingBalance,
      inflow,
      outflow,
      events: dayEvents,
      closingBalance,
      belowComfortBuffer: closingBalance < comfortBuffer,
      negativeBalance: closingBalance < 0,
    });
  }

  const lowest = forecast.reduce(
    (lowestDay, day) => (day.closingBalance < lowestDay.closingBalance ? day : lowestDay),
    forecast[0],
  );

  const firstBelow = forecast.find((day) => day.belowComfortBuffer) ?? null;

  return {
    startDate,
    days,
    startBalance: startingBalance,
    comfortBuffer,
    forecast,
    lowestBalance: lowest.closingBalance,
    lowestBalanceDate: lowest.date,
    daysBelowBuffer: forecast.filter((day) => day.belowComfortBuffer).length,
    firstBelowBufferDate: firstBelow ? firstBelow.date : null,
    totalInflow,
    totalOutflow,
    endingBalance: forecast[forecast.length - 1].closingBalance,
  };
}

/** Convenience wrapper: build the 14-day "this week at a glance" projection. */
export function buildForecastWindow(options: {
  startDate: string;
  startingBalance: number;
  payments: Payment[];
  incomeEvents: IncomeEvent[];
  comfortBuffer: number;
  days?: number;
  overrides?: ForecastScenarioOverrides;
}): ForecastResult {
  return calculateCashFlowForecast({
    startDate: options.startDate,
    days: options.days ?? FORECAST_DAYS_SHORT,
    startingBalance: options.startingBalance,
    incomeEvents: options.incomeEvents,
    payments: options.payments,
    comfortBuffer: options.comfortBuffer,
    scenarioOverrides: options.overrides ?? {},
  });
}

export function getLowestBalance(result: ForecastResult): { balance: number; date: string } {
  return { balance: result.lowestBalance, date: result.lowestBalanceDate };
}

export function getDaysBelowBuffer(result: ForecastResult): number {
  return result.daysBelowBuffer;
}

/* ------------------------------------------------------------------ *
 * Payment queries
 * ------------------------------------------------------------------ */

/** All scheduled payments from `fromDate` onwards, soonest first. */
export function getUpcomingPayments(
  payments: Payment[],
  fromDate: string,
  options: { includePaused?: boolean } = {},
): Payment[] {
  const { includePaused = false } = options;
  return payments
    .filter((payment) => (includePaused ? true : !isPausedInPlan(payment)))
    .filter((payment) => parseISODate(payment.dueDate).getTime() >= parseISODate(fromDate).getTime())
    .sort((a, b) => parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime());
}

/** Payments scheduled inside the next `days` days (inclusive of today). */
export function getPaymentsDueInNextDays(payments: Payment[], fromDate: string, days = NEXT_DAYS_WINDOW): Payment[] {
  const endDate = addDays(fromDate, Math.max(1, days) - 1);
  return getUpcomingPayments(payments, fromDate).filter((payment) =>
    isWithinRange(payment.dueDate, fromDate, endDate),
  );
}

export function sumPayments(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

export interface PaymentTotals {
  total: number;
  essential: number;
  other: number;
  essentialCount: number;
  count: number;
}

export function getPaymentTotals(payments: Payment[]): PaymentTotals {
  const essentialPayments = payments.filter((payment) => payment.priority === 'Essential');
  const total = sumPayments(payments);
  const essential = sumPayments(essentialPayments);
  return {
    total,
    essential,
    other: total - essential,
    essentialCount: essentialPayments.length,
    count: payments.length,
  };
}

/** Essential payments falling due before the next expected income (essentials only). */
export function getEssentialPaymentsBeforeIncome(
  payments: Payment[],
  fromDate: string,
  incomeDate: string,
): Payment[] {
  return payments
    .filter((payment) => !isPausedInPlan(payment))
    .filter((payment) => payment.priority === 'Essential')
    .filter(
      (payment) =>
        !isBeforeDate(payment.dueDate, fromDate) && isBeforeDate(payment.dueDate, incomeDate),
    )
    .sort((a, b) => parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime());
}

/** Number of mandates still active in the BillShield plan. */
export function getActiveMandateCount(payments: Payment[]): number {
  return payments.filter((payment) => !isPausedInPlan(payment)).length;
}

export function getPausedInPlanCount(payments: Payment[]): number {
  return payments.filter(isPausedInPlan).length;
}

/** Total optional recurring spend in the plan. */
export function getOptionalSpend(payments: Payment[]): number {
  return sumPayments(
    payments.filter((payment) => !isPausedInPlan(payment) && payment.priority === 'Optional'),
  );
}

/** Optional spend flagged for review — the "potential monthly savings" figure. */
export function getPotentialSavings(payments: Payment[]): number {
  return sumPayments(
    payments.filter(
      (payment) =>
        !isPausedInPlan(payment) && payment.priority === 'Optional' && payment.reviewRecommended,
    ),
  );
}

export function getMandatesNeedingReview(payments: Payment[]): Payment[] {
  return payments
    .filter((payment) => !isPausedInPlan(payment))
    .filter((payment) => payment.reviewRecommended || payment.priority !== 'Essential')
    .sort(
      (a, b) =>
        Number(b.reviewRecommended) - Number(a.reviewRecommended) ||
        parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime(),
    );
}

/** Payments shown in dashboard widgets (hidden items are excluded here only). */
export function getVisibleDashboardPayments(payments: Payment[], fromDate: string, limit?: number): Payment[] {
  const visible = getUpcomingPayments(payments, fromDate).filter(
    (payment) => !payment.hiddenFromDashboard,
  );
  return typeof limit === 'number' ? visible.slice(0, limit) : visible;
}

export function getHiddenDashboardPayments(payments: Payment[]): Payment[] {
  return payments.filter((payment) => payment.hiddenFromDashboard);
}

/**
 * The "visible month" window used by the Upcoming *This month* tab and the
 * Mandates summary: the calendar month of today, extended into the next month
 * when fewer than 7 days of it remain (which is the case on the demo date).
 */
export interface VisibleMonthWindow {
  start: string;
  end: string;
  label: string;
}

export function getVisibleMonthWindow(today: string): VisibleMonthWindow {
  const date = parseISODate(today);
  const start = toISODate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
  let end = toISODate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));

  if (diffInDays(today, end) < NEXT_DAYS_WINDOW) {
    end = toISODate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0)));
  }

  const startLabel = formatMonthYear(start);
  const endLabel = formatMonthYear(end);
  return { start, end, label: startLabel === endLabel ? startLabel : `${startMonthShort(start)} – ${endLabel}` };
}

function startMonthShort(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseISODate(iso).getUTCMonth()];
}

/** Every payment (whatever its status) whose next debit falls in the visible month. */
export function getPaymentsInVisibleMonth(payments: Payment[], today: string): Payment[] {
  const window = getVisibleMonthWindow(today);
  return payments
    .filter((payment) => isWithinRange(payment.dueDate, window.start, window.end))
    .sort((a, b) => parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime());
}

/** Payments scheduled inside the next `days` days, including paused-in-plan items. */
export function getPaymentsInNextWindow(
  payments: Payment[],
  fromDate: string,
  days: number,
  options: { includePaused?: boolean } = {},
): Payment[] {
  const { includePaused = true } = options;
  const endDate = addDays(fromDate, Math.max(1, days) - 1);
  return getUpcomingPayments(payments, fromDate, { includePaused }).filter((payment) =>
    isWithinRange(payment.dueDate, fromDate, endDate),
  );
}

/* ------------------------------------------------------------------ *
 * Planning summaries
 * ------------------------------------------------------------------ */

export function getSafeToSpend(options: {
  currentBalance: number;
  payments: Payment[];
  fromDate: string;
  incomeDate: string;
  comfortBuffer: number;
}): number {
  const { currentBalance, payments, fromDate, incomeDate, comfortBuffer } = options;
  const essentials = getEssentialPaymentsBeforeIncome(payments, fromDate, incomeDate);
  return Math.max(0, currentBalance - sumPayments(essentials) - comfortBuffer);
}

export function getSafeToSpendOrPlanningSummary(options: {
  currentBalance: number;
  payments: Payment[];
  fromDate: string;
  incomeDate: string;
  comfortBuffer: number;
  forecast: ForecastResult;
}): PlanningSummary {
  const { currentBalance, payments, fromDate, incomeDate, comfortBuffer, forecast } = options;
  const essentialBeforeIncome = sumPayments(getEssentialPaymentsBeforeIncome(payments, fromDate, incomeDate));
  const safeToSpend = getSafeToSpend({
    currentBalance,
    payments,
    fromDate,
    incomeDate,
    comfortBuffer,
  });

  const hasShortfall = forecast.forecast.some((day) => day.negativeBalance);
  const needsPlan = forecast.daysBelowBuffer > 0;

  const status: PlanningSummary['status'] = hasShortfall ? 'shortfall' : needsPlan ? 'plan-needed' : 'healthy';
  const statusLabel = hasShortfall ? 'Shortfall likely' : needsPlan ? 'Plan needed' : 'On track';

  return {
    status,
    statusLabel,
    safeToSpend,
    essentialBeforeIncome,
    lowestBalance: forecast.lowestBalance,
    lowestBalanceDate: forecast.lowestBalanceDate,
    daysBelowBuffer: forecast.daysBelowBuffer,
  };
}

export function getEssentialReadiness(options: {
  payments: Payment[];
  forecast: ForecastResult;
  fromDate: string;
  days?: number;
  /** Caps the essentials that are both returned and counted, for compact widgets. */
  limit?: number;
}): EssentialReadiness {
  const { payments, forecast, fromDate, days = FORECAST_DAYS_LONG, limit } = options;
  const endDate = addDays(fromDate, days - 1);
  const closingByDate = new Map(forecast.forecast.map((day) => [day.date, day.closingBalance]));

  const essentials = payments
    .filter((payment) => !isPausedInPlan(payment))
    .filter((payment) => payment.priority === 'Essential')
    .filter((payment) => isWithinRange(payment.dueDate, fromDate, endDate))
    .sort((a, b) => parseISODate(a.dueDate).getTime() - parseISODate(b.dueDate).getTime());

  const scoped = typeof limit === 'number' ? essentials.slice(0, limit) : essentials;

  // Counts are derived from the same scoped list that is returned, so the
  // "protected X/Y" figures can never disagree with the rows on screen.
  const items: EssentialReadinessItem[] = scoped.map((payment) => {
    const projected = closingByDate.get(payment.dueDate) ?? forecast.endingBalance;
    return {
      paymentId: payment.id,
      merchant: payment.merchant,
      amount: payment.amount,
      dueDate: payment.dueDate,
      status: projected >= forecast.comfortBuffer ? 'Protected' : 'Needs planning',
      projectedBalanceOnDueDate: projected,
    };
  });

  return {
    items,
    protectedCount: items.filter((item) => item.status === 'Protected').length,
    needsPlanningCount: items.filter((item) => item.status === 'Needs planning').length,
    total: items.length,
  };
}

/* ------------------------------------------------------------------ *
 * What-if scenarios
 * ------------------------------------------------------------------ */

export const SCENARIOS: Scenario[] = [
  {
    id: 'keep-all',
    title: 'Keep all active',
    description: 'Your current plan with every active payment included.',
    icon: 'trending-up',
    overrides: {},
  },
  {
    id: 'pause-adobe',
    title: 'Pause Adobe Creative Cloud',
    description: 'Simulate pausing ₹1,199/month in your BillShield plan.',
    icon: 'palette',
    overrides: { pausePaymentIds: ['adobe-creative-cloud'] },
  },
  {
    id: 'defer-netflix',
    title: 'Move Netflix to next month',
    description: 'Simulate moving the ₹649 renewal into the following month.',
    icon: 'monitor-play',
    overrides: { deferredPaymentIds: ['netflix'] },
  },
  {
    id: 'extra-income',
    title: 'Add ₹2,000 expected income',
    description: 'Simulate an extra ₹2,000 of part-time income arriving with your next income.',
    icon: 'graduation-cap',
    overrides: { incomeAdjustment: 2000 },
  },
];

export function getScenarioById(id: ScenarioId): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}

/* ------------------------------------------------------------------ *
 * Internal helpers
 * ------------------------------------------------------------------ */

function isBeforeDate(a: string, b: string): boolean {
  return parseISODate(a).getTime() < parseISODate(b).getTime();
}

/** Human sentence for the plan status chip. */
export function describeLowBalanceRisk(forecast: ForecastResult): string {
  if (forecast.daysBelowBuffer === 0) {
    return `Your projected balance stays above your ${formatCurrencyINR(
      forecast.comfortBuffer,
    )} comfort buffer for the next ${forecast.days} days.`;
  }
  return `Your projected balance may fall below your ${formatCurrencyINR(
    forecast.comfortBuffer,
  )} comfort buffer on ${formatDateForCopy(forecast.firstBelowBufferDate ?? forecast.lowestBalanceDate)}. Review optional payments to improve your plan.`;
}

/** Compact copy-safe date: "04 Oct" — uses fixed English month names only. */
export function formatDateForCopy(iso: string): string {
  const date = parseISODate(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]}`;
}
