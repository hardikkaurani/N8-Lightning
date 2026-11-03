import { VehicleInputs } from '../physics/vehiclePhysics';

export class InputManager {
  private keys: Record<string, boolean> = {};

  // Touch overrides
  private touchThrottle = 0;
  private touchBrake = 0;
  private touchSteer = 0;
  private touchDrift = false;
  private touchNitro = false;

  private onPauseCallback: (() => void) | null = null;
  private onResetCallback: (() => void) | null = null;

  constructor(onPause?: () => void, onReset?: () => void) {
    this.onPauseCallback = onPause || null;
    this.onResetCallback = onReset || null;

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.onPauseCallback) this.onPauseCallback();
    }

    if (e.code === 'KeyR') {
      if (this.onResetCallback) this.onResetCallback();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleBlur = () => {
    this.keys = {};
    this.touchThrottle = 0;
    this.touchBrake = 0;
    this.touchSteer = 0;
    this.touchDrift = false;
    this.touchNitro = false;
  };

  public getInputs(sensitivity = 1.0): VehicleInputs {
    // Keyboard inputs
    let throttle = (this.keys['KeyW'] || this.keys['ArrowUp']) ? 1 : 0;
    let brake = (this.keys['KeyS'] || this.keys['ArrowDown']) ? 1 : 0;
    let steer = 0;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) steer -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) steer += 1;

    let drift = Boolean(this.keys['Space']);
    let nitro = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    // Merge Touch inputs
    if (this.touchThrottle > 0) throttle = Math.max(throttle, this.touchThrottle);
    if (this.touchBrake > 0) brake = Math.max(brake, this.touchBrake);
    if (Math.abs(this.touchSteer) > 0.05) steer = this.touchSteer;
    if (this.touchDrift) drift = true;
    if (this.touchNitro) nitro = true;

    steer = Math.max(-1, Math.min(1, steer * sensitivity));

    return {
      throttle,
      brake,
      steer,
      drift,
      nitro,
    };
  }

  // Touch setters
  public setTouchThrottle(val: number) { this.touchThrottle = val; }
  public setTouchBrake(val: number) { this.touchBrake = val; }
  public setTouchSteer(val: number) { this.touchSteer = val; }
  public setTouchDrift(val: boolean) { this.touchDrift = val; }
  public setTouchNitro(val: boolean) { this.touchNitro = val; }
  public triggerReset() { if (this.onResetCallback) this.onResetCallback(); }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleBlur);
    }
  }
}

