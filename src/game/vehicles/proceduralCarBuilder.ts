import * as THREE from 'three';
import { VehicleConfig } from '../../types/game';

export interface CarMeshContainer {
  root: THREE.Group;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  brakeLights: THREE.Mesh[];
  exhaustPositions: THREE.Vector3[];
  headlights: THREE.Mesh[];
  underglowLight: THREE.PointLight | null;
  updateAnimation: (wheelRot: number, steerAngle: number, isBraking: boolean, isNitro: boolean) => void;
}

export class ProceduralCarBuilder {
  public static createVehicle(
    config: VehicleConfig,
    customPrimaryColor?: string,
    customStripeColor?: string
  ): CarMeshContainer {
    const root = new THREE.Group();
    root.name = `Car_${config.id}`;

    const primaryHex = customPrimaryColor || config.primaryColor;
    const stripeHex = customStripeColor || config.stripeColor;

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryHex),
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.2,
    });

    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stripeHex),
      metalness: 0.6,
      roughness: 0.3,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85,
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.3,
      roughness: 0.6,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });

    const brakeLightOffMaterial = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.4,
    });

    const brakeLightOnMaterial = new THREE.MeshStandardMaterial({
      color: 0xff002b,
      emissive: new THREE.Color(0xff002b),
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    const headlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xdff9fb,
    });

    // 1. MAIN CHASSIS / LOWER BODY
    const lowerBodyGeo = new THREE.BoxGeometry(1.9, 0.42, 4.3);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    lowerBody.position.y = 0.42;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    root.add(lowerBody);

    // Racing Stripe on hood/roof
    const stripeGeo = new THREE.BoxGeometry(0.38, 0.43, 4.32);
    const stripe = new THREE.Mesh(stripeGeo, stripeMaterial);
    stripe.position.y = 0.42;
    root.add(stripe);

    // 2. CABIN / ROOF
    const cabinWidth = config.bodyStyle === 'hypercar' ? 1.3 : 1.45;
    const cabinLength = config.bodyStyle === 'prototype' ? 2.4 : (config.bodyStyle === 'muscle' ? 2.0 : 1.8);
    const cabinHeight = config.bodyStyle === 'hypercar' || config.bodyStyle === 'prototype' ? 0.45 : 0.55;

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.42 + 0.21 + cabinHeight * 0.5, -0.1);
    cabin.castShadow = true;
    root.add(cabin);

    // Windshield frame / A-pillars
    const roofCapGeo = new THREE.BoxGeometry(cabinWidth - 0.08, 0.06, cabinLength - 0.2);
    const roofCap = new THREE.Mesh(roofCapGeo, bodyMaterial);
    roofCap.position.set(0, cabin.position.y + cabinHeight * 0.5 + 0.03, -0.1);
    root.add(roofCap);

    // 3. FRONT HOOD & SPLITTER
    const splitterGeo = new THREE.BoxGeometry(1.98, 0.06, 0.6);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.18, -2.15);
    splitter.castShadow = true;
    root.add(splitter);

    // Hood intake scoop
    const scoopGeo = new THREE.BoxGeometry(0.5, 0.1, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, carbonMaterial);
    scoop.position.set(0, 0.65, -1.2);
    root.add(scoop);

    // 4. HEADLIGHTS
    const headlightGeo = new THREE.BoxGeometry(0.36, 0.12, 0.06);
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMaterial);
    hlLeft.position.set(-0.7, 0.48, -2.16);
    root.add(hlLeft);

    const hlRight = new THREE.Mesh(headlightGeo, headlightMaterial);
    hlRight.position.set(0.7, 0.48, -2.16);
    root.add(hlRight);

    // 5. REAR DIFFUSER & BRAKE LIGHTS
    const diffuserGeo = new THREE.BoxGeometry(1.92, 0.15, 0.4);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, 0.22, 2.15);
    root.add(diffuser);

    const brakeLightGeo = new THREE.BoxGeometry(0.42, 0.12, 0.06);
    const blLeft = new THREE.Mesh(brakeLightGeo, brakeLightOffMaterial);
    blLeft.position.set(-0.7, 0.52, 2.16);
    root.add(blLeft);

    const blRight = new THREE.Mesh(brakeLightGeo, brakeLightOffMaterial);
    blRight.position.set(0.7, 0.52, 2.16);
    root.add(blRight);

    // 6. GT REAR WING / SPOILER
    const hasBigWing = ['muscle', 'tuner', 'supercar', 'hypercar', 'prototype'].includes(config.bodyStyle);
    if (hasBigWing) {
      // Wing stands
      const standGeo = new THREE.BoxGeometry(0.06, 0.35, 0.12);
      const standL = new THREE.Mesh(standGeo, carbonMaterial);
      standL.position.set(-0.6, 0.75, 1.95);
      root.add(standL);

      const standR = new THREE.Mesh(standGeo, carbonMaterial);
      standR.position.set(0.6, 0.75, 1.95);
      root.add(standR);

      // Wing blade
      const bladeGeo = new THREE.BoxGeometry(2.0, 0.06, 0.35);
      const blade = new THREE.Mesh(bladeGeo, carbonMaterial);
      blade.position.set(0, 0.95, 1.98);
      blade.rotation.x = 0.08;
      blade.castShadow = true;
      root.add(blade);
    }

    // 7. EXHAUST PIPES
    const exhaustPositions: THREE.Vector3[] = [];
    const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12);
    exhaustGeo.rotateX(Math.PI / 2);

    const exL = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exL.position.set(-0.35, 0.26, 2.16);
    root.add(exL);
    exhaustPositions.push(new THREE.Vector3(-0.35, 0.26, 2.22));

    const exR = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exR.position.set(0.35, 0.26, 2.16);
    root.add(exR);
    exhaustPositions.push(new THREE.Vector3(0.35, 0.26, 2.22));

    // 8. 3D WHEELS BUILDER
    function buildWheel(): THREE.Group {
      const wheelGroup = new THREE.Group();

      // Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 20);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.27, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, chromeMaterial);
      wheelGroup.add(rimMesh);

      // Wheel Spokes
      const spokeGeo = new THREE.BoxGeometry(0.06, 0.42, 0.28);
      for (let i = 0; i < 3; i++) {
        const spoke = new THREE.Mesh(spokeGeo, carbonMaterial);
        spoke.rotation.x = (i * Math.PI) / 3;
        wheelGroup.add(spoke);
      }

      // Brake Disc
      const discGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.04, 16);
      discGeo.rotateZ(Math.PI / 2);
      const discMesh = new THREE.Mesh(discGeo, chromeMaterial);
      wheelGroup.add(discMesh);

      // Caliper (painted red)
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.09);
      const caliperMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(0, 0.12, 0);
      wheelGroup.add(caliper);

      return wheelGroup;
    }

    const wheelY = 0.34;
    const wheelTrackX = 0.98;
    const wheelBaseZ = 1.35;

    // Front Left
    const flGroup = new THREE.Group();
    flGroup.position.set(-wheelTrackX, wheelY, -wheelBaseZ);
    const flWheel = buildWheel();
    flGroup.add(flWheel);
    root.add(flGroup);

    // Front Right
    const frGroup = new THREE.Group();
    frGroup.position.set(wheelTrackX, wheelY, -wheelBaseZ);
    const frWheel = buildWheel();
    frGroup.add(frWheel);
    root.add(frGroup);

    // Rear Left
    const rlGroup = new THREE.Group();
    rlGroup.position.set(-wheelTrackX, wheelY, wheelBaseZ);
    const rlWheel = buildWheel();
    rlGroup.add(rlWheel);
    root.add(rlGroup);

    // Rear Right
    const rrGroup = new THREE.Group();
    rrGroup.position.set(wheelTrackX, wheelY, wheelBaseZ);
    const rrWheel = buildWheel();
    rrGroup.add(rrWheel);
    root.add(rrGroup);

    // 9. UNDERGLOW NEON
    let underglow: THREE.PointLight | null = null;
    if (config.glowColor) {
      underglow = new THREE.PointLight(new THREE.Color(config.glowColor), 1.8, 4.5);
      underglow.position.set(0, 0.1, 0);
      root.add(underglow);
    }

    // Animation update function
    const updateAnimation = (
      wheelRot: number,
      steerAngle: number,
      isBraking: boolean,
      isNitro: boolean
    ) => {
      // Rotate wheels on axle
      flWheel.rotation.x = wheelRot;
      frWheel.rotation.x = wheelRot;
      rlWheel.rotation.x = wheelRot;
      rrWheel.rotation.x = wheelRot;

      // Front steering
      flGroup.rotation.y = steerAngle;
      frGroup.rotation.y = steerAngle;

      // Brake light material toggle
      const activeBrakeMat = isBraking ? brakeLightOnMaterial : brakeLightOffMaterial;
      blLeft.material = activeBrakeMat;
      blRight.material = activeBrakeMat;

      // Nitro glow pulse
      if (underglow) {
        underglow.intensity = isNitro ? 3.5 : 1.5;
      }
    };

    return {
      root,
      frontLeftWheel: flGroup,
      frontRightWheel: frGroup,
      rearLeftWheel: rlGroup,
      rearRightWheel: rrGroup,
      brakeLights: [blLeft, blRight],
      exhaustPositions,
      headlights: [hlLeft, hlRight],
      underglowLight: underglow,
      updateAnimation,
    };
  }
}
