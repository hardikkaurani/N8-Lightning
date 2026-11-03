import * as THREE from 'three';
import { VehiclePhysics } from './vehiclePhysics';

export interface SplinePointData {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  width: number;
}

export class CollisionSystem {
  public static checkTrackBoundaries(
    vehicle: VehiclePhysics,
    closestSplinePos: THREE.Vector3,
    tangent: THREE.Vector3,
    halfTrackWidth = 13.0
  ): { collided: boolean; normal: THREE.Vector3; penetration: number } {
    const toVehicle = vehicle.state.position.clone().sub(closestSplinePos);
    toVehicle.y = 0; // horizontal boundary plane

    // Project onto perpendicular direction (binormal)
    const binormal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const lateralDist = toVehicle.dot(binormal);

    if (Math.abs(lateralDist) > halfTrackWidth - (vehicle.width * 0.5)) {
      const sign = Math.sign(lateralDist);
      const normal = binormal.clone().multiplyScalar(-sign);
      const penetration = Math.abs(lateralDist) - (halfTrackWidth - (vehicle.width * 0.5));

      // Push back within bounds
      vehicle.state.position.addScaledVector(normal, penetration + 0.1);
      // Apply elastic impulse and speed scrub
      vehicle.applyCollisionImpulse(normal, 0.4, 0.75);

      return { collided: true, normal, penetration };
    }

    return { collided: false, normal: new THREE.Vector3(), penetration: 0 };
  }

  public static resolveCarToCar(a: VehiclePhysics, b: VehiclePhysics): boolean {
    const collisionRadius = 2.2; // combined bounding sphere
    const delta = a.state.position.clone().sub(b.state.position);
    delta.y = 0;
    const dist = delta.length();

    if (dist < collisionRadius && dist > 0.001) {
      const normal = delta.clone().divideScalar(dist);
      const penetration = collisionRadius - dist;

      // Position push apart
      a.state.position.addScaledVector(normal, penetration * 0.55);
      b.state.position.addScaledVector(normal, -penetration * 0.55);

      // Relative velocity
      const relVel = a.state.velocity.clone().sub(b.state.velocity);
      const separatingVel = relVel.dot(normal);

      if (separatingVel < 0) {
        const restitution = 0.5;
        const impulseMag = -(1 + restitution) * separatingVel * 0.5;
        const impulse = normal.clone().multiplyScalar(impulseMag);

        a.state.velocity.add(impulse);
        b.state.velocity.sub(impulse);
      }

      return true;
    }

    return false;
  }
}

