import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, gameStore } from '../../store/useGameStore';
import { VEHICLE_CONFIGS, calculateCarStats, getUpgradeCost } from '../../game/vehicles/vehicleConfigs';
import { GarageEngine } from '../../game/engine/garageEngine';
import { SoundManager } from '../../game/audio/soundManager';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Award, Gauge, Zap, Crosshair, Sparkles, Paintbrush } from 'lucide-react';

export const GarageView: React.FC = () => {
  const profile = useGameStore(s => s.profile);
  const containerRef = useRef<HTMLDivElement>(null);
  const garageEngineRef = useRef<GarageEngine | null>(null);
  const soundManager = SoundManager.getInstance();

  const [selectedIdx, setSelectedIdx] = useState(() => {
    const idx = VEHICLE_CONFIGS.findIndex(c => c.id === profile.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'PAINT'>('UPGRADES');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const car = VEHICLE_CONFIGS[selectedIdx];
  const isOwned = profile.ownedCarIds.includes(car.id);
  const isCurrentlySelected = profile.selectedCarId === car.id;

  const currentCustom = profile.carCustomizations[car.id] || {
    primaryColor: car.primaryColor,
    stripeColor: car.stripeColor,
    upgrades: { topSpeedLevel: 0, accelerationLevel: 0, handlingLevel: 0, nitroLevel: 0 }
  };

  const calculatedStats = calculateCarStats(car.baseStats, currentCustom.upgrades);

  // Mount 3D Garage Engine
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new GarageEngine(
      containerRef.current,
      car.id,
      currentCustom.primaryColor,
      currentCustom.stripeColor
    );
    garageEngineRef.current = engine;

    return () => {
      engine.dispose();
      garageEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update car in 3D scene when selection or paint changes
  useEffect(() => {
    if (garageEngineRef.current) {
      garageEngineRef.current.loadCar(car.id, currentCustom.primaryColor, currentCustom.stripeColor);
    }
  }, [selectedIdx, car.id, currentCustom.primaryColor, currentCustom.stripeColor]);

  const handlePrevCar = () => {
    soundManager.playUIClick();
    setPurchaseError(null);
    setSelectedIdx(prev => (prev === 0 ? VEHICLE_CONFIGS.length - 1 : prev - 1));
  };

  const handleNextCar = () => {
    soundManager.playUIClick();
    setPurchaseError(null);
    setSelectedIdx(prev => (prev === VEHICLE_CONFIGS.length - 1 ? 0 : prev + 1));
  };

  const handleSelectCar = () => {
    soundManager.playUIClick();
    gameStore.selectCar(car.id);
  };

  const handlePurchaseCar = () => {
    if (profile.credits < car.price) {
      setPurchaseError('Insufficient Credits! Race in Career or Quick Race to earn more.');
      return;
    }
    soundManager.playCheckpoint();
    const success = gameStore.purchaseCar(car.id);
    if (success) {
      setPurchaseError(null);
    }
  };

  const handleUpgrade = (type: 'topSpeedLevel' | 'accelerationLevel' | 'handlingLevel' | 'nitroLevel') => {
    const cost = getUpgradeCost(currentCustom.upgrades[type]);
    if (profile.credits < cost) {
      setPurchaseError(`Need $${cost.toLocaleString()} credits for this upgrade!`);
      return;
    }
    soundManager.playCheckpoint();
    gameStore.upgradeCar(car.id, type);
    setPurchaseError(null);
  };

  const handleColorChange = (primary: string) => {
    soundManager.playUIClick();
    gameStore.customizeCar(car.id, { primaryColor: primary });
  };

  const handleStripeChange = (stripe: string) => {
    soundManager.playUIClick();
    gameStore.customizeCar(car.id, { stripeColor: stripe });
  };

  const primaryPresets = ['#ea580c', '#0284c7', '#10b981', '#1e1b4b', '#e2e8f0', '#ef4444', '#f59e0b', '#8b5cf6'];
  const stripePresets = ['#f8fafc', '#eab308', '#38bdf8', '#c084fc', '#090d16', '#22c55e'];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* 3D CANVAS CONTAINER */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* TOP HEADER */}
      <div className="relative z-10 w-full p-4 md:p-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
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

        <div className="flex items-center space-x-3">
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-lg md:text-xl font-black text-amber-300 font-mono">
              ${profile.credits.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* CAR SWITCHER CONTROLS */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 pointer-events-none">
        <button
          onClick={handlePrevCar}
          className="p-3 md:p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-2xl text-white transition-all shadow-xl active:scale-90 pointer-events-auto cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Center Car Info Badge */}
        <div className="text-center pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800 px-6 py-3 rounded-2xl shadow-2xl">
          <div className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
            TIER {car.tier} • {car.category} CLASS
          </div>
          <div className="text-2xl md:text-4xl font-black italic text-white tracking-tight">
            {car.name}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5 hidden sm:block">
            {car.description}
          </p>
        </div>

        <button
          onClick={handleNextCar}
          className="p-3 md:p-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-2xl text-white transition-all shadow-xl active:scale-90 pointer-events-auto cursor-pointer"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* BOTTOM PANEL: STATS, UPGRADES, PAINT & ACTIONS */}
      <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-t-3xl shadow-2xl">
        {purchaseError && (
          <div className="mb-3 px-4 py-2 bg-red-950/80 border border-red-500/60 rounded-xl text-xs font-bold text-red-300 text-center animate-bounce">
            {purchaseError}
          </div>
        )}

        {/* Navigation Tabs & Selection Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('UPGRADES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'UPGRADES'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>PERFORMANCE TUNING</span>
            </button>

            <button
              onClick={() => setActiveTab('PAINT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'PAINT'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              <span>PAINT BOOTH</span>
            </button>
          </div>

          {/* Action Button: Purchase or Select */}
          <div>
            {!isOwned ? (
              <button
                onClick={handlePurchaseCar}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm tracking-wider uppercase rounded-xl shadow-xl active:scale-95 cursor-pointer flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>UNLOCK FOR ${car.price.toLocaleString()}</span>
              </button>
            ) : isCurrentlySelected ? (
              <div className="px-6 py-2.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-black text-sm tracking-wider uppercase rounded-xl flex items-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>SELECTED VEHICLE</span>
              </div>
            ) : (
              <button
                onClick={handleSelectCar}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-600/30 active:scale-95 cursor-pointer"
              >
                SELECT THIS CAR
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: PERFORMANCE UPGRADES */}
        {activeTab === 'UPGRADES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. TOP SPEED */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                  <span className="flex items-center space-x-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TOP SPEED</span>
                  </span>
                  <span className="text-white font-mono">{calculatedStats.topSpeed} KM/H</span>
                </div>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-sm ${
                        lvl <= currentCustom.upgrades.topSpeedLevel ? 'bg-cyan-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={!isOwned || currentCustom.upgrades.topSpeedLevel >= 5}
                onClick={() => handleUpgrade('topSpeedLevel')}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-[11px] font-bold text-cyan-400 rounded-lg transition-colors cursor-pointer"
              >
                {currentCustom.upgrades.topSpeedLevel >= 5 ? 'MAX LEVEL' : `UPGRADE ($${getUpgradeCost(currentCustom.upgrades.topSpeedLevel).toLocaleString()})`}
              </button>
            </div>

            {/* 2. ACCELERATION */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>ACCELERATION</span>
                  </span>
                  <span className="text-white font-mono">{calculatedStats.acceleration} / 100</span>
                </div>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-sm ${
                        lvl <= currentCustom.upgrades.accelerationLevel ? 'bg-amber-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={!isOwned || currentCustom.upgrades.accelerationLevel >= 5}
                onClick={() => handleUpgrade('accelerationLevel')}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-[11px] font-bold text-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                {currentCustom.upgrades.accelerationLevel >= 5 ? 'MAX LEVEL' : `UPGRADE ($${getUpgradeCost(currentCustom.upgrades.accelerationLevel).toLocaleString()})`}
              </button>
            </div>

            {/* 3. HANDLING */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                  <span className="flex items-center space-x-1">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                    <span>HANDLING</span>
                  </span>
                  <span className="text-white font-mono">{calculatedStats.handling} / 100</span>
                </div>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-sm ${
                        lvl <= currentCustom.upgrades.handlingLevel ? 'bg-emerald-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={!isOwned || currentCustom.upgrades.handlingLevel >= 5}
                onClick={() => handleUpgrade('handlingLevel')}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-[11px] font-bold text-emerald-400 rounded-lg transition-colors cursor-pointer"
              >
                {currentCustom.upgrades.handlingLevel >= 5 ? 'MAX LEVEL' : `UPGRADE ($${getUpgradeCost(currentCustom.upgrades.handlingLevel).toLocaleString()})`}
              </button>
            </div>

            {/* 4. NITRO */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>NITRO POWER</span>
                  </span>
                  <span className="text-white font-mono">{calculatedStats.nitro} / 100</span>
                </div>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div
                      key={lvl}
                      className={`h-2 flex-1 rounded-sm ${
                        lvl <= currentCustom.upgrades.nitroLevel ? 'bg-fuchsia-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={!isOwned || currentCustom.upgrades.nitroLevel >= 5}
                onClick={() => handleUpgrade('nitroLevel')}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-[11px] font-bold text-fuchsia-400 rounded-lg transition-colors cursor-pointer"
              >
                {currentCustom.upgrades.nitroLevel >= 5 ? 'MAX LEVEL' : `UPGRADE ($${getUpgradeCost(currentCustom.upgrades.nitroLevel).toLocaleString()})`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PAINT BOOTH */}
        {activeTab === 'PAINT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Paint */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Primary Body Paint
              </div>
              <div className="flex flex-wrap gap-2.5">
                {primaryPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-xl border-2 transition-all cursor-pointer shadow-md ${
                      currentCustom.primaryColor === color ? 'border-white scale-110 shadow-cyan-500/50' : 'border-slate-700 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Racing Stripes */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Aero Racing Stripes
              </div>
              <div className="flex flex-wrap gap-2.5">
                {stripePresets.map(color => (
                  <button
                    key={color}
                    onClick={() => handleStripeChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-9 h-9 rounded-xl border-2 transition-all cursor-pointer shadow-md ${
                      currentCustom.stripeColor === color ? 'border-white scale-110 shadow-cyan-500/50' : 'border-slate-700 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

