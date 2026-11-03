import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class ParticleManager {
  private particles: Particle[] = [];
  private maxParticles = 600;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;

  private positionsArray: Float32Array;
  private colorsArray: Float32Array;

  constructor(scene: THREE.Scene) {
    this.positionsArray = new Float32Array(this.maxParticles * 3);
    this.colorsArray = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionsArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colorsArray, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.frustumCulled = false;
    scene.add(this.pointsMesh);
  }

  public emitNitroFlames(exhaustWorldPositions: THREE.Vector3[], carBackward: THREE.Vector3, isCyan = true) {
    exhaustWorldPositions.forEach(pos => {
      for (let i = 0; i < 3; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const spread = new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        );
        const vel = carBackward.clone().multiplyScalar(12 + Math.random() * 8).add(spread);
        const col = isCyan
          ? new THREE.Color(0.1 + Math.random() * 0.2, 0.7 + Math.random() * 0.3, 1.0)
          : new THREE.Color(1.0, 0.4 + Math.random() * 0.3, 0.05);

        this.particles.push({
          position: pos.clone(),
          velocity: vel,
          color: col,
          size: 0.75 + Math.random() * 0.4,
          life: 0,
          maxLife: 0.18 + Math.random() * 0.1,
          alpha: 1.0,
        });
      }
    });
  }

  public emitDriftSmoke(wheelWorldPositions: THREE.Vector3[]) {
    wheelWorldPositions.forEach(pos => {
      if (this.particles.length >= this.maxParticles) return;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        0.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2.5
      );
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3(0, 0.1, 0)),
        velocity: vel,
        color: new THREE.Color(0.85, 0.88, 0.92),
        size: 0.9 + Math.random() * 0.6,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.3,
        alpha: 0.6,
      });
    });
  }

  public emitSparks(contactPos: THREE.Vector3, normal: THREE.Vector3) {
    for (let i = 0; i < 12; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = normal.clone().multiplyScalar(6 + Math.random() * 10).add(
        new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8)
      );
      this.particles.push({
        position: contactPos.clone(),
        velocity: vel,
        color: new THREE.Color(1.0, 0.8, 0.2),
        size: 0.35,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        alpha: 1.0,
      });
    }
  }

  public update(dt: number) {
    let pIdx = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      const lifeRatio = p.life / p.maxLife;

      this.positionsArray[pIdx * 3] = p.position.x;
      this.positionsArray[pIdx * 3 + 1] = p.position.y;
      this.positionsArray[pIdx * 3 + 2] = p.position.z;

      // Color fade
      const fade = 1 - lifeRatio;
      this.colorsArray[pIdx * 3] = p.color.r * fade;
      this.colorsArray[pIdx * 3 + 1] = p.color.g * fade;
      this.colorsArray[pIdx * 3 + 2] = p.color.b * fade;

      pIdx++;
    }

    // Zero out unused particle buffer
    for (let j = pIdx; j < this.maxParticles; j++) {
      this.positionsArray[j * 3] = 0;
      this.positionsArray[j * 3 + 1] = -9999;
      this.positionsArray[j * 3 + 2] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.pointsMesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}

