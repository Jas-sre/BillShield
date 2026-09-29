import type {
  Category,
  ForecastResult,
  Insight,
  Payment,
  Priority,
  Scenario,
  SpendGroup,
  UserProfile,
} from '../types';
import { formatCurrencyINR } from './currency';
import { diffInDays, formatDateMedium, formatDateShort } from './dates';
import {
  getEssentialPaymentsBeforeIncome,
  getPaymentTotals,
  sumPayments,
  type PaymentTotals,
} from './forecast';

/**
 * Dynamic copy + insight generation.
 *
 * Every sentence below is derived from the seed data and the forecast result —
 * nothing is hard-coded in a component.
 */

export function joinWithAnd(items: string[], maxItems = 3): string {
  const filtered = items.filter((item) => item && item.trim().length > 0).slice(0, maxItems);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function uniqueShortNames(payments: Payment[]): string[] {
  const names: string[] = [];
  for (const payment of payments) {
    if (!names.includes(payment.shortName)) names.push(payment.shortName);
  }
  return names;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
}

export interface PriorityTotal {
  priority: Priority;
  total: number;
  count: number;
}

export interface GroupTotal {
  group: SpendGroup;
  total: number;
  count: number;
}

function totalsByCategory(payments: Payment[]): CategoryTotal[] {
  const map = new Map<Category, CategoryTotal>();
  for (const payment of payments) {
    const existing = map.get(payment.category) ?? { category: payment.category, total: 0, count: 0 };
    existing.total += payment.amount;
    existing.count += 1;
    map.set(payment.category, existing);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function calculateCategoryTotals(payments: Payment[]): CategoryTotal[] {
  return totalsByCategory(payments);
}

export function calculatePriorityTotals(payments: Payment[]): PriorityTotal[] {
  const order: Priority[] = ['Essential', 'Important', 'Optional'];
  const map = new Map<Priority, PriorityTotal>();
  for (const payment of payments) {
    const existing = map.get(payment.priority) ?? { priority: payment.priority, total: 0, count: 0 };
    existing.total += payment.amount;
    existing.count += 1;
    map.set(payment.priority, existing);
  }
  return order.map((priority) => map.get(priority) ?? { priority, total: 0, count: 0 });
}

export function calculateGroupTotals(payments: Payment[]): GroupTotal[] {
  const map = new Map<SpendGroup, GroupTotal>();
  for (const payment of payments) {
    const existing = map.get(payment.group) ?? { group: payment.group, total: 0, count: 0 };
    existing.total += payment.amount;
    existing.count += 1;
    map.set(payment.group, existing);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Word used in generated sentences: "electricity bill", "EMI payment". */
function essentialNoun(payment: Payment): string {
  switch (payment.category) {
    case 'Bills':
      return `${payment.shortName} bill`;
    case 'Insurance':
      return `${payment.shortName} premium`;
    case 'EMI':
      return `${payment.shortName} payment`;
    default:
      return `${payment.shortName} payment`;
  }
}

export interface InsightContext {
  payments: Payment[];
  today: string;
  user: UserProfile;
  /** 30-day projection */
  forecast: ForecastResult;
  /** Payments due inside the next 7 days (active only) */
  next7Totals: PaymentTotals;
  optionalSpend: number;
  potentialSavings: number;
  pausedInPlanCount: number;
  scenario: Scenario;
}

export function generateInsights(ctx: InsightContext): Insight[] {
  const { payments, today, user, forecast, next7Totals, optionalSpend, potentialSavings, scenario } = ctx;
  const insights: Insight[] = [];
  const featuredMerchantIds = new Set<string>();

  const activePayments = payments.filter((payment) => payment.status === 'Active');
  const activeOptional = activePayments.filter((payment) => payment.priority === 'Optional');

  // 1. Highest optional payment
  const highestOptional = [...activeOptional].sort((a, b) => b.amount - a.amount)[0];
  if (highestOptional) {
    featuredMerchantIds.add(highestOptional.id);
    insights.push({
      id: 'highest-optional',
      title: `${highestOptional.merchant} is your highest optional payment: ${formatCurrencyINR(
        highestOptional.amount,
      )}/month.`,
      body: `${highestOptional.description}. ${formatCurrencyINR(
        highestOptional.amount * 12,
      )} over a year if it stays active.`,
      tone: 'attention',
      icon: highestOptional.icon,
      section: 'savings',
      actionLabel: 'Review',
      actionTo: '/mandates',
    });
  }

  // 2. A review-flagged payment that renews soon
  const renewsSoon = activeOptional
    .filter((payment) => !featuredMerchantIds.has(payment.id) && payment.reviewRecommended)
    .filter((payment) => diffInDays(today, payment.dueDate) <= 14)
    .sort((a, b) => diffInDays(today, a.dueDate) - diffInDays(today, b.dueDate))[0];

  if (renewsSoon) {
    featuredMerchantIds.add(renewsSoon.id);
    insights.push({
      id: 'renews-soon',
      title: `${renewsSoon.merchant} has not been marked essential and renews soon.`,
      body: `${formatCurrencyINR(renewsSoon.amount)} is scheduled for ${formatDateShort(
        renewsSoon.dueDate,
      )}. Last opened or used about ${renewsSoon.usageDaysAgo} days ago.`,
      tone: 'attention',
      icon: renewsSoon.icon,
      section: 'hygiene',
      actionLabel: 'See impact',
      actionTo: '/cash-flow',
    });
  }

  // 3. Essentials to keep reserved before the next income
  const essentialsBeforeIncome = getEssentialPaymentsBeforeIncome(payments, today, user.nextIncome.date);
  if (essentialsBeforeIncome.length > 0) {
    const reserve = sumPayments(essentialsBeforeIncome);
    insights.push({
      id: 'essential-reserve',
      title: `Keep ${formatCurrencyINR(reserve)} reserved for ${joinWithAnd(
        uniqueShortNames(essentialsBeforeIncome),
      )} payments.`,
      body: `These essentials are scheduled before your next income on ${formatDateShort(
        user.nextIncome.date,
      )}. BillShield never moves or reserves money — this is planning only.`,
      tone: 'info',
      icon: 'zap',
      section: 'essential',
      actionLabel: 'Plan now',
      actionTo: '/cash-flow',
    });
  }

  // 4. Lowest projected balance
  insights.push({
    id: 'lowest-balance',
    title: `Your lowest projected balance is ${formatCurrencyINR(
      forecast.lowestBalance,
    )} on ${formatDateShort(forecast.lowestBalanceDate)}.`,
    body:
      forecast.daysBelowBuffer > 0
        ? `That is ${formatCurrencyINR(
            Math.max(0, forecast.comfortBuffer - forecast.lowestBalance),
          )} below your comfort buffer across ${forecast.daysBelowBuffer} day${
            forecast.daysBelowBuffer === 1 ? '' : 's'
          }. This is a simulated estimate based on your demo data.`
        : `Your plan stays above your ${formatCurrencyINR(
            forecast.comfortBuffer,
          )} comfort buffer for the next ${forecast.days} days.`,
    tone: forecast.daysBelowBuffer > 0 ? 'alert' : 'good',
    icon: 'trending-up',
    section: 'pressure',
    actionLabel: 'See impact',
    actionTo: '/cash-flow',
  });

  // 5. Two subscriptions in the same group
  const groupedOptional = calculateGroupTotals(activeOptional).find(
    (entry) => entry.count >= 2 && entry.group !== 'Software',
  );
  if (groupedOptional) {
    const members = activeOptional.filter((payment) => payment.group === groupedOptional.group);
    insights.push({
      id: 'group-pair',
      title: `${joinWithAnd(members.map((payment) => payment.merchant), 2)} together cost ${formatCurrencyINR(
        groupedOptional.total,
      )}/month.`,
      body: `That is ${formatCurrencyINR(groupedOptional.total * 12)} a year across ${
        members.length
      } ${groupedOptional.group.toLowerCase()} subscriptions.`,
      tone: 'info',
      icon: members[0].icon,
      section: 'savings',
      actionLabel: 'Review',
      actionTo: '/mandates',
    });
  }

  // 6. Total optional recurring spend
  if (optionalSpend > 0) {
    insights.push({
      id: 'optional-spend',
      title: `You have ${formatCurrencyINR(optionalSpend)} in optional recurring spending this month.`,
      body:
        potentialSavings > 0
          ? `${formatCurrencyINR(
              potentialSavings,
            )} of that is flagged for review. Pausing it in your plan is a demo action only.`
          : 'Reviewing these subscriptions before they renew can keep your plan comfortable.',
      tone: 'info',
      icon: 'palette',
      section: 'savings',
      actionLabel: 'Review',
      actionTo: '/insights',
    });
  }

  // 7. Subscriptions not marked essential
  const nonEssentialSubscriptions = activePayments.filter(
    (payment) => payment.category === 'Subscriptions' && payment.priority !== 'Essential',
  );
  if (nonEssentialSubscriptions.length > 0) {
    insights.push({
      id: 'not-essential',
      title: 'Review subscriptions not marked essential.',
      body: `${nonEssentialSubscriptions.length} subscriptions totalling ${formatCurrencyINR(
        sumPayments(nonEssentialSubscriptions),
      )} are active in your plan this month.`,
      tone: 'attention',
      icon: 'monitor-play',
      section: 'hygiene',
      actionLabel: 'Review',
      actionTo: '/mandates',
    });
  }

  // 8. One "keep this aside" card per essential category due before the income
  const seenCategories = new Set<Category>();
  for (const payment of [...essentialsBeforeIncome].sort((a, b) => b.amount - a.amount)) {
    if (seenCategories.has(payment.category)) continue;
    seenCategories.add(payment.category);
    insights.push({
      id: `aside-${payment.id}`,
      title: `Your ${essentialNoun(payment)} is due before your next income. Keep ${formatCurrencyINR(
        payment.amount,
      )} aside.`,
      body: `Scheduled for ${formatDateMedium(payment.dueDate)} — ${diffInDays(
        today,
        payment.dueDate,
      )} days from today, ${formatDateMedium(user.nextIncome.date)} being your next income.`,
      tone: 'info',
      icon: payment.icon,
      section: 'essential',
      actionLabel: 'Plan now',
      actionTo: '/cash-flow',
    });
  }

  // 9. Mandate review reminders
  const staleReview = activePayments
    .filter((payment) => payment.reviewRecommended && !featuredMerchantIds.has(payment.id))
    .sort((a, b) => diffInDays(b.lastReviewed, today) - diffInDays(a.lastReviewed, today))[0];

  if (staleReview) {
    insights.push({
      id: 'stale-review',
      title: `${staleReview.merchant} was last reviewed on ${formatDateShort(staleReview.lastReviewed)}.`,
      body: `Its next scheduled debit is ${formatDateMedium(
        staleReview.dueDate,
      )}. You can re-open the mandate in your UPI app or bank to change it for real.`,
      tone: 'info',
      icon: staleReview.icon,
      section: 'review',
      actionLabel: 'Review',
      actionTo: '/mandates',
    });
  }

  // 10. Anything paused in the plan
  if (ctx.pausedInPlanCount > 0) {
    insights.push({
      id: 'paused-in-plan',
      title: `${ctx.pausedInPlanCount} payment${ctx.pausedInPlanCount === 1 ? '' : 's'} paused in your plan.`,
      body: `${scenario.title} is selected. This changes only your BillShield plan — manage the actual mandate in your UPI app or bank.`,
      tone: 'info',
      icon: 'wifi',
      section: 'review',
      actionLabel: 'See impact',
      actionTo: '/cash-flow',
    });
  }

  return insights;
}

/** The three headline insight cards on the dashboard. */
export function getDashboardInsights(ctx: InsightContext): Insight[] {
  return generateInsights(ctx).slice(0, 3);
}

export interface RecommendedPlanInput {
  payments: Payment[];
  today: string;
  incomeDate: string;
  comfortBuffer: number;
  forecast: ForecastResult;
  /** Highest optional review item that is still active */
  reviewPayment: Payment | null;
  /** Lowest balance if that item were paused in the plan */
  improvedLowest: number | null;
  scenario: Scenario;
}

export function buildRecommendedPlan(input: RecommendedPlanInput): string {
  const { payments, today, incomeDate, comfortBuffer, forecast, reviewPayment, improvedLowest, scenario } = input;

  const essentials = getEssentialPaymentsBeforeIncome(payments, today, incomeDate);
  const reserveSentence =
    essentials.length > 0
      ? `Keep ${formatCurrencyINR(getPaymentTotals(essentials).total)} reserved for ${joinWithAnd(
          uniqueShortNames(essentials),
        )} payments.`
      : '';

  if (forecast.daysBelowBuffer === 0) {
    return `${reserveSentence} Your plan stays above your ${formatCurrencyINR(
      comfortBuffer,
    )} comfort buffer for the next ${forecast.days} days, so nothing needs to change right now.`;
  }

  if (reviewPayment && improvedLowest !== null && improvedLowest > forecast.lowestBalance) {
    const improvement =
      improvedLowest >= comfortBuffer
        ? `could keep your balance above ${formatCurrencyINR(comfortBuffer)}`
        : `could improve your lowest projected balance to ${formatCurrencyINR(improvedLowest)}`;
    return `${reserveSentence} Reviewing ${reviewPayment.shortName} before ${formatDateShort(
      reviewPayment.dueDate,
    )} ${improvement}.`;
  }

  return `${reserveSentence} Your lowest projected balance is ${formatCurrencyINR(
    forecast.lowestBalance,
  )} on ${formatDateShort(
    forecast.lowestBalanceDate,
  )}, below your ${formatCurrencyINR(comfortBuffer)} comfort buffer. Reviewing optional payments before ${formatDateShort(
    forecast.firstBelowBufferDate ?? forecast.lowestBalanceDate,
  )} would improve your plan.`;
}

/** Copy for the current what-if scenario. */
export function describeScenario(scenario: Scenario, forecast: ForecastResult): string {
  if (scenario.id === 'keep-all') {
    return `Every active payment stays in the plan. Lowest projected balance: ${formatCurrencyINR(
      forecast.lowestBalance,
    )} on ${formatDateShort(forecast.lowestBalanceDate)}.`;
  }
  return `${scenario.description} Lowest projected balance: ${formatCurrencyINR(
    forecast.lowestBalance,
  )} on ${formatDateShort(forecast.lowestBalanceDate)}.`;
}
