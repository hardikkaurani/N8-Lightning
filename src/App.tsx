import React from 'react';
import { useGameStore, gameStore } from './store/useGameStore';
import { MainMenu } from './components/ui/MainMenu';
import { GarageView } from './components/ui/GarageView';
import { CareerMap } from './components/ui/CareerMap';
import { TrackSelect } from './components/ui/TrackSelect';
import { RaceView } from './components/racing/RaceView';
import { ResultsModal } from './components/ui/ResultsModal';
import { SettingsModal } from './components/ui/SettingsModal';

export const App: React.FC = () => {
  const screen = useGameStore(s => s.screen);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050811] text-slate-100 select-none">
      {screen === 'MAIN_MENU' && <MainMenu />}
      {screen === 'GARAGE' && <GarageView />}
      {screen === 'CAREER' && <CareerMap />}
      {screen === 'QUICK_RACE_SETUP' && <TrackSelect initialMode="QUICK_RACE" />}
      {screen === 'TRACK_SELECT' && <TrackSelect initialMode="TIME_TRIAL" />}
      {screen === 'RACING' && <RaceView />}
      {screen === 'RESULTS' && (
        <div className="relative w-full h-full">
          <MainMenu />
          <ResultsModal />
        </div>
      )}
      {screen === 'SETTINGS' && (
        <div className="relative w-full h-full">
          <MainMenu />
          <SettingsModal onClose={() => gameStore.setScreen('MAIN_MENU')} />
        </div>
      )}
    </div>
  );
};

export default App;
