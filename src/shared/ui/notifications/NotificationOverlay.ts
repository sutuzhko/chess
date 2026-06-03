export interface GameNotification {
  readonly title: string;
  readonly body: string;
}

export class NotificationOverlay {
  private onNewGameFn: (() => void) | null = null;

  constructor(private readonly el: HTMLElement) {
    el.querySelector<HTMLButtonElement>('[data-action="new-game"]')?.addEventListener('click', () => {
      this.hide();
      this.onNewGameFn?.();
    });
    el.querySelector<HTMLButtonElement>('[data-action="dismiss"]')?.addEventListener('click', () => {
      this.hide();
    });
    el.addEventListener('click', (e) => {
      if (e.target === el) this.hide();
    });
  }

  onNewGame(fn: () => void): void {
    this.onNewGameFn = fn;
  }

  show(notification: GameNotification): void {
    const titleEl = this.el.querySelector<HTMLElement>('[data-role="title"]');
    const bodyEl = this.el.querySelector<HTMLElement>('[data-role="body"]');
    if (titleEl) titleEl.textContent = notification.title;
    if (bodyEl) bodyEl.textContent = notification.body;
    this.el.style.display = 'flex';
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  static showToast(message: string, durationMs = 2200): void {
    const toast = document.createElement('div');
    toast.className = 'chess-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.remove(); }, 400);
    }, durationMs);
  }
}
