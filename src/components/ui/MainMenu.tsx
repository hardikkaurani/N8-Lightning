import React from 'react';
import heroLogo from '../../assets/logo.jpg';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { SoundManager } from '../../game/audio/soundManager';
import { Trophy, Play, Wrench, Settings, Zap, Compass, Award, Shield, Timer } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const profile = useGameStore(s => s.profile);
  const soundManager = SoundManager.getInstance();

  const handleNavigate = (screen: any) => {
    soundManager.init();
    soundManager.resume();
    soundManager.playUIClick();
    soundManager.startMusic();
    gameStore.setScreen(screen);
  };

  const nextLevelXp = profile.level * 1000;
  const xpPercent = Math.min(100, (profile.xp / nextLevelXp) * 100);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#04060d] via-[#090d1a] to-[#04060d]">
      {/* Background Hero Banner with user's uploaded race car artwork */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity pointer-events-none">
        <img
          src={heroLogo}
          alt="N8-Lightning Race Car"
          className="w-full h-full object-cover object-center filter contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060d] via-[#04060d]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060d]/40 to-[#04060d]" />
      </div>

      {/* 1. TOP BAR: PLAYER PROFILE & ECONOMY */}
      <div className="relative z-10 w-full p-4 md:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md">
        {/* Logo Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-7 h-7 text-cyan-400 fill-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(6,182,212,0.6)]">
              N8-LIGHTNING
            </div>
            <div className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
              ARCADE MOTORSPORT • V1.0
            </div>
          </div>
        </div>

        {/* Player Stats & Economy */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Level & XP */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>LEVEL <strong className="text-cyan-400 text-sm">{profile.level}</strong></span>
            </div>
            <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden mt-1 border border-slate-700/60">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
              {profile.xp} / {nextLevelXp} XP
            </div>
          </div>

          {/* Credits Balance */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center space-x-2 shadow-lg">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Credits</div>
              <div className="text-lg md:text-xl font-black text-amber-300 font-mono">
                ${profile.credits.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => handleNavigate('SETTINGS')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Game Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CENTER HERO CALLOUT */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-cyan-950/60 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-3 backdrop-blur-sm">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-widest text-cyan-300 uppercase">
            NEXT-GEN WEB 3D ARCADE RACING
          </span>
        </div>

        <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          DEFY THE SPEED OF LIGHT
        </h1>

        <p className="text-sm md:text-base text-slate-300 max-w-2xl mt-2 font-medium">
          Nitro-fueled championship racing across futuristic neon cities, canyon storms, and snowy mountain passes.
        </p>

        {/* Quick Stats Banner */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-950/70 border border-slate-800/80 px-6 py-2.5 rounded-2xl backdrop-blur-md">
          <div>CARS OWNED: <strong className="text-white ml-1">{profile.ownedCarIds.length} / 6</strong></div>
          <div className="w-1 h-1 bg-slate-700 rounded-full" />
          <div>VICTORIES: <strong className="text-cyan-400 ml-1">{profile.totalWins}</strong></div>
          <div className="w-1 h-1 bg-slate-700 rounded-full" />
          <div>TOTAL DISTANCE: <strong className="text-amber-400 ml-1">{profile.totalDistanceKm} KM</strong></div>
        </div>
      </div>

      {/* 3. GAME MODE CARDS (Asphalt 8 Style) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CAREER MODE */}
        <button
          onClick={() => handleNavigate('CAREER')}
          className="group relative bg-gradient-to-b from-cyan-950/70 to-slate-950/90 hover:from-cyan-900/80 hover:to-slate-900 border border-cyan-500/40 hover:border-cyan-400 p-5 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1.5 active:scale-95 text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/25 transition-all" />
          <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-400/40 rounded-xl flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            3 CHAPTERS • 12 EVENTS
          </div>
          <div className="text-2xl font-black italic text-white tracking-tight mt-1">
            CAREER
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Climb the world championship ladder, earn stars, and unlock legendary hypercars.
          </p>
        </button>

        {/* QUICK RACE */}
        <button
          onClick={() => handleNavigate('QUICK_RACE_SETUP')}
          className="group relative bg-gradient-to-b from-blue-950/70 to-slate-950/90 hover:from-blue-900/80 hover:to-slate-900 border border-blue-500/40 hover:border-blue-400 p-5 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1.5 active:scale-95 text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/25 transition-all" />
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/40 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            4 TRACKS • FULL GRID
          </div>
          <div className="text-2xl font-black italic text-white tracking-tight mt-1">
            QUICK RACE
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Pick your track, choose AI difficulty, and dive straight into high-speed action.
          </p>
        </button>

        {/* TIME TRIAL */}
        <button
          onClick={() => handleNavigate('TRACK_SELECT')}
          className="group relative bg-gradient-to-b from-purple-950/70 to-slate-950/90 hover:from-purple-900/80 hover:to-slate-900 border border-purple-500/40 hover:border-purple-400 p-5 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1.5 active:scale-95 text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/25 transition-all" />
          <div className="w-12 h-12 bg-purple-500/20 border border-purple-400/40 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Timer className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
            SOLO • HOT LAP
          </div>
          <div className="text-2xl font-black italic text-white tracking-tight mt-1">
            TIME TRIAL
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Master every apex and beat track records without traffic interference.
          </p>
        </button>

        {/* GARAGE */}
        <button
          onClick={() => handleNavigate('GARAGE')}
          className="group relative bg-gradient-to-b from-amber-950/70 to-slate-950/90 hover:from-amber-900/80 hover:to-slate-900 border border-amber-500/40 hover:border-amber-400 p-5 rounded-2xl shadow-xl transition-all duration-200 transform hover:-translate-y-1.5 active:scale-95 text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all" />
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/40 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            3D SHOWROOM • UPGRADES
          </div>
          <div className="text-2xl font-black italic text-white tracking-tight mt-1">
            GARAGE
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            Inspect vehicles in 3D, tune performance parameters, and customize race liveries.
          </p>
        </button>
      </div>

      {/* 4. FOOTER */}
      <div className="relative z-10 w-full px-6 py-3 text-center border-t border-slate-800/40 bg-slate-950/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <div>N8-LIGHTNING ENGINE • WEBGL HIGH PERFORMANCE</div>
        <div className="hidden sm:block">KEYBOARD: [W/A/S/D] • [SHIFT] NITRO • [SPACE] DRIFT • [R] RESET</div>
        <div>v1.0.0 RELEASE</div>
      </div>
    </div>
  );
};
