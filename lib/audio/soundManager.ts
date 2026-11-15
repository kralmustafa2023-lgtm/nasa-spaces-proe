/**
 * Procedural Web Audio Sound Manager for NASA Spaces Proe
 * 100% zero-dependency synthesizer & audio effects generator
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientScene: string | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  /**
   * Footstep sound: filtered noise + boot heel thud
   */
  public playFootstep(isSprinting: boolean = false, isMetal: boolean = true) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const duration = isSprinting ? 0.08 : 0.12;

    // 1. Noise transient (sole friction)
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isMetal ? 380 : 180, t);
    filter.Q.setValueAtTime(isMetal ? 2.5 : 1.2, t);

    const noiseGain = ctx.createGain();
    const vol = isSprinting ? 0.14 : 0.08;
    noiseGain.gain.setValueAtTime(vol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    // 2. Low-frequency boot heel impact
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isMetal ? 110 : 75;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + duration);

    oscGain.gain.setValueAtTime(isSprinting ? 0.18 : 0.12, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  /**
   * Jump sound: upward aerodynamic frequency sweep
   */
  public playJump() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.18);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Landing sound: cushioned heavy impact thud
   */
  public playLand() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Interact sound: crisp high-tech sci-fi telemetry beep
   */
  public playInteract() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1320, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Holographic HUD toggle sound: futuristic shimmer
   */
  public playHologramToggle(open: boolean) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const freqs = open ? [440, 660, 880, 1320] : [1320, 880, 660, 440];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);

      gain.gain.setValueAtTime(0.06, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.14);
    });
  }

  /**
   * Diagnostic scan: medical telemetry frequency sweep
   */
  public playScan() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.35);
    osc.frequency.linearRampToValueAtTime(520, t + 0.7);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  /**
   * Repair step sound: electronic calibration beep & buzz
   */
  public playRepairStep() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Electronic blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Repair complete: triumphant major triad arpeggio
   */
  public playRepairComplete() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    // C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.15, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }

  /**
   * Countdown beeps for T-minus rocket launch
   */
  public playCountdownBeep(isFinal: boolean = false) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1200 : 750, t);

    const dur = isFinal ? 0.45 : 0.15;
    gain.gain.setValueAtTime(isFinal ? 0.22 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  /**
   * Ambient scene audio: low hum for station, rumble for launch
   */
  public updateAmbient(scene: string) {
    if (this.currentAmbientScene === scene) return;
    this.currentAmbientScene = scene;

    const ctx = this.getContext();
    if (!ctx) return;

    // Stop previous ambient
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch (_) {}
      this.ambientOsc = null;
    }

    if (scene !== 'station' && scene !== 'orbit' && scene !== 'shuttleCockpit') {
      return;
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (scene === 'station') {
      // Gentle ISS ventilation drone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(58, t); // 58 Hz hum
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);
      gain.gain.setValueAtTime(this.muted ? 0 : 0.06, t);
    } else if (scene === 'shuttleCockpit') {
      // Avionics inverter frequency
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(92, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);
      gain.gain.setValueAtTime(this.muted ? 0 : 0.08, t);
    } else {
      // Deep space silence with subtle cosmic background
      osc.type = 'sine';
      osc.frequency.setValueAtTime(42, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, t);
      gain.gain.setValueAtTime(this.muted ? 0 : 0.04, t);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    this.ambientOsc = osc;
    this.ambientGain = gain;
  }
}

export const soundManager = new SoundManager();
