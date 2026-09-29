import type { DemoState } from '../types';
import { createInitialDemoState, seedPayments, STATE_VERSION } from '../data/mockData';

/**
 * Demo-state persistence.
 * localStorage only — nothing ever leaves the browser.
 */

export const STORAGE_KEY = 'billshield.demo-state.v1';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const probe = `${STORAGE_KEY}.probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the persisted demo state. Returns null when nothing valid is stored so
 * the provider can fall back to the seed data.
 */
export function loadDemoState(): DemoState | null {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== STATE_VERSION) {
      // Unknown/old shape — fall back to seed so the demo never breaks.
      return null;
    }
    return mergeWithSeed(parsed).state;
  } catch {
    return null;
  }
}

/** Merges a stored state onto the seed so new seed fields always exist. */
function mergeWithSeed(stored: Partial<DemoState>): { state: DemoState } {
  const seed = createInitialDemoState();

  const paymentsById = new Map(seedPayments.map((payment) => [payment.id, payment]));
  const storedPayments = Array.isArray(stored.payments) ? stored.payments : [];

  const payments = storedPayments
    .filter((payment) => payment && paymentsById.has(payment.id))
    .map((payment) => ({ ...paymentsById.get(payment.id)!, ...payment }));

  // Any seed payment missing from storage is restored.
  for (const seedPayment of seedPayments) {
    if (!payments.some((payment) => payment.id === seedPayment.id)) {
      payments.push({ ...seedPayment });
    }
  }

  return {
    state: {
      ...seed,
      ...stored,
      version: STATE_VERSION,
      user: { ...seed.user, ...(stored.user ?? {}) },
      payments,
      notifications: Array.isArray(stored.notifications) ? stored.notifications : seed.notifications,
      activity: Array.isArray(stored.activity) ? stored.activity : seed.activity,
      notificationPreferences: {
        ...seed.notificationPreferences,
        ...(stored.notificationPreferences ?? {}),
      },
      accessibility: { ...seed.accessibility, ...(stored.accessibility ?? {}) },
    },
  };
}

export function saveDemoState(state: DemoState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) — the demo keeps working in memory.
  }
}

export function clearDemoState(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Factory for a clean demo state: seed payments, ₹4,820 balance, ₹7,500 income
 * on 08 Oct 2026, English UI, nothing paused, hidden, or reminded.
 */
export function resetDemoData(): DemoState {
  clearDemoState();
  const fresh = createInitialDemoState();
  saveDemoState(fresh);
  return fresh;
}
