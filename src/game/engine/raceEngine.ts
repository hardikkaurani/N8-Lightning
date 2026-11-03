import * as THREE from 'three';
import { ActiveRaceConfig } from '../../store/useGameStore';
import { VEHICLE_CONFIGS, calculateCarStats } from '../vehicles/vehicleConfigs';
import { getTrackById } from '../tracks/trackConfigs';
import { TrackBuilder, BuiltTrack } from '../tracks/trackBuilder';
import { ProceduralCarBuilder, CarMeshContainer } from '../vehicles/proceduralCarBuilder';
import { VehiclePhysics } from '../physics/vehiclePhysics';
import { CollisionSystem } from '../physics/collisionSystem';
import { AIOpponent } from '../ai/aiOpponent';
import { CameraController } from '../camera/cameraController';
import { SoundManager } from '../audio/soundManager';
import { ParticleManager } from '../effects/particleManager';
import { InputManager } from '../controls/inputManager';
import { RaceResult, PlayerProfile } from '../../types/game';

export interface RaceHudState {
  speedKmh: number;
  rpm: number;
  currentGear: number;
  nitroAmount: number;
  isNitroActive: boolean;
  driftScore: number;
  isDrifting: boolean;
  position: number;
  totalRacers: number;
  currentLap: number;
  totalLaps: number;
  raceTime: number;
  bestLapTime: number;
  currentLapTime: number;
  countdown: number; // 3, 2, 1, 0 (GO), -1 (racing)
  checkpointNotice: string | null;
  minimapRacers: Array<{ id: string; t: number; isPlayer: boolean }>;
}

export class RaceEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private soundManager: SoundManager;
  private particleManager: ParticleManager;

  private builtTrack: BuiltTrack;
  private playerPhysics: VehiclePhysics;
  private playerMeshContainer: CarMeshContainer;
  private aiOpponents: AIOpponent[] = [];

  private raceConfig: ActiveRaceConfig;
  private playerProfile: PlayerProfile;

  // Race Timing & Progress
  private countdown = 3.99; // 3.. 2.. 1.. GO
  private isRaceActive = false;
  private isFinished = false;
  private raceTime = 0;
  private currentLapTime = 0;
  private bestLapTime = 999999;
  private currentLap = 1;
  private currentCheckpoint = 0;
  private totalCheckpoints = 12;

  // Stats for results
  private topSpeedReached = 0;
  private nitroUsedCount = 0;
  private wasNitroPressed = false;
  private checkpointNotice: string | null = null;
  private checkpointNoticeTimer = 0;

  // Callbacks
  private onHudUpdate: (hud: RaceHudState) => void;
  private onRaceFinish: (result: RaceResult) => void;
  private onPauseToggle: () => void;

  // Loop control
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private isPaused = false;

  constructor(
    container: HTMLElement,
    raceConfig: ActiveRaceConfig,
    playerProfile: PlayerProfile,
    onHudUpdate: (hud: RaceHudState) => void,
    onRaceFinish: (result: RaceResult) => void,
    onPauseToggle: () => void
  ) {
    this.container = container;
    this.raceConfig = raceConfig;
    this.playerProfile = playerProfile;
    this.onHudUpdate = onHudUpdate;
    this.onRaceFinish = onRaceFinish;
    this.onPauseToggle = onPauseToggle;

    const trackConfig = getTrackById(raceConfig.trackId);
    const carConfig = VEHICLE_CONFIGS.find(c => c.id === raceConfig.carId) || VEHICLE_CONFIGS[0];
    const carCustom = playerProfile.carCustomizations[carConfig.id] || {
      primaryColor: carConfig.primaryColor,
      stripeColor: carConfig.stripeColor,
      upgrades: { topSpeedLevel: 0, accelerationLevel: 0, handlingLevel: 0, nitroLevel: 0 }
    };
    const upgradedStats = calculateCarStats(carConfig.baseStats, carCustom.upgrades);

    // 1. SCENE & RENDERER SETUP
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(trackConfig.skyColor);
    this.scene.fog = new THREE.FogExp2(trackConfig.fogColor, 0.0018);

    this.renderer = new THREE.WebGLRenderer({
      antialias: playerProfile.settings.graphics !== 'LOW',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, playerProfile.settings.graphics === 'HIGH' ? 2.0 : 1.5));
    this.renderer.shadowMap.enabled = playerProfile.settings.graphics === 'HIGH';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 2. LIGHTING
    const hemiLight = new THREE.HemisphereLight(trackConfig.skyColor, trackConfig.ambientColor, 0.85);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(120, 250, 80);
    sunLight.castShadow = playerProfile.settings.graphics === 'HIGH';
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 600;
      sunLight.shadow.camera.left = -90;
      sunLight.shadow.camera.right = 90;
      sunLight.shadow.camera.top = 90;
      sunLight.shadow.camera.bottom = -90;
    }
    this.scene.add(sunLight);

    // 3. TRACK GENERATION
    this.builtTrack = TrackBuilder.buildTrack(trackConfig);
    this.scene.add(this.builtTrack.group);
    this.totalCheckpoints = this.builtTrack.checkpoints.length;

    // 4. PLAYER VEHICLE
    const startPos = this.builtTrack.startPosition.clone();
    this.playerPhysics = new VehiclePhysics(upgradedStats, startPos, this.builtTrack.startHeading);
    this.playerMeshContainer = ProceduralCarBuilder.createVehicle(carConfig, carCustom.primaryColor, carCustom.stripeColor);
    this.scene.add(this.playerMeshContainer.root);

    // 5. AI OPPONENTS (for Quick Race & Career)
    if (raceConfig.mode !== 'TIME_TRIAL') {
      const aiCount = 4;
      const aiCarPool = VEHICLE_CONFIGS.filter(c => c.id !== carConfig.id);
      const aiNames = ['ViperX', 'Phantom', 'StormRider', 'ApexZero', 'CyberClaw'];

      for (let i = 0; i < aiCount; i++) {
        const aiCar = aiCarPool[i % aiCarPool.length];
        const startT = 0.006 * (i + 1); // staggered start grid
        const laneOffset = (i % 2 === 0 ? -1 : 1) * (4.0 + (i * 1.5));
        const opponent = new AIOpponent(
          `ai_${i}`,
          aiNames[i % aiNames.length],
          aiCar.id,
          this.builtTrack.spline,
          startT,
          laneOffset,
          raceConfig.aiDifficulty
        );
        this.aiOpponents.push(opponent);
        this.scene.add(opponent.data.meshContainer.root);
      }
    }

    // 6. CONTROLLERS & MANAGERS
    this.cameraController = new CameraController(playerProfile.settings.cameraFov);
    this.soundManager = SoundManager.getInstance();
    this.soundManager.setVolumes(
      playerProfile.settings.masterVolume,
      playerProfile.settings.sfxVolume,
      playerProfile.settings.musicVolume
    );
    this.particleManager = new ParticleManager(this.scene);
    this.inputManager = new InputManager(
      () => this.onPauseToggle(),
      () => this.resetPlayerToTrack()
    );

    // Start Audio
    this.soundManager.startEngine();
    this.soundManager.startMusic();

    // Resize listener
    window.addEventListener('resize', this.handleResize);

    // Initial camera position
    this.cameraController.update(this.playerPhysics, 0.016, false);

    // Start Loop
    this.lastTime = performance.now();
    this.tick();
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.soundManager.stopEngine();
    } else {
      this.soundManager.startEngine();
      this.lastTime = performance.now();
    }
  }

  public resetPlayerToTrack() {
    // Find closest point along track spline
    const currentT = this.findClosestSplineT(this.playerPhysics.state.position);
    const pt = this.builtTrack.spline.getPointAt(currentT);
    const tangent = this.builtTrack.spline.getTangentAt(currentT).normalize();
    const heading = Math.atan2(-tangent.x, -tangent.z);

    this.playerPhysics.resetToTrack(pt.clone().add(new THREE.Vector3(0, 0.5, 0)), heading);
    this.soundManager.playCollision(0.6);
  }

  private tick = () => {
    this.animationFrameId = requestAnimationFrame(this.tick);
    if (this.isPaused) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.08);
    this.lastTime = now;

    // 1. COUNTDOWN LOGIC
    if (this.countdown > 0) {
      const prevInt = Math.floor(this.countdown);
      this.countdown -= dt;
      const newInt = Math.floor(this.countdown);

      if (prevInt !== newInt && newInt >= 0) {
        this.soundManager.playCountdown(newInt === 0);
      }

      if (this.countdown <= 0) {
        this.isRaceActive = true;
      }
    } else {
      this.raceTime += dt;
      this.currentLapTime += dt;
    }

    // 2. PLAYER INPUTS & VEHICLE PHYSICS
    const inputs = this.isRaceActive && !this.isFinished
      ? this.inputManager.getInputs(this.playerProfile.settings.steeringSensitivity)
      : { throttle: 0, brake: 0, steer: 0, drift: false, nitro: false };

    // Nitro counter
    if (inputs.nitro && !this.wasNitroPressed && this.playerPhysics.state.nitroAmount > 10) {
      this.nitroUsedCount++;
      this.wasNitroPressed = true;
    } else if (!inputs.nitro) {
      this.wasNitroPressed = false;
    }

    // Update player physics
    this.playerPhysics.update(inputs, dt, 0);

    // Track top speed
    if (this.playerPhysics.state.speedKmh > this.topSpeedReached) {
      this.topSpeedReached = this.playerPhysics.state.speedKmh;
    }

    // 3. AUDIO SYNCHRONIZATION
    this.soundManager.updateEnginePitch(
      this.playerPhysics.state.speedKmh,
      inputs.throttle > 0,
      this.playerPhysics.state.isNitroActive
    );

    if (this.playerPhysics.state.isNitroActive) {
      this.soundManager.startNitro();
    } else {
      this.soundManager.stopNitro();
    }

    this.soundManager.setDriftIntensity(
      this.playerPhysics.state.isDrifting ? (this.playerPhysics.state.driftAngle || 0.4) : 0
    );

    // 4. PARTICLE EFFECTS
    // Nitro flames
    if (this.playerPhysics.state.isNitroActive) {
      const carBack = new THREE.Vector3(0, 0, 1).applyEuler(this.playerPhysics.state.rotation);
      const exhaustWorldPositions = this.playerMeshContainer.exhaustPositions.map(pos =>
        pos.clone().applyEuler(this.playerPhysics.state.rotation).add(this.playerPhysics.state.position)
      );
      this.particleManager.emitNitroFlames(exhaustWorldPositions, carBack);
    }

    // Drift smoke
    if (this.playerPhysics.state.isDrifting && this.playerPhysics.state.speedKmh > 18) {
      const rearLeft = this.playerMeshContainer.rearLeftWheel.position.clone()
        .applyEuler(this.playerPhysics.state.rotation)
        .add(this.playerPhysics.state.position);
      const rearRight = this.playerMeshContainer.rearRightWheel.position.clone()
        .applyEuler(this.playerPhysics.state.rotation)
        .add(this.playerPhysics.state.position);
      this.particleManager.emitDriftSmoke([rearLeft, rearRight]);
    }

    this.particleManager.update(dt);

    // 5. TRACK BOUNDARY COLLISION
    const playerT = this.findClosestSplineT(this.playerPhysics.state.position);
    const closestTrackPt = this.builtTrack.spline.getPointAt(playerT);
    const trackTangent = this.builtTrack.spline.getTangentAt(playerT).normalize();

    const boundaryResult = CollisionSystem.checkTrackBoundaries(this.playerPhysics, closestTrackPt, trackTangent);
    if (boundaryResult.collided) {
      this.soundManager.playCollision(0.85);
      this.cameraController.addShake(0.5);
      this.particleManager.emitSparks(this.playerPhysics.state.position, boundaryResult.normal);
    }

    // 6. AI OPPONENTS UPDATE & CAR-TO-CAR COLLISION
    if (this.isRaceActive) {
      for (const ai of this.aiOpponents) {
        ai.update(dt, this.totalCheckpoints, this.raceConfig.laps, this.raceTime);
        // Collide with player
        const hitPlayer = CollisionSystem.resolveCarToCar(this.playerPhysics, ai.data.physics);
        if (hitPlayer) {
          this.soundManager.playCollision(0.65);
          this.cameraController.addShake(0.35);
        }
      }

      // Collide AI with each other
      for (let i = 0; i < this.aiOpponents.length; i++) {
        for (let j = i + 1; j < this.aiOpponents.length; j++) {
          CollisionSystem.resolveCarToCar(this.aiOpponents[i].data.physics, this.aiOpponents[j].data.physics);
        }
      }
    }

    // 7. CHECKPOINT & LAP PROGRESSION
    this.updatePlayerLapProgress(playerT);

    // 8. SYNC PLAYER MESH
    this.playerMeshContainer.root.position.copy(this.playerPhysics.state.position);
    this.playerMeshContainer.root.quaternion.copy(this.playerPhysics.state.quaternion);
    this.playerMeshContainer.updateAnimation(
      this.playerPhysics.state.wheelRotation,
      this.playerPhysics.state.steerAngle,
      inputs.brake > 0,
      this.playerPhysics.state.isNitroActive
    );

    // 9. UPDATE CAMERA
    this.cameraController.update(this.playerPhysics, dt, this.playerPhysics.state.isNitroActive);

    // 10. UPDATE HUD STATE
    this.updateHud(playerT);

    // 11. RENDER
    this.renderer.render(this.scene, this.cameraController.camera);
  };

  private updatePlayerLapProgress(playerT: number) {
    const expectedCpFrac = (this.currentCheckpoint + 1) / this.totalCheckpoints;

    // Check if crossing finish line
    if (this.currentCheckpoint === this.totalCheckpoints - 1 && playerT < 0.1) {
      this.currentCheckpoint = 0;
      if (this.currentLapTime < this.bestLapTime) {
        this.bestLapTime = this.currentLapTime;
      }
      this.currentLapTime = 0;
      this.currentLap++;

      this.soundManager.playCheckpoint();
      this.triggerNotice(`LAP ${this.currentLap} / ${this.raceConfig.laps}`);

      if (this.currentLap > this.raceConfig.laps && !this.isFinished) {
        this.finishRace();
      }
    } else if (
      playerT >= (this.currentCheckpoint / this.totalCheckpoints) &&
      playerT < ((this.currentCheckpoint + 2) / this.totalCheckpoints)
    ) {
      if (playerT >= expectedCpFrac) {
        this.currentCheckpoint++;
        this.soundManager.playCheckpoint();
      }
    }

    if (this.checkpointNoticeTimer > 0) {
      this.checkpointNoticeTimer -= 0.016;
      if (this.checkpointNoticeTimer <= 0) {
        this.checkpointNotice = null;
      }
    }
  }

  private triggerNotice(text: string) {
    this.checkpointNotice = text;
    this.checkpointNoticeTimer = 2.5;
  }

  private findClosestSplineT(pos: THREE.Vector3): number {
    let bestT = 0;
    let minDist = Infinity;
    const checks = 120;
    for (let i = 0; i < checks; i++) {
      const t = i / checks;
      const pt = this.builtTrack.spline.getPointAt(t);
      const d = pt.distanceToSquared(pos);
      if (d < minDist) {
        minDist = d;
        bestT = t;
      }
    }
    return bestT;
  }

  private calculatePlayerPosition(playerT: number): number {
    const playerTotalProgress = (this.currentLap - 1) + playerT;
    let pos = 1;

    for (const ai of this.aiOpponents) {
      const aiTotalProgress = (ai.data.currentLap - 1) + ai.data.lapProgress;
      if (aiTotalProgress > playerTotalProgress) {
        pos++;
      }
    }
    return pos;
  }

  private updateHud(playerT: number) {
    const position = this.calculatePlayerPosition(playerT);
    const minimapRacers = [
      { id: 'player', t: playerT, isPlayer: true },
      ...this.aiOpponents.map(ai => ({ id: ai.data.id, t: ai.data.lapProgress, isPlayer: false }))
    ];

    this.onHudUpdate({
      speedKmh: this.playerPhysics.state.speedKmh,
      rpm: this.playerPhysics.state.rpm,
      currentGear: this.playerPhysics.state.currentGear,
      nitroAmount: this.playerPhysics.state.nitroAmount,
      isNitroActive: this.playerPhysics.state.isNitroActive,
      driftScore: this.playerPhysics.state.driftScore,
      isDrifting: this.playerPhysics.state.isDrifting,
      position,
      totalRacers: this.aiOpponents.length + 1,
      currentLap: Math.min(this.currentLap, this.raceConfig.laps),
      totalLaps: this.raceConfig.laps,
      raceTime: this.raceTime,
      bestLapTime: this.bestLapTime < 99999 ? this.bestLapTime : this.currentLapTime,
      currentLapTime: this.currentLapTime,
      countdown: this.countdown > 0 ? Math.ceil(this.countdown) : (this.countdown > -1.0 ? 0 : -1),
      checkpointNotice: this.checkpointNotice,
      minimapRacers,
    });
  }

  private finishRace() {
    this.isFinished = true;
    const finalPos = this.calculatePlayerPosition(this.findClosestSplineT(this.playerPhysics.state.position));
    const trackConfig = getTrackById(this.raceConfig.trackId);
    const carConfig = VEHICLE_CONFIGS.find(c => c.id === this.raceConfig.carId) || VEHICLE_CONFIGS[0];

    // Rewards Calculation
    let baseCredits = 4000;
    let baseXP = 350;

    if (finalPos === 1) {
      baseCredits += 8000;
      baseXP += 600;
    } else if (finalPos === 2) {
      baseCredits += 4500;
      baseXP += 350;
    } else if (finalPos === 3) {
      baseCredits += 2500;
      baseXP += 200;
    }

    // Drift & Nitro bonuses
    const driftBonus = Math.min(5000, Math.round(this.playerPhysics.state.driftScore * 1.5));
    const totalCredits = baseCredits + driftBonus;
    const totalXP = baseXP + Math.round(driftBonus * 0.2);

    // Career Stars calculation if career mode
    let starsEarned = 1; // Completed race
    if (finalPos <= 2) starsEarned = 2;
    if (finalPos === 1) starsEarned = 3;

    // Check specific career objectives if event exists
    if (this.raceConfig.careerEventId) {
      if (this.raceConfig.targetTime && this.raceTime <= this.raceConfig.targetTime) {
        starsEarned = 3;
      }
      if (this.raceConfig.targetDriftScore && this.playerPhysics.state.driftScore >= this.raceConfig.targetDriftScore) {
        starsEarned = 3;
      }
    }

    const result: RaceResult = {
      trackId: trackConfig.id,
      trackName: trackConfig.name,
      carId: carConfig.id,
      carName: carConfig.name,
      mode: this.raceConfig.mode,
      position: finalPos,
      totalRacers: this.aiOpponents.length + 1,
      totalTime: this.raceTime,
      bestLapTime: this.bestLapTime < 99999 ? this.bestLapTime : this.raceTime / this.raceConfig.laps,
      topSpeedReached: this.topSpeedReached,
      driftScore: this.playerPhysics.state.driftScore,
      nitroUsedCount: this.nitroUsedCount,
      starsEarned,
      creditsEarned: totalCredits,
      xpEarned: totalXP,
      isNewBestTime: false, // will be evaluated by store
      completedAt: Date.now(),
    };

    setTimeout(() => {
      this.onRaceFinish(result);
    }, 1200);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.cameraController.handleResize(width, height);
    this.renderer.setSize(width, height);
  };

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    this.inputManager.dispose();
    this.soundManager.stopEngine();
    this.soundManager.stopNitro();
    this.soundManager.stopMusic();
    this.particleManager.dispose(this.scene);
    this.builtTrack.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

