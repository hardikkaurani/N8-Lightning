import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VehiclePhysics } from '../game/physics/vehiclePhysics';

describe('VehiclePhysics', () => {
  const sampleStats = {
    topSpeed: 240,
    acceleration: 70,
    handling: 65,
    nitro: 70,
  };

  it('initializes with correct defaults and zero speed', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);
    expect(physics.state.speedKmh).toBe(0);
    expect(physics.state.nitroAmount).toBe(100);
    expect(physics.state.isDrifting).toBe(false);
  });

  it('accelerates forward when throttle is pressed', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);
    
    // Simulate acceleration
    for (let i = 0; i < 20; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 0.05, 0);
    }

    expect(physics.state.speedKmh).toBeGreaterThan(20);
    expect(physics.state.velocity.length()).toBeGreaterThan(5);
  });

  it('decelerates when brake is pressed', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);

    // Accelerate first
    for (let i = 0; i < 25; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 0.05, 0);
    }
    const speedBeforeBrake = physics.state.speedKmh;

    // Apply brake
    for (let i = 0; i < 15; i++) {
      physics.update({ throttle: 0, brake: 1, steer: 0, drift: false, nitro: false }, 0.05, 0);
    }

    expect(physics.state.speedKmh).toBeLessThan(speedBeforeBrake);
  });

  it('steers and updates yaw rotation', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);
    const initialYaw = physics.state.rotation.y;

    // Move forward and steer right
    for (let i = 0; i < 20; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 0.05, 0);
    }

    expect(physics.state.rotation.y).not.toBe(initialYaw);
  });

  it('consumes nitro and accelerates faster during boost', () => {
    const normalPhysics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);
    const nitroPhysics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);

    for (let i = 0; i < 25; i++) {
      normalPhysics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 0.05, 0);
      nitroPhysics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: true }, 0.05, 0);
    }

    expect(nitroPhysics.state.speedKmh).toBeGreaterThan(normalPhysics.state.speedKmh);
    expect(nitroPhysics.state.nitroAmount).toBeLessThan(100);
    expect(nitroPhysics.state.isNitroActive).toBe(true);
  });

  it('detects drift and accumulates drift points', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);

    // Get up to speed (> 10 m/s = > 36 km/h)
    for (let i = 0; i < 35; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 0.05, 0);
    }

    // Initiate drift while steering
    for (let i = 0; i < 20; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 1, drift: true, nitro: false }, 0.05, 0);
    }

    expect(physics.state.isDrifting).toBe(true);
    expect(physics.state.driftScore).toBeGreaterThan(0);
  });

  it('applies collision impulse and reduces speed on impact', () => {
    const physics = new VehiclePhysics(sampleStats, new THREE.Vector3(0, 0, 0), 0);

    for (let i = 0; i < 25; i++) {
      physics.update({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 0.05, 0);
    }
    const preCollisionSpeed = physics.state.velocity.length();

    // Hit a barrier normal that opposes forward velocity (car moving in -Z)
    physics.applyCollisionImpulse(new THREE.Vector3(0, 0, 1), 0.4, 0.7);

    expect(physics.state.velocity.length()).toBeLessThan(preCollisionSpeed);
  });
});
