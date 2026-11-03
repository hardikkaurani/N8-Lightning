import React from 'react';
import { InputManager } from '../../game/controls/inputManager';
import { ChevronLeft, ChevronRight, Zap, RotateCcw } from 'lucide-react';

interface MobileControlsProps {
  inputManager: InputManager;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputManager }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex justify-between items-end p-4 pb-6">
      {/* 1. LEFT CONTROLS: STEERING (LEFT & RIGHT) */}
      <div className="flex space-x-3 pointer-events-auto">
        <button
          className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/80 active:bg-cyan-600/70 backdrop-blur-md border border-slate-700/80 active:border-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90"
          onPointerDown={() => inputManager.setTouchSteer(-1)}
          onPointerUp={() => inputManager.setTouchSteer(0)}
          onPointerLeave={() => inputManager.setTouchSteer(0)}
          onPointerCancel={() => inputManager.setTouchSteer(0)}
        >
          <ChevronLeft className="w-9 h-9" />
        </button>

        <button
          className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/80 active:bg-cyan-600/70 backdrop-blur-md border border-slate-700/80 active:border-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90"
          onPointerDown={() => inputManager.setTouchSteer(1)}
          onPointerUp={() => inputManager.setTouchSteer(0)}
          onPointerLeave={() => inputManager.setTouchSteer(0)}
          onPointerCancel={() => inputManager.setTouchSteer(0)}
        >
          <ChevronRight className="w-9 h-9" />
        </button>
      </div>

      {/* 2. CENTER: RESET BUTTON */}
      <div className="pointer-events-auto mb-1">
        <button
          className="p-3 bg-slate-900/70 active:bg-slate-800 rounded-xl border border-slate-700/50 text-slate-400 active:text-white transition-all"
          onClick={() => inputManager.triggerReset()}
          title="Reset Car (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3. RIGHT CONTROLS: NITRO, DRIFT, BRAKE, ACCELERATE */}
      <div className="flex items-end space-x-3 pointer-events-auto">
        {/* Secondary: Drift & Nitro */}
        <div className="flex flex-col space-y-3">
          <button
            className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-cyan-600 to-blue-500 active:from-cyan-400 active:to-blue-400 rounded-2xl border border-cyan-300 flex flex-col items-center justify-center text-white shadow-lg active:scale-90"
            onPointerDown={() => inputManager.setTouchNitro(true)}
            onPointerUp={() => inputManager.setTouchNitro(false)}
            onPointerLeave={() => inputManager.setTouchNitro(false)}
            onPointerCancel={() => inputManager.setTouchNitro(false)}
          >
            <Zap className="w-6 h-6 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">NITRO</span>
          </button>

          <button
            className="w-14 h-14 md:w-16 md:h-16 bg-slate-900/80 active:bg-amber-600/80 border border-slate-700 active:border-amber-400 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg active:scale-90"
            onPointerDown={() => inputManager.setTouchDrift(true)}
            onPointerUp={() => inputManager.setTouchDrift(false)}
            onPointerLeave={() => inputManager.setTouchDrift(false)}
            onPointerCancel={() => inputManager.setTouchDrift(false)}
          >
            <span className="text-xs font-black uppercase tracking-wider">DRIFT</span>
          </button>
        </div>

        {/* Primary: Brake & Gas */}
        <div className="flex flex-col space-y-3">
          <button
            className="w-16 h-14 md:w-20 md:h-16 bg-red-950/70 active:bg-red-700 border border-red-700/80 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl active:scale-95"
            onPointerDown={() => inputManager.setTouchBrake(1)}
            onPointerUp={() => inputManager.setTouchBrake(0)}
            onPointerLeave={() => inputManager.setTouchBrake(0)}
            onPointerCancel={() => inputManager.setTouchBrake(0)}
          >
            <span className="text-xs font-black uppercase tracking-wider">BRAKE</span>
          </button>

          <button
            className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-t from-emerald-600 to-teal-500 active:from-emerald-400 active:to-teal-400 border border-emerald-300 rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl active:scale-95"
            onPointerDown={() => inputManager.setTouchThrottle(1)}
            onPointerUp={() => inputManager.setTouchThrottle(0)}
            onPointerLeave={() => inputManager.setTouchThrottle(0)}
            onPointerCancel={() => inputManager.setTouchThrottle(0)}
          >
            <span className="text-sm font-black uppercase tracking-wider">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
