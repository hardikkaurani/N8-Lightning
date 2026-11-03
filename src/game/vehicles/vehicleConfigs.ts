import { VehicleConfig } from '../../types/game';

export const VEHICLE_CONFIGS: VehicleConfig[] = [
  {
    id: 'apex-gt500',
    name: 'Apex GT-500',
    category: 'STREET',
    tier: 1,
    description: 'Aggressive American muscle infused with race-grade aero and a roaring supercharged V8.',
    price: 0,
    unlockedByDefault: true,
    baseStats: {
      topSpeed: 235,
      acceleration: 68,
      handling: 60,
      nitro: 65,
    },
    primaryColor: '#ea580c', // High impact race orange matching cover car
    stripeColor: '#f8fafc',  // Dual racing stripes
    glowColor: '#fb923c',
    bodyStyle: 'muscle',
  },
  {
    id: 'venom-cr',
    name: 'Venom Cyber-R',
    category: 'SPORT',
    tier: 1,
    description: 'Precision Japanese engineering with twin-turbo AWD and ultra-sharp cornering turn-in.',
    price: 25000,
    unlockedByDefault: false,
    baseStats: {
      topSpeed: 255,
      acceleration: 74,
      handling: 78,
      nitro: 70,
    },
    primaryColor: '#0284c7', // Electric cobalt blue
    stripeColor: '#38bdf8',
    glowColor: '#00f2fe',
    bodyStyle: 'coupe',
  },
  {
    id: 'drifter-rs',
    name: 'Drift King RS',
    category: 'DRIFT',
    tier: 2,
    description: 'Custom widebody street tuner built for monstrous lateral slide angles and huge drift scores.',
    price: 55000,
    unlockedByDefault: false,
    baseStats: {
      topSpeed: 270,
      acceleration: 80,
      handling: 92,
      nitro: 75,
    },
    primaryColor: '#10b981', // Acid neon green
    stripeColor: '#a855f7', // Purple contrast
    glowColor: '#4ade80',
    bodyStyle: 'tuner',
  },
  {
    id: 'spectre-phantom',
    name: 'Spectre Phantom',
    category: 'SUPER',
    tier: 2,
    description: 'Stealth supercar built with aerospace composites and mid-mounted howling V10 engine.',
    price: 110000,
    unlockedByDefault: false,
    baseStats: {
      topSpeed: 305,
      acceleration: 88,
      handling: 85,
      nitro: 82,
    },
    primaryColor: '#1e1b4b', // Deep midnight carbon
    stripeColor: '#c084fc', // Neon purple
    glowColor: '#a855f7',
    bodyStyle: 'supercar',
  },
  {
    id: 'thunderbolt-prime',
    name: 'Thunderbolt Prime',
    category: 'NITRO',
    tier: 3,
    description: 'Experimental electric hyper-prototype with dual rocket thrust conduits and rapid nitro regeneration.',
    price: 185000,
    unlockedByDefault: false,
    baseStats: {
      topSpeed: 335,
      acceleration: 94,
      handling: 87,
      nitro: 98,
    },
    primaryColor: '#06b6d4', // Cyan lightning
    stripeColor: '#ffffff',
    glowColor: '#22d3ee',
    bodyStyle: 'prototype',
  },
  {
    id: 'valkyrie-hx',
    name: 'Valkyrie Hyper-X',
    category: 'HYPER',
    tier: 3,
    description: 'The pinnacle of hypercar velocity: quad-turbo W16 generating astronomical top end speed.',
    price: 275000,
    unlockedByDefault: false,
    baseStats: {
      topSpeed: 375,
      acceleration: 98,
      handling: 93,
      nitro: 95,
    },
    primaryColor: '#e2e8f0', // Pearlescent arctic white
    stripeColor: '#eab308', // Forged gold aero stripes
    glowColor: '#facc15',
    bodyStyle: 'hypercar',
  },
];

// Stat calculation taking into account upgrade levels (0 to 5)
export function calculateCarStats(baseStats: typeof VEHICLE_CONFIGS[0]['baseStats'], upgrades: {
  topSpeedLevel: number;
  accelerationLevel: number;
  handlingLevel: number;
  nitroLevel: number;
}) {
  return {
    topSpeed: Math.round(baseStats.topSpeed + (upgrades.topSpeedLevel * 12)),
    acceleration: Math.min(100, Math.round(baseStats.acceleration + (upgrades.accelerationLevel * 4))),
    handling: Math.min(100, Math.round(baseStats.handling + (upgrades.handlingLevel * 4))),
    nitro: Math.min(100, Math.round(baseStats.nitro + (upgrades.nitroLevel * 5))),
  };
}

export function getUpgradeCost(currentLevel: number): number {
  if (currentLevel >= 5) return 0;
  // Level 1: 3,000, Level 2: 7,500, Level 3: 15,000, Level 4: 25,000, Level 5: 40,000
  const costs = [3000, 7500, 15000, 25000, 40000];
  return costs[currentLevel] || 50000;
}
