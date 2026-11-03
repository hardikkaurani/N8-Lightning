export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;

  // Master buses
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Nitro audio nodes
  private nitroNoiseNode: AudioBufferSourceNode | null = null;
  private nitroGain: GainNode | null = null;
  private isNitroPlaying = false;

  // Drift screech nodes
  private driftNoiseNode: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;
  private isDriftPlaying = false;

  // Background Synth Music
  private musicTimer: number | null = null;
  private isMusicPlaying = false;
  private step = 0;

  // Settings
  private masterVol = 0.8;
  private sfxVol = 0.85;
  private musicVol = 0.7;
  private isMuted = false;

  private constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
    } catch (err) {
      console.warn('[SoundManager] AudioContext not supported or blocked:', err);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.musicVol = music;
    this.applyVolumes();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.applyVolumes();
    return this.isMuted;
  }

  private applyVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVol, now);
    this.musicGain.gain.setValueAtTime(this.musicVol * 0.4, now); // keep music balanced under engine
  }

  // --- ENGINE SYNTHESIS ---
  public startEngine() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineSubOsc.type = 'triangle';

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, now);

      this.engineOsc.frequency.setValueAtTime(55, now);
      this.engineSubOsc.frequency.setValueAtTime(27.5, now);

      this.engineGain.gain.setValueAtTime(0.12, now);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isEngineRunning = true;
    } catch (err) {
      console.warn('[SoundManager] Engine sound error:', err);
    }
  }

  public updateEnginePitch(speedKmh: number, isAccelerating: boolean, isNitro: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineFilter || !this.engineGain) return;
    const now = this.ctx.currentTime;

    // Simulated RPM with 5 gear steps
    const gearRatios = [60, 110, 170, 240, 340, 420];
    let gearSpeed = speedKmh;
    for (let i = 0; i < gearRatios.length; i++) {
      if (speedKmh <= gearRatios[i]) {
        const prev = i === 0 ? 0 : gearRatios[i - 1];
        gearSpeed = ((speedKmh - prev) / (gearRatios[i] - prev)) * 100;
        break;
      }
    }

    const baseFreq = 50 + (gearSpeed * 1.8) + (isAccelerating ? 25 : 0) + (isNitro ? 45 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);

    const filterFreq = 350 + (gearSpeed * 8) + (isNitro ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    const gainVal = 0.08 + (Math.min(speedKmh, 200) / 200) * 0.15 + (isNitro ? 0.06 : 0);
    this.engineGain.gain.setTargetAtTime(gainVal, now, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch { /* ignore */ }
      this.engineOsc = null;
    }
    if (this.engineSubOsc) {
      try { this.engineSubOsc.stop(); } catch { /* ignore */ }
      this.engineSubOsc = null;
    }
    this.isEngineRunning = false;
  }

  // --- NITRO SOUND ---
  public startNitro() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isNitroPlaying) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.nitroNoiseNode = this.ctx.createBufferSource();
      this.nitroNoiseNode.buffer = buffer;
      this.nitroNoiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.nitroGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.15);

      this.nitroNoiseNode.connect(filter);
      filter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);

      this.nitroNoiseNode.start();
      this.isNitroPlaying = true;
    } catch {
      // Ignore
    }
  }

  public stopNitro() {
    if (this.nitroGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.nitroGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      setTimeout(() => {
        if (this.nitroNoiseNode) {
          try { this.nitroNoiseNode.stop(); } catch { /* ignore */ }
          this.nitroNoiseNode = null;
        }
        this.isNitroPlaying = false;
      }, 120);
    }
  }

  // --- DRIFT TIRE SCREECH ---
  public setDriftIntensity(intensity: number) {
    if (intensity > 0.15) {
      if (!this.isDriftPlaying) {
        this.startDrift();
      }
      if (this.driftGain && this.ctx) {
        this.driftGain.gain.setTargetAtTime(Math.min(0.28, intensity * 0.28), this.ctx.currentTime, 0.05);
      }
    } else {
      if (this.isDriftPlaying) {
        this.stopDrift();
      }
    }
  }

  private startDrift() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isDriftPlaying) return;
    try {
      const bufferSize = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.driftNoiseNode = this.ctx.createBufferSource();
      this.driftNoiseNode.buffer = buffer;
      this.driftNoiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.driftGain = this.ctx.createGain();
      this.driftGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

      this.driftNoiseNode.connect(filter);
      filter.connect(this.driftGain);
      this.driftGain.connect(this.sfxGain);

      this.driftNoiseNode.start();
      this.isDriftPlaying = true;
    } catch {
      // Ignore
    }
  }

  private stopDrift() {
    if (this.driftGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.driftGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      setTimeout(() => {
        if (this.driftNoiseNode) {
          try { this.driftNoiseNode.stop(); } catch { /* ignore */ }
          this.driftNoiseNode = null;
        }
        this.isDriftPlaying = false;
      }, 90);
    }
  }

  // --- COLLISION SOUND ---
  public playCollision(intensity = 1.0) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

      const amp = Math.min(0.5, intensity * 0.4);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  // --- COUNTDOWN & RACE EVENTS ---
  public playCountdown(isGo = false) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'square' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6 victory pitch
      }

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(now + (isGo ? 0.65 : 0.3));
    } catch {
      // Ignore
    }
  }

  public playCheckpoint() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }

  public playUIClick() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  // --- BACKGROUND SYNTH ELECTRONIC MUSIC LOOP ---
  public startMusic() {
    this.init();
    this.resume();
    if (!this.ctx || !this.musicGain || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.step = 0;

    // High energy electronic synth chord sequence in D minor
    const bassline = [146.83, 146.83, 174.61, 130.81, 146.83, 164.81, 174.61, 220.0];
    const arpeggio = [293.66, 349.23, 440.0, 587.33, 523.25, 440.0, 349.23, 329.63];

    const bpm = 132;
    const intervalMs = (60 / bpm / 2) * 1000; // 16th note pulses

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const currentStep = this.step % 16;

      // Bass note on every 4th step
      if (currentStep % 4 === 0) {
        const bassNote = bassline[(Math.floor(this.step / 4)) % bassline.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNote / 2, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(now + 0.32);
      }

      // Arpeggiated lead synth
      if (currentStep % 2 === 0) {
        const arpNote = arpeggio[(this.step / 2) % arpeggio.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(arpNote, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(now + 0.15);
      }

      this.step++;
    }, intervalMs);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }

  public dispose() {
    this.stopEngine();
    this.stopNitro();
    this.stopDrift();
    this.stopMusic();
    if (this.ctx) {
      try { this.ctx.close(); } catch { /* ignore */ }
      this.ctx = null;
    }
  }
}
