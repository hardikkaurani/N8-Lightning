import * as THREE from 'three';
import { VehicleStats } from '../../types/game';

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to 1
  drift: boolean;
  nitro: boolean;
}

export interface VehicleState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  speedKmh: number;
  angularVelocity: number;
  isDrifting: boolean;
  driftAngle: number;
  driftScore: number;
  nitroAmount: number; // 0 to 100
  isNitroActive: boolean;
  isAirborne: boolean;
  steerAngle: number;
  wheelRotation: number;
  currentGear: number;
  rpm: number;
}

export class VehiclePhysics {
  public state: VehicleState;
  public stats: VehicleStats;

  // Car geometry bounds
  public length = 4.4;
  public width = 2.0;
  public height = 1.2;

  // Handling constants
  private gravity = 25.0;
  private groundY = 0.0;
  private maxSteerAngle = 0.55; // radians (~31 degrees)
  private mass = 1350; // kg

  constructor(stats: VehicleStats, startPos: THREE.Vector3 = new THREE.Vector3(), startYaw = 0) {
    this.stats = stats;
    this.groundY = startPos.y;

    this.state = {
      position: startPos.clone(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(0, startYaw, 0, 'YXZ'),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, startYaw, 0)),
      speedKmh: 0,
      angularVelocity: 0,
      isDrifting: false,
      driftAngle: 0,
      driftScore: 0,
      nitroAmount: 100, // Starts full for high-octane initial burst
      isNitroActive: false,
      isAirborne: false,
      steerAngle: 0,
      wheelRotation: 0,
      currentGear: 1,
      rpm: 1000,
    };
  }

  public update(inputs: VehicleInputs, dt: number, targetGroundY = 0) {
    // Clamp delta time to avoid instability on frame hitch
    const clampedDt = Math.min(dt, 0.08);

    // 1. NITRO LOGIC
    if (inputs.nitro && this.state.nitroAmount > 5) {
      this.state.isNitroActive = true;
      this.state.nitroAmount = Math.max(0, this.state.nitroAmount - 24 * clampedDt);
    } else {
      this.state.isNitroActive = false;
      // Passive regeneration
      const passiveRegen = this.state.isDrifting ? 18.0 : (this.state.speedKmh > 150 ? 5.0 : 2.5);
      this.state.nitroAmount = Math.min(100, this.state.nitroAmount + passiveRegen * clampedDt);
    }

    // 2. DIRECTION VECTORS
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.state.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(this.state.rotation);

    // Forward and lateral speed
    const forwardSpeed = this.state.velocity.dot(forward);
    const lateralSpeed = this.state.velocity.dot(right);
    const totalLinearSpeed = this.state.velocity.length();
    this.state.speedKmh = Math.round(totalLinearSpeed * 3.6);

    // 3. DRIFT DETECTION
    const isTryingToDrift = inputs.drift && Math.abs(inputs.steer) > 0.25 && totalLinearSpeed > 6.0;
    if (isTryingToDrift) {
      this.state.isDrifting = true;
    } else if (this.state.isDrifting && (!inputs.drift || totalLinearSpeed < 4.0)) {
      this.state.isDrifting = false;
    }

    // 4. ACCELERATION & BRAKING FORCES
    const baseTopSpeedMs = (this.stats.topSpeed * 1000) / 3600;
    const maxTopSpeedMs = this.state.isNitroActive ? baseTopSpeedMs * 1.25 : baseTopSpeedMs;

    // Acceleration power curve
    const accelRating = this.stats.acceleration;
    let driveForce = 0;
    if (inputs.throttle > 0) {
      const speedRatio = Math.min(1, forwardSpeed / maxTopSpeedMs);
      const torqueCurve = Math.max(0.2, 1.0 - Math.pow(speedRatio, 1.6));
      let accelPower = (accelRating * 0.26) * torqueCurve;
      if (this.state.isNitroActive) {
        accelPower *= 2.0;
      }
      driveForce = accelPower * inputs.throttle * this.mass;
    }

    // Braking / Reverse
    let brakeForce = 0;
    if (inputs.brake > 0) {
      if (forwardSpeed > 1.5) {
        // Active braking
        brakeForce = -inputs.brake * 38.0 * this.mass;
      } else {
        // Reverse
        const reverseTopSpeed = 12.0; // ~43 km/h
        if (forwardSpeed > -reverseTopSpeed) {
          driveForce = -inputs.brake * 10.0 * this.mass;
        }
      }
    }

    // Rolling resistance and aerodynamic drag
    const aeroDragCoeff = 0.42;
    const dragForce = -0.5 * aeroDragCoeff * forwardSpeed * Math.abs(forwardSpeed) * 1.2;
    const rollingResistance = -forwardSpeed * 2.2 * this.mass;

    const netForwardForce = driveForce + brakeForce + dragForce + rollingResistance;
    const forwardAccel = netForwardForce / this.mass;

    // 5. STEERING & LATERAL GRIP
    // High speed dampening for arcade stability
    const speedDamping = Math.max(0.35, 1.0 - (totalLinearSpeed / (maxTopSpeedMs * 1.3)) * 0.65);
    const targetSteerAngle = -inputs.steer * this.maxSteerAngle * (this.state.isDrifting ? 1.4 : speedDamping);
    // Smooth steering interpolation
    this.state.steerAngle += (targetSteerAngle - this.state.steerAngle) * Math.min(1, 14 * clampedDt);

    // Yaw rotation
    const handlingTurnRate = (this.stats.handling / 100) * 2.8;
    const driftMultiplier = this.state.isDrifting ? 1.65 : 1.0;
    const turnVelocity = (this.state.steerAngle * handlingTurnRate * Math.sign(forwardSpeed || 1)) * driftMultiplier;

    // Lateral friction model
    const lateralGrip = this.state.isDrifting ? 0.38 : 0.94;
    const netLateralVelocity = lateralSpeed * (1.0 - lateralGrip * Math.min(1, 12 * clampedDt));

    // Update yaw rotation
    this.state.rotation.y += turnVelocity * clampedDt;

    // Calculate slip angle and drift points
    if (this.state.isDrifting && totalLinearSpeed > 6.0) {
      this.state.driftAngle = Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed) + 0.001);
      const driftPoints = Math.round(this.state.driftAngle * this.state.speedKmh * clampedDt * 18);
      this.state.driftScore += driftPoints;
    } else {
      this.state.driftAngle *= 0.85;
    }

    // 6. UPDATE VELOCITY VECTOR
    const newForwardSpeed = Math.max(-15, forwardSpeed + forwardAccel * clampedDt);
    const updatedHorizontalVelocity = forward.clone().multiplyScalar(newForwardSpeed).add(right.clone().multiplyScalar(netLateralVelocity));

    this.state.velocity.x = updatedHorizontalVelocity.x;
    this.state.velocity.z = updatedHorizontalVelocity.z;

    // 7. VERTICAL DYNAMICS & JUMPS
    this.groundY = targetGroundY;
    const currentY = this.state.position.y;
    const suspensionRestY = this.groundY;

    if (currentY > suspensionRestY + 0.15) {
      // Airborne
      this.state.isAirborne = true;
      this.state.velocity.y -= this.gravity * clampedDt;
      // Damping pitch/roll in mid-air to land stably
      this.state.rotation.x *= 0.96;
      this.state.rotation.z *= 0.96;
    } else {
      // Grounded
      this.state.isAirborne = false;
      this.state.velocity.y = 0;
      this.state.position.y = suspensionRestY;
      // Align roll/pitch with ground
      this.state.rotation.x = 0;
      this.state.rotation.z = 0;
    }

    // 8. UPDATE POSITION
    this.state.position.addScaledVector(this.state.velocity, clampedDt);

    // 9. ANIMATIONS: WHEELS & RPM
    const wheelCircumference = Math.PI * 0.65; // ~0.65m tire diameter
    const distTraveled = forwardSpeed * clampedDt;
    this.state.wheelRotation = (this.state.wheelRotation + distTraveled / wheelCircumference) % (Math.PI * 2);

    // Gear and RPM simulation
    this.state.currentGear = Math.min(6, Math.max(1, Math.floor(this.state.speedKmh / 55) + 1));
    const gearFraction = (this.state.speedKmh % 55) / 55;
    this.state.rpm = Math.round(1500 + gearFraction * 6000 + (this.state.isNitroActive ? 1200 : 0));

    // Update quaternion for Three.js mesh alignment
    this.state.quaternion.setFromEuler(this.state.rotation);
  }

  public launchJump(upwardVelocity: number, forwardBoost = 1.1) {
    this.state.velocity.y = upwardVelocity;
    this.state.velocity.x *= forwardBoost;
    this.state.velocity.z *= forwardBoost;
    this.state.isAirborne = true;
  }

  public applyCollisionImpulse(normal: THREE.Vector3, bounceStrength = 0.45, speedScrub = 0.7) {
    // Reflect velocity off collision normal
    const dot = this.state.velocity.dot(normal);
    if (dot < 0) {
      const impulse = normal.clone().multiplyScalar(-dot * (1 + bounceStrength));
      this.state.velocity.add(impulse);
      this.state.velocity.multiplyScalar(speedScrub);
    }
  }

  public resetToTrack(position: THREE.Vector3, forwardHeading: number, groundY = 0) {
    this.state.position.copy(position);
    this.state.position.y = groundY;
    this.state.velocity.set(0, 0, 0);
    this.state.rotation.set(0, forwardHeading, 0, 'YXZ');
    this.state.quaternion.setFromEuler(this.state.rotation);
    this.state.speedKmh = 0;
    this.state.isDrifting = false;
    this.state.driftAngle = 0;
    this.state.isAirborne = false;
    this.state.steerAngle = 0;
  }
}
