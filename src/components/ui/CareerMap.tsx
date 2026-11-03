import React, { useState } from 'react';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { CAREER_EVENTS, getTotalEarnedStars } from '../../game/career/careerEvents';
import { getTrackById } from '../../game/tracks/trackConfigs';
import { SoundManager } from '../../game/audio/soundManager';
import { ArrowLeft, Star, Lock, Play, Trophy, Award, Zap, Timer } from 'lucide-react';

export const CareerMap: React.FC = () => {
  const profile = useGameStore(s => s.profile);
  const soundManager = SoundManager.getInstance();

  const [selectedChapter, setSelectedChapter] = useState<1 | 2 | 3>(1);
  const totalStars = getTotalEarnedStars(profile.careerProgress);

  const chapterEvents = CAREER_EVENTS.filter(e => e.chapter === selectedChapter);

  const handleStartEvent = (eventId: string) => {
    soundManager.playUIClick();
    gameStore.startCareerEvent(eventId);
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-[#04060d] via-[#090d1a] to-[#04060d] text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
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

        {/* Total Stars Counter */}
        <div className="flex items-center space-x-4">
          <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl px-5 py-2 flex items-center space-x-2 shadow-lg">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stars Earned</div>
              <div className="text-xl font-black text-amber-300 font-mono">
                {totalStars} <span className="text-xs text-slate-500">/ 36</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHAPTER SELECTOR TABS */}
      <div className="max-w-5xl mx-auto w-full my-6">
        <div className="text-center mb-6">
          <div className="text-xs font-black tracking-widest text-cyan-400 uppercase">
            N8-LIGHTNING WORLD CHAMPIONSHIP
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-white mt-1">
            CAREER CAMPAIGN
          </h1>
        </div>

        <div className="flex justify-center gap-3">
          {[
            { ch: 1, title: 'CHAPTER 1: STREET AWAKENING', req: 0 },
            { ch: 2, title: 'CHAPTER 2: PRO CIRCUIT', req: 10 },
            { ch: 3, title: 'CHAPTER 3: APEX LEGENDS', req: 25 },
          ].map(c => {
            const isUnlocked = totalStars >= c.req;
            const isCurrent = selectedChapter === c.ch;

            return (
              <button
                key={c.ch}
                disabled={!isUnlocked}
                onClick={() => {
                  soundManager.playUIClick();
                  setSelectedChapter(c.ch as 1 | 2 | 3);
                }}
                className={`px-4 py-3 rounded-2xl border text-xs font-black tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                  isCurrent
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                    : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                <span>{c.title}</span>
                {!isUnlocked && <span className="text-[10px] text-amber-500">({c.req} ★)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. EVENT GRID FOR SELECTED CHAPTER (4 Events) */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        {chapterEvents.map(event => {
          const track = getTrackById(event.trackId);
          const eventProgress = profile.careerProgress[event.id];
          const starsAchieved = eventProgress?.stars || 0;
          const isUnlocked = totalStars >= event.requiredStars;

          return (
            <div
              key={event.id}
              className={`p-5 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-slate-900/85 border-slate-800 hover:border-cyan-500/60 shadow-xl'
                  : 'bg-slate-950/40 border-slate-900/80 opacity-60'
              }`}
            >
              <div>
                {/* Header: Track & Difficulty */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                    {track.name} • {event.laps} LAPS
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= starsAchieved ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xl font-black italic text-white tracking-tight">
                  {event.title}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {event.description}
                </p>

                {/* Objectives */}
                <div className="mt-4 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>★ 1: {event.objectives.star1}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>★ 2: {event.objectives.star2}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>★ 3: {event.objectives.star3}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Rewards & Race Button */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800/60">
                <div className="flex items-center space-x-3 text-xs font-mono font-bold">
                  <span className="text-amber-400">+${event.rewardCredits.toLocaleString()}</span>
                  <span className="text-cyan-400">+{event.rewardXP} XP</span>
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => handleStartEvent(event.id)}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-lg active:scale-95 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START RACE</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                    <span>REQUIRES {event.requiredStars} ★</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
