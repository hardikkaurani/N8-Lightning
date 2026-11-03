import { CareerEvent } from '../../types/game';

export const CAREER_EVENTS: CareerEvent[] = [
  // CHAPTER 1: STREET AWAKENING (Events 1-4)
  {
    id: 'c1_event1',
    chapter: 1,
    title: 'Neon Initiation',
    description: 'Welcome to the underground circuit. Master the Apex GT-500 in this introductory showdown.',
    trackId: 'neon-city',
    laps: 2,
    mode: 'QUICK_RACE',
    aiDifficulty: 'EASY',
    requiredStars: 0,
    rewardCredits: 4000,
    rewardXP: 300,
    objectives: {
      star1: 'Finish the race',
      star2: 'Finish in Top 2',
      star3: 'Win the race (1st place)'
    }
  },
  {
    id: 'c1_event2',
    chapter: 1,
    title: 'Canyon Velocity',
    description: 'High-speed straights across Desert Storm Canyon. Use slipstreams to outrun the pack.',
    trackId: 'desert-storm',
    laps: 2,
    mode: 'QUICK_RACE',
    aiDifficulty: 'EASY',
    requiredStars: 2,
    rewardCredits: 6000,
    rewardXP: 450,
    objectives: {
      star1: 'Finish the race',
      star2: 'Reach 200+ km/h top speed',
      star3: 'Win the race (1st place)'
    }
  },
  {
    id: 'c1_event3',
    chapter: 1,
    title: 'Alpine Drift Trials',
    description: 'Execute long powerslides along slippery alpine hairpin corners.',
    trackId: 'alpine-rush',
    laps: 2,
    mode: 'TIME_TRIAL',
    aiDifficulty: 'EASY',
    requiredStars: 5,
    rewardCredits: 8500,
    rewardXP: 600,
    targetDriftScore: 1200,
    objectives: {
      star1: 'Complete 2 laps',
      star2: 'Accumulate 800+ drift points',
      star3: 'Score 1,500+ drift points'
    }
  },
  {
    id: 'c1_event4',
    chapter: 1,
    title: 'Pacific Dawn Finale',
    description: 'Chapter 1 Grand Finale: A flat-out dash across the ocean highway bridges.',
    trackId: 'coastline-x',
    laps: 3,
    mode: 'QUICK_RACE',
    aiDifficulty: 'NORMAL',
    requiredStars: 8,
    rewardCredits: 12000,
    rewardXP: 900,
    objectives: {
      star1: 'Finish the race',
      star2: 'Activate Nitro 4+ times',
      star3: 'Win the race (1st place)'
    }
  },

  // CHAPTER 2: PRO CIRCUIT CHALLENGE (Events 5-8)
  {
    id: 'c2_event1',
    chapter: 2,
    title: 'Neon Midnight Express',
    description: 'The city lights blur as professional racers unleash high-downforce sport machines.',
    trackId: 'neon-city',
    laps: 2,
    mode: 'QUICK_RACE',
    aiDifficulty: 'NORMAL',
    requiredStars: 10,
    rewardCredits: 15000,
    rewardXP: 1100,
    objectives: {
      star1: 'Finish the race',
      star2: 'Perform 1,500m total drift',
      star3: 'Win in 1st place'
    }
  },
  {
    id: 'c2_event2',
    chapter: 2,
    title: 'Dune Drifter Showdown',
    description: 'Conquer the undulating desert dunes in an all-out battle of lateral grip.',
    trackId: 'desert-storm',
    laps: 2,
    mode: 'QUICK_RACE',
    aiDifficulty: 'NORMAL',
    requiredStars: 14,
    rewardCredits: 18000,
    rewardXP: 1300,
    objectives: {
      star1: 'Finish Top 3',
      star2: 'Score 2,000+ drift points',
      star3: 'Win the race (1st place)'
    }
  },
  {
    id: 'c2_event3',
    chapter: 2,
    title: 'Glacier Sprint Time Attack',
    description: 'Race against the clock on frozen mountain asphalt. Every apex counts.',
    trackId: 'alpine-rush',
    laps: 1,
    mode: 'TIME_TRIAL',
    aiDifficulty: 'NORMAL',
    requiredStars: 17,
    rewardCredits: 22000,
    rewardXP: 1600,
    targetTime: 75.0,
    objectives: {
      star1: 'Complete lap without crashing',
      star2: 'Finish under 85.0 seconds',
      star3: 'Beat pro record (under 75.0s)'
    }
  },
  {
    id: 'c2_event4',
    chapter: 2,
    title: 'Oceanic Thunderbolt Cup',
    description: 'High-stakes battle along Coastline X with aggressive rival AI.',
    trackId: 'coastline-x',
    laps: 3,
    mode: 'QUICK_RACE',
    aiDifficulty: 'HARD',
    requiredStars: 21,
    rewardCredits: 28000,
    rewardXP: 2000,
    objectives: {
      star1: 'Finish on Podium (Top 3)',
      star2: 'Clock a lap under 48.0s',
      star3: 'Win the race (1st place)'
    }
  },

  // CHAPTER 3: APEX LEGENDS CHAMPIONSHIP (Events 9-12)
  {
    id: 'c3_event1',
    chapter: 3,
    title: 'Cyber Grid Grand Prix',
    description: 'Hypercars only. High-density urban circuit with maximum speed and hyper-boost ramps.',
    trackId: 'neon-city',
    laps: 3,
    mode: 'QUICK_RACE',
    aiDifficulty: 'HARD',
    requiredStars: 25,
    rewardCredits: 35000,
    rewardXP: 2500,
    objectives: {
      star1: 'Finish the race',
      star2: 'Hit 280+ km/h top speed',
      star3: 'Win the race (1st place)'
    }
  },
  {
    id: 'c3_event2',
    chapter: 3,
    title: 'Red Mesa Eliminator',
    description: 'Extreme speed desert gauntlet: Push your vehicle beyond the limit.',
    trackId: 'desert-storm',
    laps: 3,
    mode: 'QUICK_RACE',
    aiDifficulty: 'HARD',
    requiredStars: 28,
    rewardCredits: 42000,
    rewardXP: 3000,
    objectives: {
      star1: 'Finish the race',
      star2: 'Score 2,500+ drift points',
      star3: 'Win the race (1st place)'
    }
  },
  {
    id: 'c3_event3',
    chapter: 3,
    title: 'Avalanche Peak Masters',
    description: 'Deadly downhill chicanes through blinding snowy mountain peaks.',
    trackId: 'alpine-rush',
    laps: 2,
    mode: 'QUICK_RACE',
    aiDifficulty: 'HARD',
    requiredStars: 31,
    rewardCredits: 50000,
    rewardXP: 3800,
    objectives: {
      star1: 'Finish Top 2',
      star2: 'Execute 3 jump airtimes',
      star3: 'Win in 1st place'
    }
  },
  {
    id: 'c3_event4',
    chapter: 3,
    title: 'N8-LIGHTNING WORLD FINALS',
    description: 'The Ultimate Championship Crown: 4 intense laps on Coastline X against elite world champions.',
    trackId: 'coastline-x',
    laps: 4,
    mode: 'QUICK_RACE',
    aiDifficulty: 'HARD',
    requiredStars: 34,
    rewardCredits: 75000,
    rewardXP: 5000,
    objectives: {
      star1: 'Finish on Podium',
      star2: 'Set fastest race lap',
      star3: 'Become N8-Lightning World Champion (1st Place)'
    }
  }
];

export function getCareerEventById(id: string): CareerEvent | undefined {
  return CAREER_EVENTS.find(e => e.id === id);
}

export function getTotalEarnedStars(progress: Record<string, { stars: number }>): number {
  return Object.values(progress).reduce((acc, curr) => acc + (curr.stars || 0), 0);
}

