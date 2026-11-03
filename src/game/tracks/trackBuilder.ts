import * as THREE from 'three';
import { TrackConfig, TrackCheckpoint } from '../../types/game';

export interface BuiltTrack {
  group: THREE.Group;
  spline: THREE.CatmullRomCurve3;
  checkpoints: TrackCheckpoint[];
  startPosition: THREE.Vector3;
  startHeading: number;
  aiWaypoints: THREE.Vector3[];
  dispose: () => void;
}

export class TrackBuilder {
  public static buildTrack(config: TrackConfig): BuiltTrack {
    const trackGroup = new THREE.Group();
    trackGroup.name = `Track_${config.id}`;

    // 1. CREATE CLOSED 3D SPLINE
    const vectors = config.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const spline = new THREE.CatmullRomCurve3(vectors, true, 'centripetal');

    const sampleCount = 350;
    const roadWidth = 26.0; // wide arcade racing highway
    const halfWidth = roadWidth * 0.5;

    // Disposed resources tracker
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    // Materials
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.roadColor),
      roughness: 0.75,
      metalness: 0.15,
    });
    materialsToDispose.push(roadMaterial);

    const curbMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.curbColor),
      roughness: 0.5,
      metalness: 0.3,
    });
    materialsToDispose.push(curbMaterial);

    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.barrierColor),
      roughness: 0.3,
      metalness: 0.8,
    });
    materialsToDispose.push(barrierMaterial);

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });
    materialsToDispose.push(lineMaterial);

    // 2. EXTRUDE ROAD SURFACE MESH
    const roadGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Curb and Barrier positions
    const curbPositions: number[] = [];
    const curbIndices: number[] = [];

    const barrierPositions: number[] = [];
    const barrierIndices: number[] = [];

    const sampledPoints: THREE.Vector3[] = [];
    const sampledTangents: THREE.Vector3[] = [];
    const sampledBinormals: THREE.Vector3[] = [];

    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const pt = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const binormal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      sampledPoints.push(pt);
      sampledTangents.push(tangent);
      sampledBinormals.push(binormal);

      // Road Left & Right vertices
      const leftPt = pt.clone().addScaledVector(binormal, -halfWidth);
      const rightPt = pt.clone().addScaledVector(binormal, halfWidth);

      positions.push(leftPt.x, leftPt.y, leftPt.z);
      positions.push(rightPt.x, rightPt.y, rightPt.z);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);

      uvs.push(0, i * 0.5);
      uvs.push(1, i * 0.5);

      // Curbs (left and right strips)
      const curbL1 = pt.clone().addScaledVector(binormal, -halfWidth - 1.2);
      curbPositions.push(curbL1.x, curbL1.y + 0.15, curbL1.z);
      curbPositions.push(leftPt.x, leftPt.y, leftPt.z);

      const curbR1 = pt.clone().addScaledVector(binormal, halfWidth + 1.2);
      curbPositions.push(rightPt.x, rightPt.y, rightPt.z);
      curbPositions.push(curbR1.x, curbR1.y + 0.15, curbR1.z);

      // Barriers (outer guardrail walls)
      const barL_bot = curbL1;
      const barL_top = barL_bot.clone().setY(barL_bot.y + 1.8);
      barrierPositions.push(barL_bot.x, barL_bot.y, barL_bot.z);
      barrierPositions.push(barL_top.x, barL_top.y, barL_top.z);

      const barR_bot = curbR1;
      const barR_top = barR_bot.clone().setY(barR_bot.y + 1.8);
      barrierPositions.push(barR_bot.x, barR_bot.y, barR_bot.z);
      barrierPositions.push(barR_top.x, barR_top.y, barR_top.z);

      if (i < sampleCount) {
        const vIdx = i * 2;
        indices.push(vIdx, vIdx + 1, vIdx + 2);
        indices.push(vIdx + 1, vIdx + 3, vIdx + 2);

        // Curbs
        const cIdx = i * 4;
        curbIndices.push(cIdx, cIdx + 1, cIdx + 4);
        curbIndices.push(cIdx + 1, cIdx + 5, cIdx + 4);
        curbIndices.push(cIdx + 2, cIdx + 3, cIdx + 6);
        curbIndices.push(cIdx + 3, cIdx + 7, cIdx + 6);

        // Barriers
        const bIdx = i * 4;
        barrierIndices.push(bIdx, bIdx + 1, bIdx + 4);
        barrierIndices.push(bIdx + 1, bIdx + 5, bIdx + 4);
        barrierIndices.push(bIdx + 2, bIdx + 3, bIdx + 6);
        barrierIndices.push(bIdx + 3, bIdx + 7, bIdx + 6);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();
    geometriesToDispose.push(roadGeo);

    const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // Curbs Mesh
    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();
    geometriesToDispose.push(curbGeo);
    const curbMesh = new THREE.Mesh(curbGeo, curbMaterial);
    curbMesh.receiveShadow = true;
    trackGroup.add(curbMesh);

    // Barriers Mesh
    const barrierGeo = new THREE.BufferGeometry();
    barrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(barrierPositions, 3));
    barrierGeo.setIndex(barrierIndices);
    barrierGeo.computeVertexNormals();
    geometriesToDispose.push(barrierGeo);
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMaterial);
    barrierMesh.castShadow = true;
    barrierMesh.receiveShadow = true;
    trackGroup.add(barrierMesh);

    // Center Dashed Line
    const centerLineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    for (let i = 0; i < sampleCount; i += 2) {
      const p1 = sampledPoints[i].clone();
      const p2 = sampledPoints[i + 1].clone();
      p1.y += 0.05;
      p2.y += 0.05;
      linePositions.push(p1.x, p1.y, p1.z);
      linePositions.push(p2.x, p2.y, p2.z);
    }
    centerLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    geometriesToDispose.push(centerLineGeo);
    const lineMesh = new THREE.LineSegments(centerLineGeo, lineMaterial);
    trackGroup.add(lineMesh);

    // 3. START / FINISH GANTRY ARCH
    const startPoint = sampledPoints[0];
    const startTangent = sampledTangents[0];
    const startHeading = Math.atan2(-startTangent.x, -startTangent.z);

    const gantryGroup = new THREE.Group();
    gantryGroup.position.copy(startPoint);
    gantryGroup.rotation.y = startHeading;

    // Gantry pillars & overhead bridge
    const pillarGeo = new THREE.BoxGeometry(1.2, 9, 1.2);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    materialsToDispose.push(gantryMat);
    geometriesToDispose.push(pillarGeo);

    const pillarL = new THREE.Mesh(pillarGeo, gantryMat);
    pillarL.position.set(-halfWidth - 2, 4.5, 0);
    gantryGroup.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, gantryMat);
    pillarR.position.set(halfWidth + 2, 4.5, 0);
    gantryGroup.add(pillarR);

    const beamGeo = new THREE.BoxGeometry(roadWidth + 6, 1.8, 1.4);
    geometriesToDispose.push(beamGeo);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.set(0, 8.5, 0);
    gantryGroup.add(beam);

    // START / FINISH Banner display
    const bannerGeo = new THREE.PlaneGeometry(roadWidth * 0.7, 1.4);
    geometriesToDispose.push(bannerGeo);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    materialsToDispose.push(bannerMat);
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8.5, 0.75);
    gantryGroup.add(banner);

    trackGroup.add(gantryGroup);

    // 4. CHECKPOINTS (Sequential Gates)
    const checkpointCount = 12;
    const checkpoints: TrackCheckpoint[] = [];
    for (let c = 0; c < checkpointCount; c++) {
      const frac = c / checkpointCount;
      const cpPoint = spline.getPointAt(frac);
      const cpTangent = spline.getTangentAt(frac);
      const rot = Math.atan2(cpTangent.x, cpTangent.z);
      checkpoints.push({
        position: [cpPoint.x, cpPoint.y, cpPoint.z],
        rotation: rot,
        width: roadWidth + 8,
      });
    }

    // 5. JUMP RAMPS
    if (config.ramps && config.ramps.length > 0) {
      config.ramps.forEach(rampCfg => {
        const rampT = rampCfg.pointIndex / config.points.length;
        const rampPos = spline.getPointAt(rampT);
        const rampTangent = spline.getTangentAt(rampT).normalize();
        const rampBinormal = new THREE.Vector3(-rampTangent.z, 0, rampTangent.x).normalize();

        const rampGeo = new THREE.BoxGeometry(roadWidth * 0.6, rampCfg.height, rampCfg.length);
        geometriesToDispose.push(rampGeo);
        const rampMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.6,
          roughness: 0.3,
        });
        materialsToDispose.push(rampMat);

        const rampMesh = new THREE.Mesh(rampGeo, rampMat);
        rampMesh.position.copy(rampPos);
        rampMesh.position.y += rampCfg.height * 0.45;
        const rampHeading = Math.atan2(rampTangent.x, rampTangent.z);
        rampMesh.rotation.y = rampHeading;
        rampMesh.rotation.x = -0.25; // slope angle
        trackGroup.add(rampMesh);
      });
    }

    // 6. SCENERY PROPS MATCHING THEME
    buildThemedScenery(config, sampledPoints, sampledBinormals, trackGroup, geometriesToDispose, materialsToDispose);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(2400, 2400);
    groundGeo.rotateX(-Math.PI / 2);
    geometriesToDispose.push(groundGeo);

    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.groundColor),
      roughness: 0.9,
      metalness: 0.1,
    });
    materialsToDispose.push(groundMat);

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.2;
    groundMesh.receiveShadow = true;
    trackGroup.add(groundMesh);

    // AI Waypoints
    const aiWaypoints: THREE.Vector3[] = [];
    for (let w = 0; w < 100; w++) {
      aiWaypoints.push(spline.getPointAt(w / 100));
    }

    const dispose = () => {
      geometriesToDispose.forEach(g => g.dispose());
      materialsToDispose.forEach(m => m.dispose());
    };

    return {
      group: trackGroup,
      spline,
      checkpoints,
      startPosition: startPoint.clone().add(new THREE.Vector3(0, 0.4, 0)),
      startHeading,
      aiWaypoints,
      dispose,
    };
  }
}

function buildThemedScenery(
  config: TrackConfig,
  sampledPoints: THREE.Vector3[],
  sampledBinormals: THREE.Vector3[],
  parent: THREE.Group,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[]
) {
  const step = 8;

  if (config.theme === 'NEON_CITY') {
    // Cyberpunk skyscrapers & neon light pillars
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.8, roughness: 0.4 });
    const neonMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const neonMat2 = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    mats.push(bldgMat, neonMat1, neonMat2);

    for (let i = 0; i < sampledPoints.length; i += step) {
      const pt = sampledPoints[i];
      const binormal = sampledBinormals[i];
      const offsetDist = 38 + (i % 5) * 15;

      [-1, 1].forEach(side => {
        const bldgPos = pt.clone().addScaledVector(binormal, side * offsetDist);
        const height = 40 + (Math.sin(i * 1.5) + 1) * 60;
        const width = 25 + (i % 3) * 12;

        const bldgGeo = new THREE.BoxGeometry(width, height, width);
        geos.push(bldgGeo);
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.position.set(bldgPos.x, height * 0.5 - 0.2, bldgPos.z);
        bldg.castShadow = true;
        parent.add(bldg);

        // Neon roof sign
        const signGeo = new THREE.BoxGeometry(width * 0.8, 4, 1);
        geos.push(signGeo);
        const sign = new THREE.Mesh(signGeo, side > 0 ? neonMat1 : neonMat2);
        sign.position.set(bldgPos.x, height - 2, bldgPos.z);
        parent.add(sign);
      });
    }
  } else if (config.theme === 'DESERT_STORM') {
    // Red sandstone mesas & canyon pillars
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.95, metalness: 0.05 });
    mats.push(rockMat);

    for (let i = 0; i < sampledPoints.length; i += step) {
      const pt = sampledPoints[i];
      const binormal = sampledBinormals[i];
      const dist = 35 + (i % 4) * 20;

      [-1, 1].forEach(side => {
        const rockPos = pt.clone().addScaledVector(binormal, side * dist);
        const rHeight = 35 + ((i * 7) % 30);
        const rRadius = 18 + ((i * 3) % 15);

        const rockGeo = new THREE.CylinderGeometry(rRadius * 0.7, rRadius, rHeight, 7);
        geos.push(rockGeo);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(rockPos.x, rHeight * 0.5 - 0.2, rockPos.z);
        rock.rotation.y = i;
        rock.castShadow = true;
        parent.add(rock);
      });
    }
  } else if (config.theme === 'ALPINE_RUSH') {
    // Snowy pine trees and mountain cliffs
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const treeSnowMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.8 });
    mats.push(treeTrunkMat, treeSnowMat);

    for (let i = 0; i < sampledPoints.length; i += step) {
      const pt = sampledPoints[i];
      const binormal = sampledBinormals[i];
      const dist = 28 + (i % 3) * 16;

      [-1, 1].forEach(side => {
        const treePos = pt.clone().addScaledVector(binormal, side * dist);
        const treeGroup = new THREE.Group();
        treeGroup.position.set(treePos.x, pt.y, treePos.z);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 6);
        geos.push(trunkGeo);
        const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
        trunk.position.y = 3;
        treeGroup.add(trunk);

        // Foliage cone
        const foliageGeo = new THREE.ConeGeometry(4.5, 12, 6);
        geos.push(foliageGeo);
        const foliage = new THREE.Mesh(foliageGeo, treeSnowMat);
        foliage.position.y = 9;
        treeGroup.add(foliage);

        parent.add(treeGroup);
      });
    }
  } else if (config.theme === 'COASTLINE_X') {
    // Ocean horizon plane and coastal suspension bridge pillars
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.88,
    });
    mats.push(oceanMat);

    const oceanGeo = new THREE.PlaneGeometry(1200, 1200);
    oceanGeo.rotateX(-Math.PI / 2);
    geos.push(oceanGeo);
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.set(-200, -2.5, 0);
    parent.add(oceanMesh);

    // Bridge Towers along seaside
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
    mats.push(towerMat);

    for (let i = 0; i < sampledPoints.length; i += step * 2) {
      const pt = sampledPoints[i];
      const binormal = sampledBinormals[i];

      [-1, 1].forEach(side => {
        const towerPos = pt.clone().addScaledVector(binormal, side * 22);
        const towerGeo = new THREE.BoxGeometry(2.5, 45, 2.5);
        geos.push(towerGeo);
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(towerPos.x, 22.5, towerPos.z);
        parent.add(tower);
      });
    }
  }
}
