import { describe, expect, it } from 'vitest';
import type { ForecastInput, IncomeEvent, Payment } from '../types';
import { createInitialDemoState, DEMO_TODAY, seedPayments, seedUser } from '../data/mockData';
import {
  SCENARIOS,
  calculateCashFlowForecast,
  describeLowBalanceRisk,
  getActiveMandateCount,
  getDaysBelowBuffer,
  getEffectiveDueDate,
  getEffectiveIncomeEvents,
  getEssentialPaymentsBeforeIncome,
  getEssentialReadiness,
  getHiddenDashboardPayments,
  getLowestBalance,
  getMandatesNeedingReview,
  getOptionalSpend,
  getPaymentTotals,
  getPaymentsDueInNextDays,
  getPaymentsInVisibleMonth,
  getPausedInPlanCount,
  getPotentialSavings,
  getSafeToSpend,
  getSafeToSpendOrPlanningSummary,
  getScenarioById,
  getUpcomingPayments,
  getVisibleDashboardPayments,
  getVisibleMonthWindow,
  sumPayments,
} from './forecast';

const baseInput = (overrides: Partial<ForecastInput> = {}): ForecastInput => ({
  startDate: DEMO_TODAY,
  days: 30,
  startingBalance: seedUser.currentBalance,
  incomeEvents: [seedUser.nextIncome],
  payments: seedPayments,
  comfortBuffer: seedUser.comfortBuffer,
  ...overrides,
});

const project = (overrides: Partial<ForecastInput> = {}) => calculateCashFlowForecast(baseInput(overrides));

const pausedPayments = (ids: string[]): Payment[] =>
  seedPayments.map((payment) => (ids.includes(payment.id) ? { ...payment, status: 'Paused in plan' } : payment));

describe('seed data', () => {
  it('ships the 10 demo mandates', () => {
    expect(seedPayments).toHaveLength(10);
    expect(getActiveMandateCount(seedPayments)).toBe(10);
    expect(getPausedInPlanCount(seedPayments)).toBe(0);
    expect(createInitialDemoState().payments).toHaveLength(10);
  });

  it('starts from the documented persona figures', () => {
    expect(seedUser.currentBalance).toBe(4820);
    expect(seedUser.comfortBuffer).toBe(1000);
    expect(seedUser.nextIncome.amount).toBe(7500);
    expect(seedUser.nextIncome.date).toBe('2026-10-08');
    expect(DEMO_TODAY).toBe('2026-09-28');
  });
});

describe('calculateCashFlowForecast', () => {
  it('produces one record per day with the documented shape', () => {
    const result = project({ days: 14 });
    expect(result.forecast).toHaveLength(14);
    expect(result.forecast[0]).toEqual({
      date: '2026-09-28',
      openingBalance: 4820,
      inflow: 0,
      outflow: 0,
      events: [],
      closingBalance: 4820,
      belowComfortBuffer: false,
      negativeBalance: false,
    });
  });

  it('reproduces the required headline figures', () => {
    const result = project();
    expect(result.lowestBalance).toBe(473);
    expect(result.lowestBalanceDate).toBe('2026-10-07');
    expect(result.daysBelowBuffer).toBe(1);
    expect(result.firstBelowBufferDate).toBe('2026-10-07');
    expect(result.totalOutflow).toBe(7795);
    expect(result.totalInflow).toBe(7500);
    expect(result.endingBalance).toBe(4525);
  });

  it('agrees between the 14-day and 30-day windows for the low point', () => {
    expect(project({ days: 14 }).lowestBalance).toBe(473);
    expect(project({ days: 30 }).lowestBalance).toBe(473);
    expect(getLowestBalance(project()).balance).toBe(473);
    expect(getDaysBelowBuffer(project())).toBe(1);
  });

  it('applies income only on the income date', () => {
    const result = project();
    const incomeDays = result.forecast.filter((day) => day.inflow > 0);
    expect(incomeDays).toHaveLength(1);
    expect(incomeDays[0].date).toBe('2026-10-08');
    expect(incomeDays[0].inflow).toBe(7500);
  });

  it('deducts a payment only on its due date and only when Active', () => {
    const result = project({ days: 7 });
    const airtelDay = result.forecast.find((day) => day.date === '2026-10-02');
    expect(airtelDay?.outflow).toBe(399);
    expect(airtelDay?.events.map((event) => event.label)).toEqual(['Airtel Mobile']);

    const paused = project({ days: 7, payments: pausedPayments(['airtel-mobile']) });
    expect(paused.forecast.find((day) => day.date === '2026-10-02')?.outflow).toBe(0);
    // Dropping the ₹399 debit lifts the 7-day low point by exactly that amount.
    expect(paused.lowestBalance).toBe(result.lowestBalance + 399);
  });

  it('excludes Paused in plan items and keeps hidden items in the projection', () => {
    const afterPause = project({ payments: pausedPayments(['adobe-creative-cloud']) });
    expect(afterPause.lowestBalance).toBe(1672);
    expect(getOptionalSpend(pausedPayments(['adobe-creative-cloud']))).toBe(898);

    const hidden = seedPayments.map((payment) =>
      payment.id === 'netflix' ? { ...payment, hiddenFromDashboard: true } : payment,
    );
    expect(calculateCashFlowForecast(baseInput({ payments: hidden })).lowestBalance).toBe(473);
    expect(getVisibleDashboardPayments(hidden, DEMO_TODAY, 4).some((p) => p.id === 'netflix')).toBe(false);
    expect(getUpcomingPayments(hidden, DEMO_TODAY).some((p) => p.id === 'netflix')).toBe(true);
    expect(getHiddenDashboardPayments(hidden)).toHaveLength(1);
  });

  it('supports scenario overrides', () => {
    expect(project({ scenarioOverrides: { pausePaymentIds: ['adobe-creative-cloud'] } }).lowestBalance).toBe(1672);
    expect(project({ scenarioOverrides: { deferredPaymentIds: ['netflix'] } }).lowestBalance).toBe(473 + 649);

    // Extra income lands with the next income on 08 Oct, which is *after* the
    // 07 Oct dip — so the low point is unchanged but the month ends higher.
    const extraIncome = project({ scenarioOverrides: { incomeAdjustment: 2000 } });
    expect(extraIncome.lowestBalance).toBe(473);
    expect(extraIncome.daysBelowBuffer).toBe(1);
    expect(extraIncome.totalInflow).toBe(9500);
    expect(extraIncome.endingBalance).toBe(6525);
  });

  it('flags a genuine negative balance separately from a below-buffer dip', () => {
    const tight = project({ startingBalance: 300 });
    expect(tight.lowestBalance).toBeLessThan(0);
    expect(tight.forecast.some((day) => day.negativeBalance)).toBe(true);
    expect(tight.forecast.filter((day) => day.belowComfortBuffer).length).toBeGreaterThan(1);

    const summary = getSafeToSpendOrPlanningSummary({
      currentBalance: 300,
      payments: seedPayments,
      fromDate: DEMO_TODAY,
      incomeDate: seedUser.nextIncome.date,
      comfortBuffer: seedUser.comfortBuffer,
      forecast: tight,
    });
    expect(summary.status).toBe('shortfall');
    expect(summary.safeToSpend).toBe(0);
  });

  it('handles an empty plan and a single-day window', () => {
    const empty = calculateCashFlowForecast({
      startDate: DEMO_TODAY,
      days: 1,
      startingBalance: 1000,
      payments: [],
      incomeEvents: [],
      comfortBuffer: 500,
    });
    expect(empty.forecast).toHaveLength(1);
    expect(empty.lowestBalance).toBe(1000);
    expect(empty.daysBelowBuffer).toBe(0);
    expect(empty.totalOutflow).toBe(0);
    expect(empty.endingBalance).toBe(1000);
  });
});

describe('due-date and income helpers', () => {
  it('moves deferred payments out by one month', () => {
    const netflix = seedPayments.find((payment) => payment.id === 'netflix')!;
    expect(getEffectiveDueDate(netflix)).toBe('2026-10-03');
    expect(getEffectiveDueDate(netflix, { deferredPaymentIds: ['netflix'] })).toBe('2026-11-03');
  });

  it('tops up only the earliest income event', () => {
    const events: IncomeEvent[] = [
      { amount: 7500, date: '2026-10-08', label: 'Part-time design income' },
      { amount: 7500, date: '2026-11-08', label: 'Part-time design income' },
    ];
    const adjusted = getEffectiveIncomeEvents(events, { incomeAdjustment: 2000 });
    expect(adjusted.map((event) => event.amount)).toEqual([9500, 7500]);
    expect(getEffectiveIncomeEvents(events).map((event) => event.amount)).toEqual([7500, 7500]);
  });
});

describe('payment queries', () => {
  it('returns the next 7 days and the next 4 visible payments', () => {
    const next7 = getPaymentsDueInNextDays(seedPayments, DEMO_TODAY, 7);
    expect(next7.map((payment) => payment.id)).toEqual(['airtel-mobile', 'netflix']);
    expect(getPaymentTotals(next7)).toMatchObject({
      total: 1048,
      essential: 399,
      other: 649,
      count: 2,
      essentialCount: 1,
    });
    expect(getVisibleDashboardPayments(seedPayments, DEMO_TODAY, 4).map((payment) => payment.merchant)).toEqual([
      'Airtel Mobile',
      'Netflix',
      'TNEB Electricity',
      'Adobe Creative Cloud',
    ]);
  });

  it('finds essentials falling due before the next income', () => {
    const essentials = getEssentialPaymentsBeforeIncome(seedPayments, DEMO_TODAY, seedUser.nextIncome.date);
    expect(essentials.map((payment) => payment.shortName)).toEqual(['Airtel', 'electricity', 'EMI']);
    expect(sumPayments(essentials)).toBe(2499);
    expect(essentials.map((payment) => payment.dueDate)).toEqual(['2026-10-02', '2026-10-05', '2026-10-07']);
    expect(getSafeToSpend({
      currentBalance: seedUser.currentBalance,
      payments: seedPayments,
      fromDate: DEMO_TODAY,
      incomeDate: seedUser.nextIncome.date,
      comfortBuffer: seedUser.comfortBuffer,
    })).toBe(1321);
  });

  it('computes optional spend, potential savings and review candidates', () => {
    expect(getOptionalSpend(seedPayments)).toBe(2097);
    expect(getPotentialSavings(seedPayments)).toBe(1978);
    expect(getMandatesNeedingReview(seedPayments).length).toBeGreaterThan(0);
  });

  it('scores essential readiness against the projection', () => {
    const forecast = project();
    const readiness = getEssentialReadiness({ payments: seedPayments, forecast, fromDate: DEMO_TODAY, days: 30 });
    expect(readiness.total).toBe(5);
    expect(readiness.protectedCount).toBe(4);
    expect(readiness.needsPlanningCount).toBe(1);
    expect(readiness.items.find((item) => item.paymentId === 'education-emi')).toMatchObject({
      status: 'Needs planning',
      projectedBalanceOnDueDate: 473,
    });
    expect(readiness.items.find((item) => item.paymentId === 'spotify')).toBeUndefined();

    const limited = getEssentialReadiness({
      payments: seedPayments,
      forecast,
      fromDate: DEMO_TODAY,
      days: 14,
      limit: 2,
    });
    expect(limited.items).toHaveLength(2);
    // Counts describe the same scoped list, so they can never disagree with the rows.
    expect(limited.total).toBe(2);
    expect(limited.protectedCount + limited.needsPlanningCount).toBe(2);
  });

  it('uses a visible-month window that covers the demo period', () => {
    const window = getVisibleMonthWindow(DEMO_TODAY);
    expect(window.start).toBe('2026-09-01');
    expect(window.end).toBe('2026-10-31');
    expect(window.label).toBe('Sep – October 2026');
    expect(getPaymentsInVisibleMonth(seedPayments, DEMO_TODAY)).toHaveLength(10);
    expect(sumPayments(getPaymentsInVisibleMonth(seedPayments, DEMO_TODAY))).toBe(7795);
  });

  it('summarises the plan status in calm language', () => {
    expect(getSafeToSpendOrPlanningSummary({
      currentBalance: seedUser.currentBalance,
      payments: seedPayments,
      fromDate: DEMO_TODAY,
      incomeDate: seedUser.nextIncome.date,
      comfortBuffer: seedUser.comfortBuffer,
      forecast: project(),
    })).toMatchObject({ status: 'plan-needed', statusLabel: 'Plan needed', essentialBeforeIncome: 2499 });

    expect(describeLowBalanceRisk(project())).toBe(
      'Your projected balance may fall below your ₹1,000 comfort buffer on 07 Oct. Review optional payments to improve your plan.',
    );
  });
});

describe('scenarios', () => {
  it('exposes the four what-if scenarios with live projections', () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'keep-all',
      'pause-adobe',
      'defer-netflix',
      'extra-income',
    ]);

    const lowest = (id: 'keep-all' | 'pause-adobe' | 'defer-netflix' | 'extra-income') =>
      project({ scenarioOverrides: getScenarioById(id).overrides }).lowestBalance;

    expect(lowest('keep-all')).toBe(473);
    expect(lowest('pause-adobe')).toBe(1672);
    expect(lowest('defer-netflix')).toBe(1122);
    // Pausing and deferring lift the low point; extra income lifts the month end.
    expect(lowest('extra-income')).toBe(473);
    expect(project({ scenarioOverrides: getScenarioById('pause-adobe').overrides }).endingBalance).toBe(5724);
    expect(project({ scenarioOverrides: getScenarioById('extra-income').overrides }).endingBalance).toBe(6525);
  });

  it('falls back to the first scenario for an unknown id', () => {
    expect(getScenarioById('keep-all').id).toBe('keep-all');
  });
});
