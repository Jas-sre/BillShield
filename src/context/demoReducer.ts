import type {
  AccessibilityPreferences,
  ActivityItem,
  AppNotification,
  DemoState,
  IncomeEvent,
  Language,
  NotificationPreferences,
  Payment,
  Priority,
  ScenarioId,
  Theme,
  UserProfile,
} from '../types';
import { resetDemoData } from '../utils/storage';

/**
 * The BillShield demo store reducer.
 *
 * Kept in its own module (no React imports) so it can be unit tested directly —
 * see src/context/demoReducer.test.ts.
 */

export type DemoAction =
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'UPDATE_PAYMENT'; id: string; patch: Partial<Payment> }
  | { type: 'SET_PRIORITY'; id: string; priority: Priority }
  | { type: 'PAUSE_PAYMENT'; id: string }
  | { type: 'RESUME_PAYMENT'; id: string }
  | { type: 'TOGGLE_REMINDER'; id: string }
  | { type: 'SET_HIDDEN'; id: string; hidden: boolean }
  | { type: 'UPDATE_USER'; patch: Partial<UserProfile> }
  | { type: 'UPDATE_INCOME'; patch: Partial<IncomeEvent> }
  | { type: 'SET_SCENARIO'; id: ScenarioId }
  | { type: 'SET_SAVINGS_TARGET'; value: number }
  | { type: 'READ_NOTIFICATION'; id: string }
  | { type: 'READ_ALL_NOTIFICATIONS' }
  | { type: 'ADD_NOTIFICATION'; notification: AppNotification }
  | { type: 'SET_NOTIFICATION_PREF'; key: keyof NotificationPreferences; value: boolean }
  | { type: 'SET_ACCESSIBILITY_PREF'; key: keyof AccessibilityPreferences; value: boolean }
  | { type: 'ADD_ACTIVITY'; item: ActivityItem }
  | { type: 'RESET'; includeOnboarding: boolean };

const MAX_ACTIVITY_ITEMS = 8;

function withPayment(state: DemoState, id: string, patch: Partial<Payment>): DemoState {
  return {
    ...state,
    payments: state.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)),
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };

    case 'SET_LANGUAGE':
      return { ...state, language: action.language, user: { ...state.user, language: action.language } };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'UPDATE_PAYMENT':
      return withPayment(state, action.id, action.patch);

    case 'SET_PRIORITY':
      return withPayment(state, action.id, { priority: action.priority });

    case 'PAUSE_PAYMENT':
      return withPayment(state, action.id, { status: 'Paused in plan' });

    case 'RESUME_PAYMENT':
      return withPayment(state, action.id, { status: 'Active' });

    case 'TOGGLE_REMINDER':
      return withPayment(state, action.id, {
        reminderEnabled: !state.payments.find((payment) => payment.id === action.id)?.reminderEnabled,
      });

    case 'SET_HIDDEN':
      return withPayment(state, action.id, { hiddenFromDashboard: action.hidden });

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.patch } };

    case 'UPDATE_INCOME':
      return { ...state, user: { ...state.user, nextIncome: { ...state.user.nextIncome, ...action.patch } } };

    case 'SET_SCENARIO':
      return { ...state, scenarioId: action.id };

    case 'SET_SAVINGS_TARGET':
      return { ...state, savingsTarget: action.value };

    case 'READ_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.id ? { ...notification, read: true } : notification,
        ),
      };

    case 'READ_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
      };

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.notification, ...state.notifications] };

    case 'SET_NOTIFICATION_PREF':
      return {
        ...state,
        notificationPreferences: { ...state.notificationPreferences, [action.key]: action.value },
      };

    case 'SET_ACCESSIBILITY_PREF':
      return {
        ...state,
        accessibility: { ...state.accessibility, [action.key]: action.value },
      };

    case 'ADD_ACTIVITY':
      return { ...state, activity: [action.item, ...state.activity].slice(0, MAX_ACTIVITY_ITEMS) };

    case 'RESET': {
      // Reset always restores the seed data; the caller decides whether the
      // welcome screen should be shown again.
      const fresh = resetDemoData();
      return action.includeOnboarding ? fresh : { ...fresh, onboardingComplete: true };
    }

    default:
      return state;
  }
}
