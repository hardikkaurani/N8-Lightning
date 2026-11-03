import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, INITIAL_PROFILE } from '../store/saveManager';

describe('SaveManager Persistence', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
      length: 0,
    };
  });

  it('loads default profile when storage is empty', () => {
    const profile = SaveManager.load();
    expect(profile.username).toBe(INITIAL_PROFILE.username);
    expect(profile.level).toBe(1);
    expect(profile.ownedCarIds).toContain('apex-gt500');
  });

  it('persists and reloads profile successfully', () => {
    const modified = {
      ...INITIAL_PROFILE,
      credits: 50000,
      totalWins: 7,
      ownedCarIds: ['apex-gt500', 'venom-cr'],
    };

    const saved = SaveManager.save(modified);
    expect(saved).toBe(true);

    const loaded = SaveManager.load();
    expect(loaded.credits).toBe(50000);
    expect(loaded.totalWins).toBe(7);
    expect(loaded.ownedCarIds).toContain('venom-cr');
  });

  it('handles corrupted JSON safely without crashing', () => {
    localStorage.setItem('n8_lightning_save_v1', 'INVALID_CORRUPTED_JSON_{{{{');
    const profile = SaveManager.load();
    expect(profile.username).toBe(INITIAL_PROFILE.username);
    expect(profile.ownedCarIds).toContain('apex-gt500');
  });

  it('normalizes negative or invalid numerical values', () => {
    const malformed = {
      version: 1,
      data: {
        username: 'Test',
        credits: -99999,
        level: -5,
        totalRaces: -1,
        ownedCarIds: [],
      },
      timestamp: Date.now()
    };

    localStorage.setItem('n8_lightning_save_v1', JSON.stringify(malformed));
    const profile = SaveManager.load();

    expect(profile.credits).toBe(0);
    expect(profile.level).toBe(1);
    expect(profile.totalRaces).toBe(0);
    expect(profile.ownedCarIds).toContain('apex-gt500');
  });
});
