import { useSyncExternalStore } from 'react';
import { GameScreen, GameMode, AIDifficulty, RaceResult, PlayerProfile, GameSettings } from '../types/game';
import { SaveManager } from './saveManager';
import { VEHICLE_CONFIGS, getUpgradeCost } from '../game/vehicles/vehicleConfigs';
import { getCareerEventById } from '../game/career/careerEvents';
import { getTrackById } from '../game/tracks/trackConfigs';

export interface ActiveRaceConfig {
  trackId: string;
  carId: string;
  mode: GameMode;
  laps: number;
  aiDifficulty: AIDifficulty;
  careerEventId?: string;
  targetTime?: number;
  targetDriftScore?: number;
}

interface GameState {
  screen: GameScreen;
  profile: PlayerProfile;
  activeRaceConfig: ActiveRaceConfig;
  lastRaceResult: RaceResult | null;
  isPaused: boolean;
}

const initialProfile = SaveManager.load();

let state: GameState = {
  screen: 'MAIN_MENU',
  profile: initialProfile,
  activeRaceConfig: {
    trackId: 'neon-city',
    carId: initialProfile.selectedCarId,
    mode: 'QUICK_RACE',
    laps: 2,
    aiDifficulty: 'NORMAL',
  },
  lastRaceResult: null,
  isPaused: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export const gameStore = {
  getState(): GameState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setScreen(screen: GameScreen) {
    state = { ...state, screen };
    notify();
  },

  setPaused(isPaused: boolean) {
    state = { ...state, isPaused };
    notify();
  },

  selectCar(carId: string) {
    if (!state.profile.ownedCarIds.includes(carId)) return;
    const newProfile = {
      ...state.profile,
      selectedCarId: carId,
    };
    state = {
      ...state,
      profile: newProfile,
      activeRaceConfig: {
        ...state.activeRaceConfig,
        carId,
      }
    };
    SaveManager.save(newProfile);
    notify();
  },

  purchaseCar(carId: string): boolean {
    const carConfig = VEHICLE_CONFIGS.find(c => c.id === carId);
    if (!carConfig) return false;
    if (state.profile.ownedCarIds.includes(carId)) return false;
    if (state.profile.credits < carConfig.price) return false;

    const newCredits = state.profile.credits - carConfig.price;
    const newOwnedCars = [...state.profile.ownedCarIds, carId];
    const newCustomizations = {
      ...state.profile.carCustomizations,
      [carId]: {
        primaryColor: carConfig.primaryColor,
        stripeColor: carConfig.stripeColor,
        upgrades: {
          topSpeedLevel: 0,
          accelerationLevel: 0,
          handlingLevel: 0,
          nitroLevel: 0,
        }
      }
    };

    const newProfile: PlayerProfile = {
      ...state.profile,
      credits: newCredits,
      ownedCarIds: newOwnedCars,
      selectedCarId: carId,
      carCustomizations: newCustomizations,
    };

    state = {
      ...state,
      profile: newProfile,
      activeRaceConfig: {
        ...state.activeRaceConfig,
        carId,
      }
    };
    SaveManager.save(newProfile);
    notify();
    return true;
  },

  upgradeCar(carId: string, upgradeType: 'topSpeedLevel' | 'accelerationLevel' | 'handlingLevel' | 'nitroLevel'): boolean {
    if (!state.profile.ownedCarIds.includes(carId)) return false;
    const currentCustom = state.profile.carCustomizations[carId] || {
      primaryColor: '#ea580c',
      stripeColor: '#ffffff',
      upgrades: { topSpeedLevel: 0, accelerationLevel: 0, handlingLevel: 0, nitroLevel: 0 }
    };

    const currentLevel = currentCustom.upgrades[upgradeType] || 0;
    if (currentLevel >= 5) return false;

    const cost = getUpgradeCost(currentLevel);
    if (state.profile.credits < cost) return false;

    const newCredits = state.profile.credits - cost;
    const newUpgrades = {
      ...currentCustom.upgrades,
      [upgradeType]: currentLevel + 1,
    };

    const newProfile: PlayerProfile = {
      ...state.profile,
      credits: newCredits,
      carCustomizations: {
        ...state.profile.carCustomizations,
        [carId]: {
          ...currentCustom,
          upgrades: newUpgrades,
        }
      }
    };

    state = { ...state, profile: newProfile };
    SaveManager.save(newProfile);
    notify();
    return true;
  },

  customizeCar(carId: string, colors: { primaryColor?: string; stripeColor?: string }) {
    if (!state.profile.ownedCarIds.includes(carId)) return;
    const current = state.profile.carCustomizations[carId] || {
      primaryColor: '#ea580c',
      stripeColor: '#ffffff',
      upgrades: { topSpeedLevel: 0, accelerationLevel: 0, handlingLevel: 0, nitroLevel: 0 }
    };

    const newProfile: PlayerProfile = {
      ...state.profile,
      carCustomizations: {
        ...state.profile.carCustomizations,
        [carId]: {
          ...current,
          primaryColor: colors.primaryColor || current.primaryColor,
          stripeColor: colors.stripeColor || current.stripeColor,
        }
      }
    };

    state = { ...state, profile: newProfile };
    SaveManager.save(newProfile);
    notify();
  },

  startQuickRace(trackId: string, carId: string, difficulty: AIDifficulty, laps: number) {
    const track = getTrackById(trackId);
    state = {
      ...state,
      activeRaceConfig: {
        trackId: track.id,
        carId,
        mode: 'QUICK_RACE',
        laps,
        aiDifficulty: difficulty,
      },
      screen: 'RACING',
      isPaused: false,
    };
    notify();
  },

  startCareerEvent(eventId: string) {
    const event = getCareerEventById(eventId);
    if (!event) return;

    state = {
      ...state,
      activeRaceConfig: {
        trackId: event.trackId,
        carId: state.profile.selectedCarId,
        mode: event.mode,
        laps: event.laps,
        aiDifficulty: event.aiDifficulty,
        careerEventId: event.id,
        targetTime: event.targetTime,
        targetDriftScore: event.targetDriftScore,
      },
      screen: 'RACING',
      isPaused: false,
    };
    notify();
  },

  startTimeTrial(trackId: string, carId: string) {
    const track = getTrackById(trackId);
    state = {
      ...state,
      activeRaceConfig: {
        trackId: track.id,
        carId,
        mode: 'TIME_TRIAL',
        laps: 2,
        aiDifficulty: 'NORMAL',
      },
      screen: 'RACING',
      isPaused: false,
    };
    notify();
  },

  finishRace(result: RaceResult) {
    // Calculate new XP and level progression
    const totalXP = state.profile.xp + result.xpEarned;
    // Level progression formula: each level takes Level * 1000 XP
    let level = state.profile.level;
    let currentXpThreshold = level * 1000;
    while (totalXP >= currentXpThreshold) {
      level += 1;
      currentXpThreshold = level * 1000;
    }

    const newCredits = state.profile.credits + result.creditsEarned;
    const newWins = result.position === 1 ? state.profile.totalWins + 1 : state.profile.totalWins;
    const newRaces = state.profile.totalRaces + 1;

    // Track distance
    const track = getTrackById(result.trackId);
    const addedDistance = (track.lengthKm || 3.0) * (result.totalRacers > 0 ? 1 : 1);
    const newDistance = parseFloat((state.profile.totalDistanceKm + addedDistance).toFixed(2));

    // Best track time
    const currentBest = state.profile.bestTrackTimes[result.trackId] || 999999;
    const isNewBest = result.totalTime < currentBest;
    const updatedBestTimes = {
      ...state.profile.bestTrackTimes,
      [result.trackId]: Math.min(currentBest, result.totalTime)
    };

    // Career progress if applicable
    const updatedCareer = { ...state.profile.careerProgress };
    if (state.activeRaceConfig.careerEventId) {
      const eventId = state.activeRaceConfig.careerEventId;
      const prevStars = updatedCareer[eventId]?.stars || 0;
      updatedCareer[eventId] = {
        completed: true,
        stars: Math.max(prevStars, result.starsEarned),
        bestTime: Math.min(updatedCareer[eventId]?.bestTime || 999999, result.totalTime)
      };
    }

    const updatedProfile: PlayerProfile = {
      ...state.profile,
      level,
      xp: totalXP,
      credits: newCredits,
      totalRaces: newRaces,
      totalWins: newWins,
      totalDistanceKm: newDistance,
      bestTrackTimes: updatedBestTimes,
      careerProgress: updatedCareer,
    };

    const enrichedResult: RaceResult = {
      ...result,
      isNewBestTime: isNewBest,
    };

    state = {
      ...state,
      profile: updatedProfile,
      lastRaceResult: enrichedResult,
      screen: 'RESULTS',
      isPaused: false,
    };

    SaveManager.save(updatedProfile);
    notify();
  },

  updateSettings(settings: Partial<GameSettings>) {
    const newSettings: GameSettings = {
      ...state.profile.settings,
      ...settings,
    };

    const newProfile: PlayerProfile = {
      ...state.profile,
      settings: newSettings,
    };

    state = { ...state, profile: newProfile };
    SaveManager.save(newProfile);
    notify();
  },

  resetProgress() {
    const fresh = SaveManager.reset();
    state = {
      screen: 'MAIN_MENU',
      profile: fresh,
      activeRaceConfig: {
        trackId: 'neon-city',
        carId: fresh.selectedCarId,
        mode: 'QUICK_RACE',
        laps: 2,
        aiDifficulty: 'NORMAL',
      },
      lastRaceResult: null,
      isPaused: false,
    };
    notify();
  }
};

// React hook
export function useGameStore<T>(selector: (state: GameState) => T): T {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => selector(gameStore.getState())
  );
}

