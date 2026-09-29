/**
 * BillShield domain types.
 * Everything in the demo is simulated and local — no real payment, mandate or
 * account data is ever represented by these types.
 */

export type Priority = 'Essential' | 'Important' | 'Optional';

/** "Paused in plan" only ever affects the BillShield plan, never a real mandate. */
export type PaymentStatus = 'Active' | 'Paused in plan';

export type Category = 'Bills' | 'Subscriptions' | 'EMI' | 'Insurance' | 'Investments';

export type Frequency = 'Monthly' | 'Quarterly' | 'Yearly';

/** Coarse grouping used for "these two together cost ₹X/month" style insights. */
export type SpendGroup =
  | 'Entertainment'
  | 'Software'
  | 'Storage'
  | 'Utilities'
  | 'Finance'
  | 'Connectivity'
  | 'Health';

export type Language = 'en' | 'ta';

/** Light is the default; dark is an opt-in preference. */
export type Theme = 'light' | 'dark';

/** Abstract, neutral icon keys — never real brand logos. */
export type IconName =
  | 'smartphone'
  | 'monitor-play'
  | 'zap'
  | 'palette'
  | 'graduation-cap'
  | 'music'
  | 'heart-pulse'
  | 'trending-up'
  | 'cloud'
  | 'wifi';

export interface IncomeEvent {
  amount: number;
  /** ISO date string, e.g. 2026-10-08 */
  date: string;
  label: string;
}

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  city: string;
  state: string;
  age: number;
  language: Language;
  currentBalance: number;
  comfortBuffer: number;
  nextIncome: IncomeEvent;
}

export interface Payment {
  id: string;
  merchant: string;
  /** Short, human-friendly name used inside generated copy, e.g. "electricity" */
  shortName: string;
  /** Coarse spend grouping (Entertainment, Software, ...). */
  group: SpendGroup;
  amount: number;
  /** ISO date string of the next scheduled debit */
  dueDate: string;
  frequency: Frequency;
  category: Category;
  priority: Priority;
  status: PaymentStatus;
  /** ISO date string */
  lastReviewed: string;
  icon: IconName;
  color: string;
  description: string;
  usageDaysAgo: number;
  reviewRecommended: boolean;
  /** Hiding only affects dashboard widgets — never cash-flow or mandate data. */
  hiddenFromDashboard: boolean;
  reminderEnabled: boolean;
}

export type ForecastEventType = 'payment' | 'income';

export interface ForecastEvent {
  type: ForecastEventType;
  label: string;
  amount: number;
  paymentId?: string;
  category?: Category;
  priority?: Priority;
  /** True when the event was shifted by a what-if scenario. */
  simulated?: boolean;
}

export interface ForecastDay {
  date: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  events: ForecastEvent[];
  closingBalance: number;
  belowComfortBuffer: boolean;
  negativeBalance: boolean;
}

export interface ForecastScenarioOverrides {
  /** Payment ids that are paused inside the what-if scenario only. */
  pausePaymentIds?: string[];
  /** Payment ids whose next debit is moved out by one month. */
  deferredPaymentIds?: string[];
  /** Amount added to the next expected income. */
  incomeAdjustment?: number;
}

export interface ForecastInput {
  startDate: string;
  days: number;
  startingBalance: number;
  incomeEvents?: IncomeEvent[];
  payments?: Payment[];
  comfortBuffer?: number;
  scenarioOverrides?: ForecastScenarioOverrides;
}

export interface ForecastResult {
  startDate: string;
  days: number;
  startBalance: number;
  comfortBuffer: number;
  forecast: ForecastDay[];
  lowestBalance: number;
  lowestBalanceDate: string;
  daysBelowBuffer: number;
  firstBelowBufferDate: string | null;
  totalInflow: number;
  totalOutflow: number;
  endingBalance: number;
}

export type ScenarioId = 'keep-all' | 'pause-adobe' | 'defer-netflix' | 'extra-income';

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  icon: IconName;
  overrides: ForecastScenarioOverrides;
}

export type InsightTone = 'info' | 'good' | 'attention' | 'alert';

export type InsightSection = 'savings' | 'hygiene' | 'essential' | 'pressure' | 'review';

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
  icon: IconName;
  section: InsightSection;
  actionLabel?: string;
  actionTo?: string;
}

export type NotificationKind = 'essential' | 'low-balance' | 'review' | 'summary';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: NotificationKind;
}

export interface ActivityItem {
  id: string;
  text: string;
  date: string;
  icon: IconName;
}

export interface NotificationPreferences {
  essentialBills: boolean;
  lowBalance: boolean;
  subscriptionReview: boolean;
  weeklySummary: boolean;
}

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
}

/** The persisted demo state (localStorage only — never sent anywhere). */
export interface DemoState {
  version: number;
  onboardingComplete: boolean;
  user: UserProfile;
  payments: Payment[];
  notifications: AppNotification[];
  activity: ActivityItem[];
  language: Language;
  theme: Theme;
  scenarioId: ScenarioId;
  savingsTarget: number;
  notificationPreferences: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

export type ToastTone = 'info' | 'success' | 'warning';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

export type ModalKind = 'detail' | 'manage' | 'pause' | null;

export interface ModalState {
  kind: ModalKind;
  paymentId: string | null;
}

export interface EssentialReadinessItem {
  paymentId: string;
  merchant: string;
  amount: number;
  dueDate: string;
  status: 'Protected' | 'Needs planning';
  projectedBalanceOnDueDate: number;
}

export interface EssentialReadiness {
  items: EssentialReadinessItem[];
  protectedCount: number;
  needsPlanningCount: number;
  total: number;
}

export interface PlanningSummary {
  status: 'healthy' | 'plan-needed' | 'shortfall';
  statusLabel: string;
  safeToSpend: number;
  essentialBeforeIncome: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  daysBelowBuffer: number;
}
