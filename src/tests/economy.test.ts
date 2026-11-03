import { describe, it, expect, beforeEach } from 'vitest';
import { gameStore } from '../store/useGameStore';
import { VEHICLE_CONFIGS, calculateCarStats, getUpgradeCost } from '../game/vehicles/vehicleConfigs';

describe('Economy & Garage System', () => {
  beforeEach(() => {
    gameStore.resetProgress();
  });

  it('guarantees starting starter car is unlocked', () => {
    const profile = gameStore.getState().profile;
    expect(profile.ownedCarIds).toContain('apex-gt500');
    expect(profile.selectedCarId).toBe('apex-gt500');
  });

  it('prevents purchasing an already owned car', () => {
    const result = gameStore.purchaseCar('apex-gt500');
    expect(result).toBe(false);
  });

  it('prevents purchasing a car without sufficient credits', () => {
    // Valkyrie costs $275,000, initial credits are $15,000
    const result = gameStore.purchaseCar('valkyrie-hx');
    expect(result).toBe(false);
  });

  it('correctly calculates upgraded car stats', () => {
    const baseStats = VEHICLE_CONFIGS[0].baseStats;
    const initialStats = calculateCarStats(baseStats, {
      topSpeedLevel: 0,
      accelerationLevel: 0,
      handlingLevel: 0,
      nitroLevel: 0,
    });

    const upgradedStats = calculateCarStats(baseStats, {
      topSpeedLevel: 3,
      accelerationLevel: 2,
      handlingLevel: 1,
      nitroLevel: 4,
    });

    expect(upgradedStats.topSpeed).toBeGreaterThan(initialStats.topSpeed);
    expect(upgradedStats.acceleration).toBeGreaterThan(initialStats.acceleration);
    expect(upgradedStats.handling).toBeGreaterThan(initialStats.handling);
    expect(upgradedStats.nitro).toBeGreaterThan(initialStats.nitro);
  });

  it('upgrades vehicle performance when player has sufficient credits', () => {
    const initialCredits = gameStore.getState().profile.credits;
    const upgradeCost = getUpgradeCost(0); // Level 1 costs $3,000
    
    expect(initialCredits).toBeGreaterThanOrEqual(upgradeCost);

    const success = gameStore.upgradeCar('apex-gt500', 'topSpeedLevel');
    expect(success).toBe(true);

    const updatedProfile = gameStore.getState().profile;
    expect(updatedProfile.credits).toBe(initialCredits - upgradeCost);
    expect(updatedProfile.carCustomizations['apex-gt500'].upgrades.topSpeedLevel).toBe(1);
  });

  it('awards credits and XP upon race finish', () => {
    const beforeCredits = gameStore.getState().profile.credits;
    const beforeXP = gameStore.getState().profile.xp;

    gameStore.finishRace({
      trackId: 'neon-city',
      trackName: 'Neon City Circuit',
      carId: 'apex-gt500',
      carName: 'Apex GT-500',
      mode: 'QUICK_RACE',
      position: 1,
      totalRacers: 5,
      totalTime: 92.4,
      bestLapTime: 45.1,
      topSpeedReached: 245,
      driftScore: 1200,
      nitroUsedCount: 3,
      starsEarned: 3,
      creditsEarned: 13500,
      xpEarned: 1100,
      isNewBestTime: true,
      completedAt: Date.now(),
    });

    const after = gameStore.getState().profile;
    expect(after.credits).toBe(beforeCredits + 13500);
    expect(after.xp).toBe(beforeXP + 1100);
    expect(after.totalWins).toBe(1);
    expect(after.totalRaces).toBe(1);
  });
});
