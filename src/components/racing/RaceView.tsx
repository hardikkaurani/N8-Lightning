import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { RaceEngine, RaceHudState } from '../../game/engine/raceEngine';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import { PauseModal } from '../ui/PauseModal';
import { SettingsModal } from '../ui/SettingsModal';
import { RaceResult } from '../../types/game';

export const RaceView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const raceEngineRef = useRef<RaceEngine | null>(null);

  const activeRaceConfig = useGameStore(s => s.activeRaceConfig);
  const profile = useGameStore(s => s.profile);
  const isPaused = useGameStore(s => s.isPaused);

  const [showSettings, setShowSettings] = useState(false);
  const [hudState, setHudState] = useState<RaceHudState>({
    speedKmh: 0,
    rpm: 1000,
    currentGear: 1,
    nitroAmount: 100,
    isNitroActive: false,
    driftScore: 0,
    isDrifting: false,
    position: 1,
    totalRacers: 5,
    currentLap: 1,
    totalLaps: activeRaceConfig.laps,
    raceTime: 0,
    bestLapTime: 0,
    currentLapTime: 0,
    countdown: 3,
    checkpointNotice: null,
    minimapRacers: [],
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || profile.settings.touchControls);
  }, [profile.settings.touchControls]);

  useEffect(() => {
    if (!containerRef.current) return;

    const onHudUpdate = (hud: RaceHudState) => {
      setHudState(hud);
    };

    const onRaceFinish = (result: RaceResult) => {
      gameStore.finishRace(result);
    };

    const onPauseToggle = () => {
      gameStore.setPaused(!gameStore.getState().isPaused);
    };

    const engine = new RaceEngine(
      containerRef.current,
      activeRaceConfig,
      profile,
      onHudUpdate,
      onRaceFinish,
      onPauseToggle
    );

    raceEngineRef.current = engine;

    return () => {
      engine.dispose();
      raceEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (raceEngineRef.current) {
      raceEngineRef.current.setPaused(isPaused);
    }
  }, [isPaused]);

  const handleResume = () => {
    gameStore.setPaused(false);
  };

  const handleRestart = () => {
    gameStore.setPaused(false);
    if (raceEngineRef.current) {
      raceEngineRef.current.resetPlayerToTrack();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Head-Up Display (HUD) */}
      <HUD state={hudState} onPause={() => gameStore.setPaused(true)} />

      {/* Mobile Touch Controls */}
      {isTouchDevice && raceEngineRef.current && (
        <MobileControls inputManager={raceEngineRef.current.getInputManager()} />
      )}

      {/* Pause Menu Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Settings Modal (from Pause) */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
