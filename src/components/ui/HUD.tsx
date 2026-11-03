import React from 'react';
import { RaceHudState } from '../../game/engine/raceEngine';
import { Pause, Flame, Zap, Trophy, Timer } from 'lucide-react';

interface HUDProps {
  state: RaceHudState;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ state, onPause }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const speedPercent = Math.min(100, (state.speedKmh / 380) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-4 md:p-6">
      {/* 1. TOP HEADER (Position, Lap, Time, Pause) */}
      <div className="flex items-start justify-between w-full">
        {/* Position & Laps */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2.5 shadow-lg flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase font-bold">Position</div>
              <div className="text-2xl font-black text-white italic tracking-tight">
                {state.position} <span className="text-sm font-semibold text-slate-400">/ {state.totalRacers}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-lg">
            <div className="text-[10px] tracking-wider text-slate-400 uppercase font-bold">Lap</div>
            <div className="text-xl font-black text-cyan-400 italic">
              {state.currentLap} <span className="text-sm font-semibold text-slate-500">/ {state.totalLaps}</span>
            </div>
          </div>
        </div>

        {/* Center: Notice or Notifications */}
        {state.checkpointNotice && (
          <div className="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-300 shadow-xl animate-bounce">
            <span className="text-lg font-black tracking-widest text-white italic">
              {state.checkpointNotice}
            </span>
          </div>
        )}

        {/* Right: Race Timer & Pause */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2 text-right shadow-lg">
            <div className="flex items-center justify-end space-x-1.5 text-[10px] tracking-wider text-slate-400 uppercase font-bold">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tracking-wider">
              {formatTime(state.raceTime)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Best: {formatTime(state.bestLapTime)}
            </div>
          </div>

          <button
            onClick={onPause}
            className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
            title="Pause Race (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CENTER COUNTDOWN / DRIFT SCORE */}
      <div className="flex flex-col items-center justify-center my-auto">
        {state.countdown > 0 && (
          <div className="text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-orange-400 to-red-600 drop-shadow-[0_10px_25px_rgba(239,68,68,0.7)] animate-pulse">
            {state.countdown}
          </div>
        )}
        {state.countdown === 0 && (
          <div className="text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-blue-600 drop-shadow-[0_10px_30px_rgba(6,182,212,0.8)] animate-ping">
            GO!
          </div>
        )}

        {state.isDrifting && state.driftScore > 0 && (
          <div className="bg-slate-950/80 backdrop-blur-md border border-amber-500/50 px-5 py-2 rounded-2xl flex items-center space-x-2 animate-pulse mt-4">
            <Flame className="w-5 h-5 text-amber-400 animate-spin" />
            <span className="text-xl font-black italic text-amber-300 tracking-wide">
              DRIFT +{state.driftScore.toLocaleString()} PTS
            </span>
          </div>
        )}
      </div>

      {/* 3. BOTTOM COCKPIT HUD (Minimap, Nitro, Speedometer) */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Minimap */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Track outline */}
            <path
              d="M 50 15 C 80 15, 88 35, 85 55 C 82 75, 75 85, 50 85 C 25 85, 12 70, 15 50 C 18 30, 25 15, 50 15 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 50 15 C 80 15, 88 35, 85 55 C 82 75, 75 85, 50 85 C 25 85, 12 70, 15 50 C 18 30, 25 15, 50 15 Z"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="2 3"
            />

            {/* Racers positions */}
            {state.minimapRacers.map(racer => {
              // Convert t (0 to 1) to rough ellipse coordinates
              const angle = racer.t * Math.PI * 2 - Math.PI / 2;
              const rx = 34;
              const ry = 32;
              const cx = 50 + Math.cos(angle) * rx;
              const cy = 50 + Math.sin(angle) * ry;

              return (
                <circle
                  key={racer.id}
                  cx={cx}
                  cy={cy}
                  r={racer.isPlayer ? "4" : "2.5"}
                  fill={racer.isPlayer ? "#22d3ee" : "#ef4444"}
                  stroke={racer.isPlayer ? "#ffffff" : "#7f1d1d"}
                  strokeWidth={racer.isPlayer ? "1.5" : "0.8"}
                  className={racer.isPlayer ? "animate-pulse" : ""}
                />
              );
            })}
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            RADAR
          </div>
        </div>

        {/* Center: Multi-stage Nitro Boost Tank */}
        <div className="flex flex-col items-center max-w-sm w-full mx-4 mb-2">
          <div className="flex items-center justify-between w-full px-2 mb-1.5">
            <div className="flex items-center space-x-1">
              <Zap className={`w-4 h-4 ${state.isNitroActive ? 'text-cyan-400 animate-spin' : 'text-orange-400'}`} />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                NITRO SYSTEM
              </span>
            </div>
            <span className={`text-xs font-mono font-bold ${state.nitroAmount > 80 ? 'text-cyan-400' : 'text-slate-400'}`}>
              {Math.round(state.nitroAmount)}%
            </span>
          </div>

          <div className={`w-full h-4 bg-slate-950/90 rounded-full border border-slate-700/80 p-0.5 overflow-hidden shadow-inner ${state.isNitroActive ? 'nitro-active-glow' : ''}`}>
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                state.isNitroActive
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
              }`}
              style={{ width: `${Math.max(2, state.nitroAmount)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
            [SHIFT] TO BOOST • DRIFT TO RECHARGE
          </div>
        </div>

        {/* Right: Digital Speedometer Cockpit Gauge */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl flex flex-col items-end min-w-[150px] md:min-w-[180px]">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white hud-glow">
              {state.speedKmh}
            </span>
            <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
              KM/H
            </span>
          </div>

          {/* Speed Bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 transition-all duration-75"
              style={{ width: `${speedPercent}%` }}
            />
          </div>

          {/* Gear & RPM */}
          <div className="flex items-center justify-between w-full mt-2 text-xs font-bold text-slate-400">
            <span>GEAR <strong className="text-white text-sm">{state.currentGear}</strong></span>
            <span className="font-mono">{state.rpm} RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
