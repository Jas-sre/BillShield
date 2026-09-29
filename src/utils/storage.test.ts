import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createInitialDemoState, DEMO_TODAY } from '../data/mockData';
import {
  STORAGE_KEY,
  clearDemoState,
  isStorageAvailable,
  loadDemoState,
  resetDemoData,
  saveDemoState,
} from './storage';

/** Minimal in-memory Storage implementation for the node test environment. */
class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  getItem(key: string): string | null {
    return this.entries.has(key) ? this.entries.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, String(value));
  }
}

class BlockedStorage extends MemoryStorage {
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

const globalWithWindow = globalThis as unknown as { window?: unknown };

const installStorage = (storage: Storage) => {
  globalWithWindow.window = { localStorage: storage };
};

describe('demo state persistence', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installStorage(storage);
  });

  afterEach(() => {
    delete globalWithWindow.window;
  });

  it('uses a single documented storage key', () => {
    expect(STORAGE_KEY).toBe('billshield.demo-state.v1');
  });

  it('returns null when nothing is stored', () => {
    expect(loadDemoState()).toBeNull();
  });

  it('round-trips the demo state', () => {
    const state = createInitialDemoState();
    state.onboardingComplete = true;
    state.language = 'ta';
    state.theme = 'dark';
    state.user.currentBalance = 6100;
    state.payments = state.payments.map((payment) =>
      payment.id === 'adobe-creative-cloud' ? { ...payment, status: 'Paused in plan' } : payment,
    );

    saveDemoState(state);
    const restored = loadDemoState();

    expect(restored).not.toBeNull();
    expect(restored).toMatchObject({ onboardingComplete: true, language: 'ta', theme: 'dark' });
    expect(restored!.user.currentBalance).toBe(6100);
    expect(restored!.payments.find((payment) => payment.id === 'adobe-creative-cloud')?.status).toBe(
      'Paused in plan',
    );
  });

  it('ignores corrupt or outdated payloads', () => {
    storage.setItem(STORAGE_KEY, 'not-json');
    expect(loadDemoState()).toBeNull();

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, onboardingComplete: true }));
    expect(loadDemoState()).toBeNull();
  });

  it('heals a partial payload by merging it onto the seed', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, onboardingComplete: true, payments: [{ id: 'netflix', amount: 999 }] }),
    );

    const restored = loadDemoState();
    expect(restored).not.toBeNull();
    expect(restored!.payments).toHaveLength(10);
    expect(restored!.payments.find((payment) => payment.id === 'netflix')).toMatchObject({
      amount: 999,
      merchant: 'Netflix',
      category: 'Subscriptions',
    });
    // Seed defaults fill any field the stored payload did not carry.
    expect(restored!.theme).toBe('light');
    expect(restored!.user.comfortBuffer).toBe(1000);
  });

  it('resetDemoData restores the seed and rewrites storage', () => {
    const dirty = createInitialDemoState();
    dirty.user.currentBalance = 100;
    dirty.payments = dirty.payments.map((payment) => ({ ...payment, hiddenFromDashboard: true }));
    saveDemoState(dirty);

    const fresh = resetDemoData();
    expect(fresh.user.currentBalance).toBe(4820);
    expect(fresh.payments.filter((payment) => payment.hiddenFromDashboard)).toHaveLength(0);
    expect(fresh.theme).toBe('light');
    expect(fresh.language).toBe('en');
    expect(fresh.user.nextIncome).toMatchObject({ amount: 7500, date: '2026-10-08' });

    const reloaded = loadDemoState();
    expect(reloaded?.user.currentBalance).toBe(4820);
  });

  it('clearDemoState removes the key without touching anything else', () => {
    storage.setItem('unrelated', 'keep-me');
    saveDemoState(createInitialDemoState());
    clearDemoState();

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem('unrelated')).toBe('keep-me');
  });

  it('degrades gracefully when storage is unavailable or blocked', () => {
    delete globalWithWindow.window;
    expect(isStorageAvailable()).toBe(false);
    expect(loadDemoState()).toBeNull();
    expect(() => saveDemoState(createInitialDemoState())).not.toThrow();
    expect(() => clearDemoState()).not.toThrow();

    installStorage(new BlockedStorage());
    expect(isStorageAvailable()).toBe(false);
    expect(() => saveDemoState(createInitialDemoState())).not.toThrow();
  });

  it('reports availability when storage works', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('keeps the demo date stable', () => {
    expect(DEMO_TODAY).toBe('2026-09-28');
  });
});
