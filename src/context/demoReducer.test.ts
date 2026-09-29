import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialDemoState, DEMO_TODAY } from '../data/mockData';
import type { DemoState } from '../types';
import {
  calculateCashFlowForecast,
  getActiveMandateCount,
  getOptionalSpend,
  getPausedInPlanCount,
  getPaymentsDueInNextDays,
  getPaymentTotals,
  getVisibleDashboardPayments,
} from '../utils/forecast';
import { demoReducer } from './demoReducer';

const project = (state: DemoState) =>
  calculateCashFlowForecast({
    startDate: DEMO_TODAY,
    days: 30,
    startingBalance: state.user.currentBalance,
    incomeEvents: [state.user.nextIncome],
    payments: state.payments,
    comfortBuffer: state.user.comfortBuffer,
  });

const findPayment = (state: DemoState, id: string) => state.payments.find((payment) => payment.id === id)!;

describe('demoReducer', () => {
  let state: DemoState;

  beforeEach(() => {
    state = createInitialDemoState();
  });

  it('starts from the demo seed', () => {
    expect(state.onboardingComplete).toBe(false);
    expect(state.language).toBe('en');
    expect(state.theme).toBe('light');
    expect(state.user.currentBalance).toBe(4820);
    expect(state.payments).toHaveLength(10);
    expect(project(state).lowestBalance).toBe(473);
  });

  it('handles onboarding, language and theme', () => {
    state = demoReducer(state, { type: 'COMPLETE_ONBOARDING' });
    expect(state.onboardingComplete).toBe(true);

    state = demoReducer(state, { type: 'SET_LANGUAGE', language: 'ta' });
    expect(state.language).toBe('ta');
    expect(state.user.language).toBe('ta');

    state = demoReducer(state, { type: 'SET_THEME', theme: 'dark' });
    expect(state.theme).toBe('dark');
  });

  it('pauses and resumes a payment inside the plan only', () => {
    state = demoReducer(state, { type: 'PAUSE_PAYMENT', id: 'adobe-creative-cloud' });
    expect(findPayment(state, 'adobe-creative-cloud').status).toBe('Paused in plan');
    expect(getActiveMandateCount(state.payments)).toBe(9);
    expect(getPausedInPlanCount(state.payments)).toBe(1);
    expect(getOptionalSpend(state.payments)).toBe(898);
    expect(project(state).lowestBalance).toBe(1672);

    state = demoReducer(state, { type: 'RESUME_PAYMENT', id: 'adobe-creative-cloud' });
    expect(findPayment(state, 'adobe-creative-cloud').status).toBe('Active');
    expect(project(state).lowestBalance).toBe(473);
  });

  it('does not mutate the previous state object', () => {
    const before = state;
    const after = demoReducer(state, { type: 'PAUSE_PAYMENT', id: 'netflix' });
    expect(after).not.toBe(before);
    expect(before.payments.find((payment) => payment.id === 'netflix')?.status).toBe('Active');
    expect(after.payments.find((payment) => payment.id === 'netflix')?.status).toBe('Paused in plan');
    expect(after.payments).not.toBe(before.payments);
  });

  it('re-prioritises payments and updates the essential totals', () => {
    expect(
      getPaymentTotals(getPaymentsDueInNextDays(state.payments, DEMO_TODAY, 7)).essential,
    ).toBe(399);

    state = demoReducer(state, { type: 'SET_PRIORITY', id: 'netflix', priority: 'Essential' });
    expect(findPayment(state, 'netflix').priority).toBe('Essential');
    expect(
      getPaymentTotals(getPaymentsDueInNextDays(state.payments, DEMO_TODAY, 7)).essential,
    ).toBe(1048);
  });

  it('toggles reminders', () => {
    state = demoReducer(state, { type: 'TOGGLE_REMINDER', id: 'wifi-bill' });
    expect(findPayment(state, 'wifi-bill').reminderEnabled).toBe(true);
    state = demoReducer(state, { type: 'TOGGLE_REMINDER', id: 'wifi-bill' });
    expect(findPayment(state, 'wifi-bill').reminderEnabled).toBe(false);
  });

  it('hides items from the dashboard without removing them from the plan', () => {
    state = demoReducer(state, { type: 'SET_HIDDEN', id: 'netflix', hidden: true });
    expect(findPayment(state, 'netflix').hiddenFromDashboard).toBe(true);
    expect(getVisibleDashboardPayments(state.payments, DEMO_TODAY, 4).some((p) => p.id === 'netflix')).toBe(false);
    // Still projected, still searchable.
    expect(project(state).lowestBalance).toBe(473);
    expect(state.payments.find((payment) => payment.id === 'netflix')?.merchant).toBe('Netflix');
  });

  it('edits balance, income and the comfort buffer', () => {
    state = demoReducer(state, { type: 'UPDATE_USER', patch: { currentBalance: 6000 } });
    expect(project(state).lowestBalance).toBe(1653);

    state = demoReducer(state, { type: 'UPDATE_INCOME', patch: { amount: 9500 } });
    expect(project(state).totalInflow).toBe(9500);

    // Moving the income later means the 09 Oct Spotify debit lands before it.
    state = demoReducer(state, { type: 'UPDATE_INCOME', patch: { date: '2026-10-12' } });
    expect(state.user.nextIncome.date).toBe('2026-10-12');
    expect(project(state).lowestBalance).toBe(1534);
    expect(project(state).lowestBalanceDate).toBe('2026-10-09');

    state = demoReducer(state, { type: 'UPDATE_USER', patch: { comfortBuffer: 300 } });
    expect(project(state).daysBelowBuffer).toBe(0);
  });

  it('tracks notification and accessibility preferences', () => {
    state = demoReducer(state, { type: 'SET_NOTIFICATION_PREF', key: 'weeklySummary', value: true });
    expect(state.notificationPreferences.weeklySummary).toBe(true);
    state = demoReducer(state, { type: 'SET_ACCESSIBILITY_PREF', key: 'reduceMotion', value: true });
    expect(state.accessibility.reduceMotion).toBe(true);
  });

  it('manages notifications read state', () => {
    expect(state.notifications.filter((notification) => !notification.read)).toHaveLength(3);

    state = demoReducer(state, { type: 'READ_NOTIFICATION', id: 'notif-low-balance' });
    expect(state.notifications.filter((notification) => notification.read)).toHaveLength(1);

    state = demoReducer(state, { type: 'READ_ALL_NOTIFICATIONS' });
    expect(state.notifications.every((notification) => notification.read)).toBe(true);
  });

  it('stores the selected scenario and savings target', () => {
    state = demoReducer(state, { type: 'SET_SCENARIO', id: 'defer-netflix' });
    expect(state.scenarioId).toBe('defer-netflix');
    state = demoReducer(state, { type: 'SET_SAVINGS_TARGET', value: 1200 });
    expect(state.savingsTarget).toBe(1200);
  });

  it('caps the local activity feed', () => {
    for (let index = 0; index < 12; index += 1) {
      state = demoReducer(state, {
        type: 'ADD_ACTIVITY',
        item: { id: `act-${index}`, text: `Activity ${index}`, date: DEMO_TODAY, icon: 'zap' },
      });
    }
    expect(state.activity).toHaveLength(8);
    expect(state.activity[0].text).toBe('Activity 11');
  });

  it('resets every persisted preference back to the seed', () => {
    state = demoReducer(state, { type: 'COMPLETE_ONBOARDING' });
    state = demoReducer(state, { type: 'SET_LANGUAGE', language: 'ta' });
    state = demoReducer(state, { type: 'SET_THEME', theme: 'dark' });
    state = demoReducer(state, { type: 'PAUSE_PAYMENT', id: 'adobe-creative-cloud' });
    state = demoReducer(state, { type: 'SET_HIDDEN', id: 'netflix', hidden: true });
    state = demoReducer(state, { type: 'TOGGLE_REMINDER', id: 'wifi-bill' });
    state = demoReducer(state, { type: 'UPDATE_USER', patch: { currentBalance: 100, comfortBuffer: 99 } });
    state = demoReducer(state, { type: 'READ_ALL_NOTIFICATIONS' });
    state = demoReducer(state, { type: 'SET_SCENARIO', id: 'extra-income' });

    const reset = demoReducer(state, { type: 'RESET', includeOnboarding: true });
    expect(reset).toMatchObject({
      onboardingComplete: false,
      language: 'en',
      theme: 'light',
      scenarioId: 'keep-all',
      savingsTarget: 0,
    });
    expect(reset.user.currentBalance).toBe(4820);
    expect(reset.user.comfortBuffer).toBe(1000);
    expect(reset.user.nextIncome).toMatchObject({ amount: 7500, date: '2026-10-08' });
    expect(reset.payments).toHaveLength(10);
    expect(reset.payments.filter((payment) => payment.status === 'Paused in plan')).toHaveLength(0);
    expect(reset.payments.filter((payment) => payment.hiddenFromDashboard)).toHaveLength(0);
    expect(reset.payments.filter((payment) => payment.reminderEnabled)).toHaveLength(0);
    expect(reset.notifications.filter((notification) => !notification.read)).toHaveLength(3);
    expect(project(reset).lowestBalance).toBe(473);
  });

  it('can reset while keeping the user inside the app', () => {
    const reset = demoReducer(state, { type: 'RESET', includeOnboarding: false });
    expect(reset.onboardingComplete).toBe(true);
  });

  it('ignores unknown actions', () => {
    const spy = vi.fn(demoReducer);
    const unchanged = spy(state, { type: 'NOPE' } as never);
    expect(unchanged).toBe(state);
  });
});
