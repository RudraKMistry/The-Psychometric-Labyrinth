class MazeAudioSubsystem {
  private ctx: AudioContext | null = null;
  private muted = false;
  private volume = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playFootstep() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playChamberDiscover() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playStoneClick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playVictory() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  public playDiceRoll() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + i * 0.05;

      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, start);
      gain.gain.setValueAtTime(0.06 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.05);
    }
  }

  public playSnakeHiss() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.14 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playLadderAscent() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const steps = [220, 277.18, 329.63, 440];
    steps.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = this.ctx.currentTime + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.1 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  }
}

export const mazeAudio = new MazeAudioSubsystem();

