export interface TimeControl {
  readonly initialSeconds: number;
  readonly incrementSeconds: number;
}

export const TIME_CONTROLS: { label: string; value: TimeControl }[] = [
  { label: 'Unlimited', value: { initialSeconds: 0, incrementSeconds: 0 } },
  { label: '1 min', value: { initialSeconds: 60, incrementSeconds: 0 } },
  { label: '3+0', value: { initialSeconds: 180, incrementSeconds: 0 } },
  { label: '5+0', value: { initialSeconds: 300, incrementSeconds: 0 } },
  { label: '10+0', value: { initialSeconds: 600, incrementSeconds: 0 } },
  { label: '15+0', value: { initialSeconds: 900, incrementSeconds: 0 } },
  { label: '30+0', value: { initialSeconds: 1800, incrementSeconds: 0 } },
  { label: '3+2', value: { initialSeconds: 180, incrementSeconds: 2 } },
  { label: '5+3', value: { initialSeconds: 300, incrementSeconds: 3 } },
  { label: '10+5', value: { initialSeconds: 600, incrementSeconds: 5 } },
];

export class GameClock {
  private whiteMs: number;
  private blackMs: number;
  private active: 'white' | 'black' | null = null;
  private lastTickTime = 0;
  private rafId: number | null = null;

  onTick: ((whiteMs: number, blackMs: number) => void) | null = null;
  onForfeit: ((loser: 'white' | 'black') => void) | null = null;

  constructor(private control: TimeControl) {
    this.whiteMs = control.initialSeconds * 1000;
    this.blackMs = control.initialSeconds * 1000;
  }

  get isUnlimited(): boolean {
    return this.control.initialSeconds === 0;
  }

  get isRunning(): boolean {
    return this.active !== null;
  }

  getWhiteMs(): number {
    return this.whiteMs;
  }

  getBlackMs(): number {
    return this.blackMs;
  }

  startFor(side: 'white' | 'black'): void {
    if (this.isUnlimited) return;
    this.stopTicking();
    this.active = side;
    this.lastTickTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  switchTurn(justMoved: 'white' | 'black'): void {
    if (this.isUnlimited) return;
    if (justMoved === 'white') {
      this.whiteMs += this.control.incrementSeconds * 1000;
    } else {
      this.blackMs += this.control.incrementSeconds * 1000;
    }
    this.startFor(justMoved === 'white' ? 'black' : 'white');
  }

  stop(): void {
    this.stopTicking();
  }

  getActive(): 'white' | 'black' | null {
    return this.active;
  }

  restore(state: { whiteMs: number; blackMs: number; active: 'white' | 'black' | null }): void {
    this.stopTicking();
    this.whiteMs = Math.max(0, state.whiteMs);
    this.blackMs = Math.max(0, state.blackMs);
    this.onTick?.(this.whiteMs, this.blackMs);
    if (state.active && !this.isUnlimited) this.startFor(state.active);
  }

  reset(control: TimeControl): void {
    this.stopTicking();
    this.control = control;
    this.whiteMs = control.initialSeconds * 1000;
    this.blackMs = control.initialSeconds * 1000;
    this.onTick?.(this.whiteMs, this.blackMs);
  }

  private stopTicking(): void {
    this.active = null;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private readonly tick = (): void => {
    const now = performance.now();
    const elapsed = now - this.lastTickTime;
    this.lastTickTime = now;

    if (this.active === 'white') {
      this.whiteMs = Math.max(0, this.whiteMs - elapsed);
    } else if (this.active === 'black') {
      this.blackMs = Math.max(0, this.blackMs - elapsed);
    }

    this.onTick?.(this.whiteMs, this.blackMs);

    const remaining = this.active === 'white' ? this.whiteMs : this.blackMs;
    if (remaining <= 0 && this.active !== null) {
      const loser = this.active;
      this.stopTicking();
      this.onForfeit?.(loser);
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
