import React, { useState } from 'react';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { SoundManager } from '../../game/audio/soundManager';
import { X, Volume2, Monitor, Sliders, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const settings = useGameStore(s => s.profile.settings);
  const soundManager = SoundManager.getInstance();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleUpdate = (updates: any) => {
    gameStore.updateSettings(updates);
    const newSettings = { ...settings, ...updates };
    soundManager.setVolumes(newSettings.masterVolume, newSettings.sfxVolume, newSettings.musicVolume);
  };

  const handleResetProgress = () => {
    soundManager.playUIClick();
    gameStore.resetProgress();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-2xl font-black italic tracking-tight text-white">
            SETTINGS
          </h2>
          <button
            onClick={() => {
              soundManager.playUIClick();
              onClose();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. GRAPHICS PRESETS */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Graphics Quality</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => handleUpdate({ graphics: preset })}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.graphics === preset
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. AUDIO SLIDERS */}
        <div className="flex flex-col space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Audio Levels</span>
          </label>

          {/* Master Volume */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Master Volume</span>
              <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={e => handleUpdate({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Engine & SFX</span>
              <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={e => handleUpdate({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Synth Racing Music</span>
              <span className="font-mono">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={e => handleUpdate({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-blue-400 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. GAMEPLAY & CONTROLS */}
        <div className="flex flex-col space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Controls & Camera</span>
          </label>

          {/* Steering Sensitivity */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Steering Sensitivity</span>
              <span className="font-mono">{settings.steeringSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.steeringSensitivity}
              onChange={e => handleUpdate({ steeringSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Touch Controls Toggle */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Always Show On-Screen Touch Controls</span>
            <input
              type="checkbox"
              checked={settings.touchControls}
              onChange={e => handleUpdate({ touchControls: e.target.checked })}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 4. RESET PROGRESS */}
        <div className="pt-2 border-t border-slate-800">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>RESET SAVED GAME PROGRESS</span>
            </button>
          ) : (
            <div className="p-4 bg-red-950/80 border border-red-500 rounded-2xl flex flex-col space-y-2 text-center animate-shake">
              <span className="text-xs font-bold text-red-200">
                Are you sure? This will reset all credits, cars, and career progress!
              </span>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleResetProgress}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg cursor-pointer"
                >
                  YES, RESET
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

