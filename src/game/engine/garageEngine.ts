import * as THREE from 'three';
import { VEHICLE_CONFIGS } from '../vehicles/vehicleConfigs';
import { ProceduralCarBuilder, CarMeshContainer } from '../vehicles/proceduralCarBuilder';

export class GarageEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;

  private currentMeshContainer: CarMeshContainer | null = null;
  private currentCarId = '';

  private animationFrameId: number | null = null;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private carRotationY = 0;
  private autoRotateSpeed = 0.35;

  constructor(container: HTMLElement, initialCarId: string, customPrimary?: string, customStripe?: string) {
    this.container = container;
    this.currentCarId = initialCarId;

    // 1. SCENE
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);

    // 2. CAMERA
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 2.2, 7.8);
    this.camera.lookAt(0, 0.6, 0);

    // 3. RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // 4. STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(-6, 4, -5);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf97316, 1.0);
    fillLight.position.set(0, -2, 6);
    this.scene.add(fillLight);

    // Showroom Circular Pedestal Floor
    const floorGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.3, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Neon Floor Rim Light
    const floorRimGeo = new THREE.TorusGeometry(4.85, 0.05, 16, 64);
    floorRimGeo.rotateX(Math.PI / 2);
    const floorRimMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const floorRim = new THREE.Mesh(floorRimGeo, floorRimMat);
    floorRim.position.y = 0.01;
    this.scene.add(floorRim);

    // Load initial car
    this.loadCar(initialCarId, customPrimary, customStripe);

    // Event listeners for dragging
    this.setupControls();

    // Start render loop
    this.tick();
  }

  public loadCar(carId: string, customPrimary?: string, customStripe?: string) {
    if (this.currentMeshContainer) {
      this.scene.remove(this.currentMeshContainer.root);
      this.currentMeshContainer = null;
    }

    const config = VEHICLE_CONFIGS.find(c => c.id === carId) || VEHICLE_CONFIGS[0];
    this.currentCarId = carId;
    this.currentMeshContainer = ProceduralCarBuilder.createVehicle(config, customPrimary, customStripe);
    this.currentMeshContainer.root.position.y = 0;
    this.scene.add(this.currentMeshContainer.root);
  }

  private setupControls() {
    const el = this.renderer.domElement;

    const onPointerDown = (clientX: number, clientY: number) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMousePosition.x;
      this.carRotationY += deltaX * 0.008;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    el.addEventListener('mousedown', e => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    el.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('resize', this.handleResize);
  }

  private tick = () => {
    this.animationFrameId = requestAnimationFrame(this.tick);

    if (!this.isDragging) {
      this.carRotationY += 0.005 * this.autoRotateSpeed;
    }

    if (this.currentMeshContainer) {
      this.currentMeshContainer.root.rotation.y = this.carRotationY;
      this.currentMeshContainer.updateAnimation(0, 0, false, false);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
