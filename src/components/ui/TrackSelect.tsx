import React, { useState } from 'react';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { TRACK_CONFIGS } from '../../game/tracks/trackConfigs';
import { AIDifficulty, GameMode } from '../../types/game';
import { SoundManager } from '../../game/audio/soundManager';
import { ArrowLeft, Play, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';

interface TrackSelectProps {
  initialMode?: GameMode;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({ initialMode = 'QUICK_RACE' }) => {
  const profile = useGameStore(s => s.profile);
  const soundManager = SoundManager.getInstance();

  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('NORMAL');
  const [laps, setLaps] = useState(2);
  const [mode, setMode] = useState<GameMode>(initialMode);

  const track = TRACK_CONFIGS[selectedTrackIdx];

  const handleStartRace = () => {
    soundManager.playUIClick();
    if (mode === 'TIME_TRIAL') {
      gameStore.startTimeTrial(track.id, profile.selectedCarId);
    } else {
      gameStore.startQuickRace(track.id, profile.selectedCarId, difficulty, laps);
    }
  };

  const handlePrev = () => {
    soundManager.playUIClick();
    setSelectedTrackIdx(prev => (prev === 0 ? TRACK_CONFIGS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    soundManager.playUIClick();
    setSelectedTrackIdx(prev => (prev === TRACK_CONFIGS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-[#04060d] via-[#090d1a] to-[#04060d] text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button
          onClick={() => {
            soundManager.playUIClick();
            gameStore.setScreen('MAIN_MENU');
          }}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors cursor-pointer group"
        >
          <div className="p-2 bg-slate-900 border border-slate-700 rounded-xl group-hover:border-cyan-400">
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-bold text-sm tracking-wide">BACK TO MENU</span>
        </button>

        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Vehicle</div>
          <div className="text-sm font-black text-cyan-400 uppercase">{profile.selectedCarId}</div>
        </div>
      </div>

      {/* 2. CENTER TRACK SHOWCASE CAROUSEL */}
      <div className="max-w-4xl mx-auto w-full my-6 flex flex-col items-center">
        <div className="text-center mb-4">
          <div className="text-xs font-black tracking-widest text-cyan-400 uppercase">
            CIRCUIT SELECTION
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-white mt-1">
            {track.name}
          </h1>
        </div>

        {/* Carousel Visual Frame */}
        <div className="relative w-full aspect-video max-h-72 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
          {/* Track Ambient Gradient */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: `radial-gradient(circle at center, ${track.ambientColor} 0%, #04060d 100%)`
            }}
          />

          <div className="relative z-10 text-center px-6">
            <div className="inline-flex items-center space-x-2 bg-slate-950/80 border border-slate-700/80 px-4 py-1.5 rounded-full mb-3 backdrop-blur-md">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-widest text-slate-200 uppercase">
                {track.theme.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto font-medium">
              {track.description}
            </p>
            <div className="mt-4 flex items-center justify-center space-x-6 text-xs font-mono font-bold text-slate-400">
              <span>LENGTH: <strong className="text-white">{track.lengthKm} KM</strong></span>
              <span>DIFFICULTY: <strong className="text-amber-400">{track.difficulty}</strong></span>
              <span>PERSONAL BEST: <strong className="text-cyan-400">{profile.bestTrackTimes[track.id] ? `${profile.bestTrackTimes[track.id].toFixed(2)}s` : '--'}</strong></span>
            </div>
          </div>

          {/* Prev/Next Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-700 rounded-2xl text-white shadow-xl active:scale-90 cursor-pointer transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-700 rounded-2xl text-white shadow-xl active:scale-90 cursor-pointer transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 3. RACE CONFIGURATION PANEL */}
      <div className="max-w-4xl mx-auto w-full bg-slate-950/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Mode Selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Race Mode</label>
          <div className="flex space-x-2">
            {(['QUICK_RACE', 'TIME_TRIAL'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* AI Difficulty (if not Time Trial) */}
        {mode !== 'TIME_TRIAL' && (
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Difficulty</label>
            <div className="flex space-x-2">
              {(['EASY', 'NORMAL', 'HARD'] as AIDifficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Laps */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laps</label>
          <div className="flex space-x-2">
            {[1, 2, 3].map(l => (
              <button
                key={l}
                onClick={() => setLaps(l)}
                className={`w-9 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  laps === l
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartRace}
          className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-500/25 active:scale-95 cursor-pointer flex items-center space-x-2 ml-auto"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START RACE</span>
        </button>
      </div>
    </div>
  );
};

