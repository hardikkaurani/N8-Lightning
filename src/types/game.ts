export type GameScreen = 
  | 'LOADING'
  | 'MAIN_MENU'
  | 'GARAGE'
  | 'CAREER'
  | 'QUICK_RACE_SETUP'
  | 'TRACK_SELECT'
  | 'RACING'
  | 'RESULTS'
  | 'SETTINGS';

export type GameMode = 'QUICK_RACE' | 'CAREER' | 'TIME_TRIAL' | 'ELIMINATION';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface VehicleStats {
  topSpeed: number; // km/h
  acceleration: number; // 0-100 acceleration rating
  handling: number; // cornering grip and turn rate
  nitro: number; // nitro thrust and capacity
}

export interface VehicleUpgrades {
  topSpeedLevel: number; // 0 to 5
  accelerationLevel: number;
  handlingLevel: number;
  nitroLevel: number;
}

export interface VehicleConfig {
  id: string;
  name: string;
  category: 'STREET' | 'SPORT' | 'SUPER' | 'HYPER' | 'DRIFT' | 'NITRO';
  tier: 1 | 2 | 3;
  description: string;
  price: number;
  unlockedByDefault: boolean;
  baseStats: VehicleStats;
  primaryColor: string;
  stripeColor: string;
  glowColor: string;
  bodyStyle: 'muscle' | 'coupe' | 'hypercar' | 'supercar' | 'tuner' | 'prototype';
}

export interface TrackCheckpoint {
  position: [number, number, number];
  rotation: number;
  width: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
  width?: number;
  bank?: number;
}

export interface TrackConfig {
  id: string;
  name: string;
  theme: 'NEON_CITY' | 'DESERT_STORM' | 'ALPINE_RUSH' | 'COASTLINE_X';
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  laps: number;
  lengthKm: number;
  fogColor: string;
  ambientColor: string;
  skyColor: string;
  groundColor: string;
  roadColor: string;
  curbColor: string;
  barrierColor: string;
  points: TrackPoint[];
  ramps?: Array<{ pointIndex: number; height: number; length: number }>;
}

export interface CareerEvent {
  id: string;
  chapter: 1 | 2 | 3;
  title: string;
  description: string;
  trackId: string;
  laps: number;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  requiredStars: number;
  rewardCredits: number;
  rewardXP: number;
  carClassRequirement?: 'STREET' | 'SPORT' | 'SUPER' | 'HYPER' | 'DRIFT' | 'NITRO';
  objectives: {
    star1: string; // e.g. Finish the race
    star2: string; // e.g. Finish in 1st place
    star3: string; // e.g. Drift for > 250m or Beat target time
  };
  targetTime?: number; // for time trial or star3
  targetDriftScore?: number;
}

export interface RaceResult {
  trackId: string;
  trackName: string;
  carId: string;
  carName: string;
  mode: GameMode;
  position: number;
  totalRacers: number;
  totalTime: number; // in seconds
  bestLapTime: number;
  topSpeedReached: number;
  driftScore: number;
  nitroUsedCount: number;
  starsEarned: number;
  creditsEarned: number;
  xpEarned: number;
  isNewBestTime: boolean;
  completedAt: number;
}

export interface PlayerProfile {
  username: string;
  level: number;
  xp: number;
  credits: number;
  totalRaces: number;
  totalWins: number;
  totalDistanceKm: number;
  ownedCarIds: string[];
  selectedCarId: string;
  carCustomizations: Record<string, {
    primaryColor: string;
    stripeColor: string;
    upgrades: VehicleUpgrades;
  }>;
  careerProgress: Record<string, {
    completed: boolean;
    stars: number; // 0-3
    bestTime: number;
  }>;
  bestTrackTimes: Record<string, number>; // trackId -> seconds
  settings: GameSettings;
}

export interface GameSettings {
  graphics: 'LOW' | 'MEDIUM' | 'HIGH';
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number;
  musicVolume: number;
  steeringSensitivity: number; // 0.5 - 2.0
  cameraFov: number; // 60 - 85
  touchControls: boolean;
  reducedMotion: boolean;
}

