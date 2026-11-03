import { PlayerProfile, GameSettings } from '../types/game';
import { VEHICLE_CONFIGS } from '../game/vehicles/vehicleConfigs';

const SAVE_KEY = 'n8_lightning_save_v1';
const CURRENT_SAVE_VERSION = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  graphics: 'HIGH',
  masterVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.7,
  steeringSensitivity: 1.0,
  cameraFov: 72,
  touchControls: false,
  reducedMotion: false,
};

export const INITIAL_PROFILE: PlayerProfile = {
  username: 'LightningRacer',
  level: 1,
  xp: 0,
  credits: 15000, // Starter bonus credits to allow immediate first upgrade or quick tuning
  totalRaces: 0,
  totalWins: 0,
  totalDistanceKm: 0,
  ownedCarIds: ['apex-gt500'],
  selectedCarId: 'apex-gt500',
  carCustomizations: {
    'apex-gt500': {
      primaryColor: '#ea580c',
      stripeColor: '#f8fafc',
      upgrades: {
        topSpeedLevel: 0,
        accelerationLevel: 0,
        handlingLevel: 0,
        nitroLevel: 0,
      }
    }
  },
  careerProgress: {},
  bestTrackTimes: {},
  settings: DEFAULT_SETTINGS,
};

interface SerializedSave {
  version: number;
  data: PlayerProfile;
  timestamp: number;
}

export class SaveManager {
  public static load(): PlayerProfile {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...INITIAL_PROFILE };
      }

      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...INITIAL_PROFILE };
      }

      const parsed = JSON.parse(raw) as SerializedSave;
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        console.warn('[SaveManager] Malformed save payload, using default profile.');
        return { ...INITIAL_PROFILE };
      }

      // Safe normalization of loaded profile
      const data = parsed.data;
      const profile: PlayerProfile = {
        username: typeof data.username === 'string' && data.username.trim() ? data.username : INITIAL_PROFILE.username,
        level: Number.isFinite(data.level) && data.level >= 1 ? Math.floor(data.level) : 1,
        xp: Number.isFinite(data.xp) && data.xp >= 0 ? Math.floor(data.xp) : 0,
        credits: Number.isFinite(data.credits) && data.credits >= 0 ? Math.floor(data.credits) : 0,
        totalRaces: Number.isFinite(data.totalRaces) && data.totalRaces >= 0 ? Math.floor(data.totalRaces) : 0,
        totalWins: Number.isFinite(data.totalWins) && data.totalWins >= 0 ? Math.floor(data.totalWins) : 0,
        totalDistanceKm: Number.isFinite(data.totalDistanceKm) && data.totalDistanceKm >= 0 ? parseFloat(data.totalDistanceKm.toFixed(2)) : 0,
        ownedCarIds: Array.isArray(data.ownedCarIds) && data.ownedCarIds.length > 0 ? Array.from(new Set(data.ownedCarIds)) : ['apex-gt500'],
        selectedCarId: typeof data.selectedCarId === 'string' && VEHICLE_CONFIGS.some(c => c.id === data.selectedCarId) ? data.selectedCarId : 'apex-gt500',
        carCustomizations: typeof data.carCustomizations === 'object' && data.carCustomizations !== null ? data.carCustomizations : { ...INITIAL_PROFILE.carCustomizations },
        careerProgress: typeof data.careerProgress === 'object' && data.careerProgress !== null ? data.careerProgress : {},
        bestTrackTimes: typeof data.bestTrackTimes === 'object' && data.bestTrackTimes !== null ? data.bestTrackTimes : {},
        settings: {
          graphics: ['LOW', 'MEDIUM', 'HIGH'].includes(data.settings?.graphics) ? data.settings.graphics : DEFAULT_SETTINGS.graphics,
          masterVolume: Number.isFinite(data.settings?.masterVolume) ? Math.max(0, Math.min(1, data.settings.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
          sfxVolume: Number.isFinite(data.settings?.sfxVolume) ? Math.max(0, Math.min(1, data.settings.sfxVolume)) : DEFAULT_SETTINGS.sfxVolume,
          musicVolume: Number.isFinite(data.settings?.musicVolume) ? Math.max(0, Math.min(1, data.settings.musicVolume)) : DEFAULT_SETTINGS.musicVolume,
          steeringSensitivity: Number.isFinite(data.settings?.steeringSensitivity) ? Math.max(0.5, Math.min(2, data.settings.steeringSensitivity)) : DEFAULT_SETTINGS.steeringSensitivity,
          cameraFov: Number.isFinite(data.settings?.cameraFov) ? Math.max(60, Math.min(85, data.settings.cameraFov)) : DEFAULT_SETTINGS.cameraFov,
          touchControls: Boolean(data.settings?.touchControls),
          reducedMotion: Boolean(data.settings?.reducedMotion),
        }
      };

      // Always guarantee starting car exists
      if (!profile.ownedCarIds.includes('apex-gt500')) {
        profile.ownedCarIds.unshift('apex-gt500');
      }

      return profile;
    } catch (err) {
      console.error('[SaveManager] Failed to load save file from storage:', err);
      return { ...INITIAL_PROFILE };
    }
  }

  public static save(profile: PlayerProfile): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const payload: SerializedSave = {
        version: CURRENT_SAVE_VERSION,
        data: profile,
        timestamp: Date.now(),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error('[SaveManager] Failed to persist save data:', err);
      return false;
    }
  }

  public static reset(): PlayerProfile {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch (err) {
      console.warn('[SaveManager] Failed to delete save key:', err);
    }
    return { ...INITIAL_PROFILE };
  }
}
