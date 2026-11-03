import * as THREE from 'three';
import { VehiclePhysics } from '../physics/vehiclePhysics';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3;
  private currentLookAt: THREE.Vector3;

  private baseDist = 7.0;
  private baseHeight = 2.4;
  private baseFov: number;

  private shakeIntensity = 0;
  private shakeDecay = 6.0;

  constructor(fov = 72) {
    this.baseFov = fov;
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.2, 2000);
    this.currentPos = new THREE.Vector3(0, 5, 10);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
  }

  public update(vehicle: VehiclePhysics, dt: number, isNitro: boolean) {
    const clampedDt = Math.min(dt, 0.08);
    const carPos = vehicle.state.position;
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(vehicle.state.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(vehicle.state.rotation);

    // Speed-based distance pull-back
    const speedRatio = Math.min(1.0, vehicle.state.speedKmh / 280);
    const dynamicDist = this.baseDist + speedRatio * 1.8 + (isNitro ? 1.2 : 0);
    const dynamicHeight = this.baseHeight + speedRatio * 0.4;

    // Camera target position: behind and above the car
    const targetPos = carPos.clone()
      .sub(forward.clone().multiplyScalar(dynamicDist))
      .add(new THREE.Vector3(0, dynamicHeight, 0));

    // Slight lateral offset during drift to frame the slide
    if (vehicle.state.isDrifting) {
      const driftSide = Math.sign(vehicle.state.driftAngle || 1);
      targetPos.add(right.clone().multiplyScalar(driftSide * -0.8));
    }

    // Smooth position interpolation
    this.currentPos.lerp(targetPos, Math.min(1, 9 * clampedDt));

    // Look-at point slightly ahead of the car
    const targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(10)).add(new THREE.Vector3(0, 1.1, 0));
    this.currentLookAt.lerp(targetLookAt, Math.min(1, 12 * clampedDt));

    // Camera shake
    if (this.shakeIntensity > 0.001) {
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.camera.position.copy(this.currentPos).add(shakeOffset);
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * clampedDt);
    } else {
      this.camera.position.copy(this.currentPos);
    }

    this.camera.lookAt(this.currentLookAt);

    // Dynamic FOV warp
    const targetFov = this.baseFov + (isNitro ? 14 : speedRatio * 8);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 8 * clampedDt);
    this.camera.updateProjectionMatrix();
  }

  public addShake(amount = 0.4) {
    this.shakeIntensity = Math.min(0.85, this.shakeIntensity + amount);
  }

  public handleResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
