import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { SoundManager } from '../../game/audio/soundManager';
import { Star, RotateCcw, Wrench, Menu } from 'lucide-react';

export const ResultsModal: React.FC = () => {
  const result = useGameStore(s => s.lastRaceResult);
  const activeRace = useGameStore(s => s.activeRaceConfig);
  const soundManager = SoundManager.getInstance();

  useEffect(() => {
    if (result && result.position <= 3) {
      // Trigger podium confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff']
      });
    }
  }, [result]);

  if (!result) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    soundManager.playUIClick();
    if (activeRace.careerEventId) {
      gameStore.startCareerEvent(activeRace.careerEventId);
    } else {
      gameStore.startQuickRace(activeRace.trackId, activeRace.carId, activeRace.aiDifficulty, activeRace.laps);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
        {/* 1. HEADER: POSITION & BANNER */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-1 mb-2">
            {[1, 2, 3].map(star => (
              <Star
                key={star}
                className={`w-7 h-7 ${
                  star <= result.starsEarned
                    ? 'text-amber-400 fill-amber-400 animate-bounce'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <h2 className="text-4xl md:text-5xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-orange-400">
            {result.position === 1 ? '1ST PLACE - VICTORY!' : result.position === 2 ? '2ND PLACE - PODIUM!' : result.position === 3 ? '3RD PLACE - PODIUM!' : `FINISHED ${result.position}TH`}
          </h2>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {result.trackName} • {result.carName}
          </div>

          {result.isNewBestTime && (
            <div className="inline-block mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-md">
              ⚡ NEW TRACK RECORD!
            </div>
          )}
        </div>

        {/* 2. RACE PERFORMANCE BREAKDOWN */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time</div>
            <div className="text-lg md:text-xl font-mono font-bold text-white">
              {formatTime(result.totalTime)}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Lap</div>
            <div className="text-lg md:text-xl font-mono font-bold text-cyan-400">
              {formatTime(result.bestLapTime)}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Speed</div>
            <div className="text-lg md:text-xl font-mono font-bold text-white">
              {result.topSpeedReached} KM/H
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drift Score</div>
            <div className="text-lg md:text-xl font-mono font-bold text-amber-400">
              +{result.driftScore.toLocaleString()} PTS
            </div>
          </div>
        </div>

        {/* 3. REWARDS SUMMARY */}
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-950/80 to-cyan-950/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-around mb-6">
          <div className="text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credits Earned</div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              +${result.creditsEarned.toLocaleString()}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div className="text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">XP Awarded</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              +{result.xpEarned} XP
            </div>
          </div>
        </div>

        {/* 4. ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              soundManager.playUIClick();
              gameStore.setScreen('MAIN_MENU');
            }}
            className="flex-1 min-w-[120px] py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Menu className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              gameStore.setScreen('GARAGE');
            }}
            className="flex-1 min-w-[120px] py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Wrench className="w-4 h-4" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex-1 min-w-[140px] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RACE AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

