// Tiny synth SFX (no audio files to load). Replace with real sounds later if you like.
export class Sfx {
  private ctx: AudioContext | null = null;
  enabled = true;
  private adMuted = false;

  /** Must be called from a user gesture at least once (browsers block audio before that). */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch { /* audio unavailable */ }
  }

  /** Portals require the game to be silent while an ad plays. */
  setAdMuted(m: boolean): void {
    this.adMuted = m;
    if (!this.ctx) return;
    if (m) void this.ctx.suspend(); else void this.ctx.resume();
  }

  suspend(): void { void this.ctx?.suspend(); }
  resume(): void { if (!this.adMuted) void this.ctx?.resume(); }

  tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.07, slide = 0, delay = 0): void {
    if (!this.enabled || this.adMuted || !this.ctx) return;
    try {
      const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  }

  pen(): void { this.tone(520, 0.06, 'triangle', 0.04); }
  pour(): void { this.tone(330, 0.25, 'sine', 0.06, 2.2); }
  plop(fill: number): void { this.tone(380 + Math.min(1, fill) * 500, 0.07, 'sine', 0.035, 1.5); }
  bloom(): void { this.tone(880, 0.12, 'triangle', 0.06, 1.5); this.tone(1320, 0.15, 'triangle', 0.05, 1, 0.08); }
  win(): void { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.06, 0, i * 0.09)); }
  lose(): void { this.tone(300, 0.35, 'sawtooth', 0.04, 0.5); }
}
