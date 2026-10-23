/**
 * Web Audio API based Japanese Sound Generator
 * Generates realistic Shogi piece click sound, sliding sound, and victory taiko drums.
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  // Realistic Shogi piece click sound (dry wood clack)
  playPieceClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. High transient snap (wood surface hit)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400 + Math.random() * 150, t);
    snapOsc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

    snapGain.gain.setValueAtTime(0.6 * this.volume, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);

    snapOsc.start(t);
    snapOsc.stop(t + 0.04);

    // 2. Wood board resonance (Kaya board body thud)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(320 + Math.random() * 30, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(110, t + 0.07);

    bodyGain.gain.setValueAtTime(0.4 * this.volume, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);

    bodyOsc.start(t);
    bodyOsc.stop(t + 0.08);

    // 3. Short filtered noise for wood texture strike
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.setValueAtTime(2.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.025);
  }

  // Smooth slide sound (wood scraping)
  playSlide() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.08;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + duration);
  }

  // UI button click
  playBtnClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

    gain.gain.setValueAtTime(0.15 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Hyoshigi (Japanese wooden clappers)
  playHyoshigi(delay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);

    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Japanese Taiko drum roll & boom for victory
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Hyoshigi pair: "Chon... Chon!"
    this.playHyoshigi(0);
    this.playHyoshigi(0.2);

    // Deep Taiko "DON!!"
    const t = this.ctx.currentTime + 0.45;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);

    gain.gain.setValueAtTime(0.8 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.85);

    // Second deeper resonate taiko boom
    const t2 = this.ctx.currentTime + 0.85;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, t2);
    osc2.frequency.exponentialRampToValueAtTime(35, t2 + 0.9);

    gain2.gain.setValueAtTime(0.9 * this.volume, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 1.1);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 1.2);
  }
}

export const sound = new SoundEffects();
