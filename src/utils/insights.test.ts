import { describe, expect, it } from 'vitest';
import { seedPayments, seedUser, DEMO_TODAY } from '../data/mockData';
import {
  calculateCashFlowForecast,
  getPaymentTotals,
  getPaymentsDueInNextDays,
  getOptionalSpend,
  getPotentialSavings,
  getScenarioById,
} from './forecast';
import {
  buildRecommendedPlan,
  calculateCategoryTotals,
  calculateGroupTotals,
  calculatePriorityTotals,
  generateInsights,
  getDashboardInsights,
  joinWithAnd,
  type InsightContext,
} from './insights';

const forecast = calculateCashFlowForecast({
  startDate: DEMO_TODAY,
  days: 30,
  startingBalance: seedUser.currentBalance,
  incomeEvents: [seedUser.nextIncome],
  payments: seedPayments,
  comfortBuffer: seedUser.comfortBuffer,
});

const scenario = getScenarioById('keep-all');

const context = (overrides: Partial<InsightContext> = {}): InsightContext => ({
  payments: seedPayments,
  today: DEMO_TODAY,
  user: seedUser,
  forecast,
  next7Totals: getPaymentTotals(getPaymentsDueInNextDays(seedPayments, DEMO_TODAY, 7)),
  optionalSpend: getOptionalSpend(seedPayments),
  potentialSavings: getPotentialSavings(seedPayments),
  pausedInPlanCount: 0,
  scenario,
  ...overrides,
});

const pausedAdobe = seedPayments.map((payment) =>
  payment.id === 'adobe-creative-cloud' ? { ...payment, status: 'Paused in plan' as const } : payment,
);

describe('joinWithAnd', () => {
  it('joins like natural English', () => {
    expect(joinWithAnd([])).toBe('');
    expect(joinWithAnd(['Airtel'])).toBe('Airtel');
    expect(joinWithAnd(['Airtel', 'electricity'])).toBe('Airtel and electricity');
    expect(joinWithAnd(['Airtel', 'electricity', 'EMI'])).toBe('Airtel, electricity, and EMI');
    expect(joinWithAnd(['a', 'b', 'c', 'd'])).toBe('a, b, and c');
  });
});

describe('generateInsights', () => {
  it('leads with the three headline dashboard cards', () => {
    const titles = getDashboardInsights(context()).map((insight) => insight.title);
    expect(titles).toEqual([
      'Adobe Creative Cloud is your highest optional payment: ₹1,199/month.',
      'Netflix has not been marked essential and renews soon.',
      'Keep ₹2,499 reserved for Airtel, electricity, and EMI payments.',
    ]);
  });

  it('generates dynamic cards for the lowest balance, grouped spend and essentials', () => {
    const titles = generateInsights(context()).map((insight) => insight.title);
    expect(titles).toContain('Your lowest projected balance is ₹473 on 07 Oct.');
    expect(titles).toContain('Netflix and Spotify together cost ₹768/month.');
    expect(titles).toContain('You have ₹2,097 in optional recurring spending this month.');
    expect(titles).toContain('Review subscriptions not marked essential.');
    expect(titles).toContain('Your electricity bill is due before your next income. Keep ₹1,250 aside.');
    expect(titles).toContain('Google One was last reviewed on 20 May.');
  });

  it('reacts to pausing Adobe in the plan', () => {
    const after = generateInsights(
      context({
        payments: pausedAdobe,
        pausedInPlanCount: 1,
        optionalSpend: getOptionalSpend(pausedAdobe),
      }),
    );
    const titles = after.map((insight) => insight.title);
    expect(titles[0]).toBe('Netflix is your highest optional payment: ₹649/month.');
    expect(titles).toContain('1 payment paused in your plan.');
    expect(titles.some((title) => title.includes('₹1,199/month'))).toBe(false);
  });

  it('marks each insight with a section and a safe action link', () => {
    const insights = generateInsights(context());
    expect(new Set(insights.map((insight) => insight.section)).size).toBeGreaterThan(3);
    for (const insight of insights) {
      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.body.length).toBeGreaterThan(0);
      expect(['info', 'good', 'attention', 'alert']).toContain(insight.tone);
      if (insight.actionTo) expect(insight.actionTo.startsWith('/')).toBe(true);
    }
  });

  it('never uses shaming or mandate-changing language', () => {
    const copy = generateInsights(context())
      .map((insight) => `${insight.title} ${insight.body}`)
      .join(' ')
      .toLowerCase();
    for (const banned of ['you cannot afford', 'danger', 'fraud', 'cancel now', 'paused your', 'cancelled your']) {
      expect(copy).not.toContain(banned);
    }
  });
});

describe('buildRecommendedPlan', () => {
  it('reserves essentials and suggests the review item', () => {
    const plan = buildRecommendedPlan({
      payments: seedPayments,
      today: DEMO_TODAY,
      incomeDate: seedUser.nextIncome.date,
      comfortBuffer: seedUser.comfortBuffer,
      forecast,
      reviewPayment: seedPayments.find((payment) => payment.id === 'adobe-creative-cloud')!,
      improvedLowest: 1672,
      scenario,
    });
    expect(plan).toBe(
      'Keep ₹2,499 reserved for Airtel, electricity, and EMI payments. Reviewing Adobe before 06 Oct could keep your balance above ₹1,000.',
    );
  });

  it('says nothing needs to change when the plan is comfortable', () => {
    const comfortable = calculateCashFlowForecast({
      startDate: DEMO_TODAY,
      days: 30,
      startingBalance: 20000,
      incomeEvents: [seedUser.nextIncome],
      payments: seedPayments,
      comfortBuffer: seedUser.comfortBuffer,
    });
    const plan = buildRecommendedPlan({
      payments: seedPayments,
      today: DEMO_TODAY,
      incomeDate: seedUser.nextIncome.date,
      comfortBuffer: seedUser.comfortBuffer,
      forecast: comfortable,
      reviewPayment: null,
      improvedLowest: null,
      scenario,
    });
    expect(plan).toContain('nothing needs to change right now');
    expect(plan).toContain('Keep ₹2,499 reserved');
  });
});

describe('chart totals', () => {
  it('aggregates by category, priority and group', () => {
    const categories = calculateCategoryTotals(seedPayments);
    expect(categories.reduce((sum, entry) => sum + entry.total, 0)).toBe(7795);
    expect(categories[0]).toMatchObject({ category: 'Bills', total: 2348, count: 3 });
    expect(categories.find((entry) => entry.category === 'Subscriptions')).toMatchObject({
      total: 2097,
      count: 4,
    });
    // Sorted by descending spend.
    expect(categories.map((entry) => entry.total)).toEqual([2348, 2097, 1500, 1000, 850]);

    const priorities = calculatePriorityTotals(seedPayments);
    expect(priorities.map((entry) => entry.priority)).toEqual(['Essential', 'Important', 'Optional']);
    expect(priorities.map((entry) => entry.total)).toEqual([4698, 1000, 2097]);

    const groups = calculateGroupTotals(seedPayments);
    expect(groups.find((entry) => entry.group === 'Entertainment')).toMatchObject({ total: 768, count: 2 });
  });
});
