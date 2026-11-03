import React from 'react';
import { gameStore, useGameStore } from '../../store/useGameStore';
import { SoundManager } from '../../game/audio/soundManager';
import { Play, RotateCcw, Settings, Menu } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onOpenSettings }) => {
  const activeRace = useGameStore(s => s.activeRaceConfig);
  const soundManager = SoundManager.getInstance();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-3xl font-black italic tracking-tight text-white">
          RACE PAUSED
        </h2>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          {activeRace.trackId.toUpperCase()} • {activeRace.mode.replace('_', ' ')}
        </div>

        <div className="flex flex-col space-y-2.5 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RACE</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>AUDIO & GRAPHICS</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUIClick();
              gameStore.setScreen('MAIN_MENU');
            }}
            className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-2"
          >
            <Menu className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
