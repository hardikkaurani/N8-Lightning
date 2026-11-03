import { TrackConfig } from '../../types/game';

export const TRACK_CONFIGS: TrackConfig[] = [
  {
    id: 'neon-city',
    name: 'Neon City Circuit',
    theme: 'NEON_CITY',
    description: 'Blaze through a cybernetic metropolis surrounded by towering skyscrapers, holographic billboards, and neon highway flyovers.',
    difficulty: 'EASY',
    laps: 2,
    lengthKm: 3.2,
    fogColor: '#070a1e',
    ambientColor: '#1e1b4b',
    skyColor: '#050714',
    groundColor: '#090d16',
    roadColor: '#111827',
    curbColor: '#06b6d4',
    barrierColor: '#ec4899',
    ramps: [
      { pointIndex: 6, height: 4.5, length: 18 },
      { pointIndex: 14, height: 5.0, length: 22 }
    ],
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: -150 },
      { x: 0, y: 0, z: -300 },
      { x: 30, y: 1, z: -420 },
      { x: 100, y: 2, z: -520 },
      { x: 220, y: 4, z: -580 },
      { x: 350, y: 8, z: -580 }, // Flyover / Ramp 1
      { x: 480, y: 5, z: -520 },
      { x: 560, y: 2, z: -400 },
      { x: 580, y: 0, z: -250 },
      { x: 520, y: 0, z: -120 },
      { x: 400, y: 0, z: -40 },
      { x: 300, y: 0, z: 20 },
      { x: 220, y: 2, z: 120 },
      { x: 150, y: 6, z: 240 }, // Ramp 2
      { x: 80, y: 2, z: 320 },
      { x: -40, y: 0, z: 340 },
      { x: -160, y: 0, z: 280 },
      { x: -220, y: 0, z: 160 },
      { x: -180, y: 0, z: 40 },
      { x: -80, y: 0, z: 10 },
      { x: 0, y: 0, z: 0 },
    ]
  },
  {
    id: 'desert-storm',
    name: 'Desert Storm Canyon',
    theme: 'DESERT_STORM',
    description: 'High-speed drift highway slicing through red sandstone mesas, massive sand dunes, and sun-baked canyon straights.',
    difficulty: 'MEDIUM',
    laps: 2,
    lengthKm: 3.8,
    fogColor: '#451a03',
    ambientColor: '#78350f',
    skyColor: '#b45309',
    groundColor: '#7c2d12',
    roadColor: '#292524',
    curbColor: '#f59e0b',
    barrierColor: '#ea580c',
    ramps: [
      { pointIndex: 8, height: 6.0, length: 24 }
    ],
    points: [
      { x: 0, y: 0, z: 0 },
      { x: -40, y: 0, z: -180 },
      { x: -120, y: 2, z: -350 },
      { x: -240, y: 4, z: -480 },
      { x: -400, y: 8, z: -550 },
      { x: -550, y: 12, z: -500 },
      { x: -620, y: 8, z: -350 },
      { x: -580, y: 4, z: -180 },
      { x: -480, y: 10, z: 0 }, // Canyon Ramp
      { x: -350, y: 6, z: 180 },
      { x: -180, y: 3, z: 300 },
      { x: 0, y: 1, z: 420 },
      { x: 200, y: 0, z: 460 },
      { x: 380, y: 0, z: 380 },
      { x: 460, y: 0, z: 220 },
      { x: 420, y: 0, z: 80 },
      { x: 280, y: 0, z: -20 },
      { x: 120, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 }
    ]
  },
  {
    id: 'alpine-rush',
    name: 'Alpine Rush Pass',
    theme: 'ALPINE_RUSH',
    description: 'Challenging high-altitude mountain pass with snowy hairpins, avalanche tunnels, and steep downhill velocity runs.',
    difficulty: 'HARD',
    laps: 2,
    lengthKm: 3.5,
    fogColor: '#1e293b',
    ambientColor: '#334155',
    skyColor: '#0f172a',
    groundColor: '#e2e8f0',
    roadColor: '#1e293b',
    curbColor: '#38bdf8',
    barrierColor: '#e0f2fe',
    ramps: [
      { pointIndex: 11, height: 5.5, length: 20 }
    ],
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 20, y: 5, z: -160 },
      { x: 80, y: 12, z: -300 },
      { x: 180, y: 20, z: -400 },
      { x: 300, y: 28, z: -420 },
      { x: 380, y: 32, z: -320 },
      { x: 350, y: 26, z: -200 }, // Hairpin 1
      { x: 250, y: 20, z: -100 },
      { x: 320, y: 15, z: 20 },
      { x: 420, y: 10, z: 120 },
      { x: 460, y: 6, z: 260 },
      { x: 380, y: 12, z: 380 }, // Alpine ski jump
      { x: 240, y: 6, z: 440 },
      { x: 80, y: 3, z: 420 },
      { x: -60, y: 1, z: 320 },
      { x: -140, y: 0, z: 180 },
      { x: -100, y: 0, z: 50 },
      { x: 0, y: 0, z: 0 }
    ]
  },
  {
    id: 'coastline-x',
    name: 'Coastline X Grand Prix',
    theme: 'COASTLINE_X',
    description: 'Sun-drenched seaside highway featuring scenic suspension bridges, turquoise ocean vistas, and sweeping coastal curves.',
    difficulty: 'EXPERT',
    laps: 2,
    lengthKm: 3.4,
    fogColor: '#0284c7',
    ambientColor: '#0369a1',
    skyColor: '#38bdf8',
    groundColor: '#0f766e',
    roadColor: '#1e293b',
    curbColor: '#ef4444',
    barrierColor: '#38bdf8',
    ramps: [
      { pointIndex: 5, height: 5.0, length: 20 },
      { pointIndex: 12, height: 4.8, length: 18 }
    ],
    points: [
      { x: 0, y: 0, z: 0 },
      { x: -30, y: 0, z: -180 },
      { x: -80, y: 1, z: -350 },
      { x: -180, y: 4, z: -480 },
      { x: -300, y: 8, z: -550 },
      { x: -440, y: 12, z: -500 }, // Ocean Bridge
      { x: -520, y: 10, z: -360 },
      { x: -480, y: 6, z: -200 },
      { x: -360, y: 2, z: -80 },
      { x: -240, y: 0, z: 40 },
      { x: -160, y: 1, z: 180 },
      { x: -80, y: 3, z: 320 },
      { x: 40, y: 7, z: 420 }, // Pier Jump
      { x: 180, y: 4, z: 440 },
      { x: 300, y: 2, z: 360 },
      { x: 340, y: 0, z: 200 },
      { x: 260, y: 0, z: 80 },
      { x: 120, y: 0, z: 20 },
      { x: 0, y: 0, z: 0 }
    ]
  }
];

export function getTrackById(id: string): TrackConfig {
  const found = TRACK_CONFIGS.find(t => t.id === id);
  return found || TRACK_CONFIGS[0];
}
