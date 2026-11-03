import * as THREE from 'three';
import { VehiclePhysics, VehicleInputs } from '../physics/vehiclePhysics';
import { CarMeshContainer, ProceduralCarBuilder } from '../vehicles/proceduralCarBuilder';
import { VEHICLE_CONFIGS } from '../vehicles/vehicleConfigs';
import { AIDifficulty } from '../../types/game';

export interface AIRacerData {
  id: string;
  name: string;
  carId: string;
  physics: VehiclePhysics;
  meshContainer: CarMeshContainer;
  currentCheckpoint: number;
  currentLap: number;
  lapProgress: number; // 0 to 1 along track spline
  isFinished: boolean;
  finishTime: number | null;
  laneOffset: number; // -8 to +8 meters across track width
  difficultyMultiplier: number;
}

export class AIOpponent {
  public data: AIRacerData;
  private spline: THREE.CatmullRomCurve3;
  private nitroTimer = 0;

  constructor(
    id: string,
    name: string,
    carConfigId: string,
    spline: THREE.CatmullRomCurve3,
    startT: number,
    laneOffset: number,
    difficulty: AIDifficulty
  ) {
    this.spline = spline;
    const config = VEHICLE_CONFIGS.find(c => c.id === carConfigId) || VEHICLE_CONFIGS[1];

    // Starting position along track spline with lateral offset
    const pt = spline.getPointAt(startT);
    const tangent = spline.getTangentAt(startT).normalize();
    const binormal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const spawnPos = pt.clone().addScaledVector(binormal, laneOffset);
    const heading = Math.atan2(-tangent.x, -tangent.z);

    const physics = new VehiclePhysics(config.baseStats, spawnPos, heading);
    const meshContainer = ProceduralCarBuilder.createVehicle(config);

    let diffMult = 0.88;
    if (difficulty === 'EASY') diffMult = 0.78;
    if (difficulty === 'HARD') diffMult = 0.98;

    this.data = {
      id,
      name,
      carId: config.id,
      physics,
      meshContainer,
      currentCheckpoint: 0,
      currentLap: 1,
      lapProgress: startT,
      isFinished: false,
      finishTime: null,
      laneOffset,
      difficultyMultiplier: diffMult,
    };
  }

  public update(dt: number, totalCheckpoints: number, maxLaps: number, raceTime: number) {
    if (this.data.isFinished) {
      // Brake to stop after finishing
      this.data.physics.update({ throttle: 0, brake: 0.8, steer: 0, drift: false, nitro: false }, dt, 0);
      this.syncMesh();
      return;
    }

    // 1. LOOK-AHEAD TARGET POINT ALONG SPLINE
    const lookAheadDist = 0.035; // ~3.5% of track ahead
    let targetT = (this.data.lapProgress + lookAheadDist) % 1.0;
    if (targetT < 0) targetT += 1.0;

    const targetSplinePt = this.spline.getPointAt(targetT);
    const targetTangent = this.spline.getTangentAt(targetT).normalize();
    const targetBinormal = new THREE.Vector3(-targetTangent.z, 0, targetTangent.x).normalize();
    // Offset target into assigned lane
    const targetPos = targetSplinePt.clone().addScaledVector(targetBinormal, this.data.laneOffset);

    // 2. STEERING TO TARGET
    const carPos = this.data.physics.state.position;
    const toTarget = targetPos.clone().sub(carPos);
    toTarget.y = 0;

    const carForward = new THREE.Vector3(0, 0, -1).applyEuler(this.data.physics.state.rotation);
    const carRight = new THREE.Vector3(1, 0, 0).applyEuler(this.data.physics.state.rotation);

    const forwardDot = toTarget.clone().normalize().dot(carForward);
    const rightDot = toTarget.clone().normalize().dot(carRight);

    // Steer angle proportional to lateral offset from target vector
    let steerInput = Math.max(-1, Math.min(1, rightDot * 2.2));

    // 3. THROTTLE & BRAKING
    // Sharp turns reduce throttle / apply light brake
    const isSharpTurn = Math.abs(steerInput) > 0.45;
    let throttle = isSharpTurn ? 0.65 : 1.0;
    let brake = 0;

    const maxSpeedMs = (this.data.physics.stats.topSpeed * this.data.difficultyMultiplier * 1000) / 3600;
    const currentSpeedMs = this.data.physics.state.velocity.length();

    if (currentSpeedMs > maxSpeedMs) {
      throttle = 0.2;
      brake = 0.3;
    }

    // 4. NITRO USAGE (on straights)
    this.nitroTimer += dt;
    let nitro = false;
    if (!isSharpTurn && this.nitroTimer > 6.0 && this.data.physics.state.nitroAmount > 30) {
      nitro = true;
      if (this.nitroTimer > 8.5) {
        this.nitroTimer = 0;
      }
    }

    // 5. UPDATE VEHICLE PHYSICS
    const inputs: VehicleInputs = {
      throttle,
      brake,
      steer: steerInput,
      drift: isSharpTurn && currentSpeedMs > 15,
      nitro,
    };

    this.data.physics.update(inputs, dt, 0);

    // 6. UPDATE LAP PROGRESS & CHECKPOINTS
    // Find closest t along spline
    const currentT = this.findClosestSplineT(carPos);
    this.data.lapProgress = currentT;

    // Checkpoint gate advance
    const expectedCpFrac = (this.data.currentCheckpoint + 1) / totalCheckpoints;
    // Account for wrap around at finish line
    if (this.data.currentCheckpoint === totalCheckpoints - 1 && currentT < 0.1) {
      this.data.currentCheckpoint = 0;
      this.data.currentLap++;
      if (this.data.currentLap > maxLaps) {
        this.data.isFinished = true;
        this.data.finishTime = raceTime;
      }
    } else if (currentT >= (this.data.currentCheckpoint / totalCheckpoints) && currentT < ((this.data.currentCheckpoint + 2) / totalCheckpoints)) {
      if (currentT >= expectedCpFrac) {
        this.data.currentCheckpoint++;
      }
    }

    this.syncMesh();
  }

  private findClosestSplineT(pos: THREE.Vector3): number {
    // Fast local search around current progress
    let bestT = this.data.lapProgress;
    let minDist = Infinity;

    for (let step = -5; step <= 8; step++) {
      let t = (this.data.lapProgress + step * 0.005) % 1.0;
      if (t < 0) t += 1.0;
      const pt = this.spline.getPointAt(t);
      const d = pt.distanceToSquared(pos);
      if (d < minDist) {
        minDist = d;
        bestT = t;
      }
    }
    return bestT;
  }

  private syncMesh() {
    const state = this.data.physics.state;
    this.data.meshContainer.root.position.copy(state.position);
    this.data.meshContainer.root.quaternion.copy(state.quaternion);
    this.data.meshContainer.updateAnimation(
      state.wheelRotation,
      state.steerAngle,
      false,
      state.isNitroActive
    );
  }
}
