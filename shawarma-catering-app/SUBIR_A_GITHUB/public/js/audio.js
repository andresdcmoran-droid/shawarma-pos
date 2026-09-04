/**
 * SHAWARMA CATERING - SYNTHETIC SOUND ENGINE (Web Audio API)
 * 100% Offline, Zero external MP3 files required.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
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

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  playNewOrder() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Harmonic 2-note chime: D5 (587Hz) -> A5 (880Hz)
      const now = this.ctx.currentTime;
      
      const notes = [
        { freq: 587.33, start: 0, duration: 0.18 },
        { freq: 880.00, start: 0.15, duration: 0.45 }
      ];

      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.start);
        
        gain.gain.setValueAtTime(0.3, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + n.start);
        osc.stop(now + n.start + n.duration);
      });
    } catch (e) {
      console.warn('Audio new order error:', e);
    }
  }

  playOrderReady() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Celebratory 3-note triad: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
      const now = this.ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0, duration: 0.15 },
        { freq: 659.25, start: 0.12, duration: 0.15 },
        { freq: 783.99, start: 0.24, duration: 0.5 }
      ];

      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.start);
        
        gain.gain.setValueAtTime(0.25, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + n.start);
        osc.stop(now + n.start + n.duration);
      });
    } catch (e) {
      console.warn('Audio ready error:', e);
    }
  }
}

window.sounds = new SoundEngine();
