import type {
  PromotionPiece,
} from '@modules/game/domain/game/value-objects/PieceType.js';

export class PromotionDialog {
  private resolver: ((p: PromotionPiece | null) => void) | null = null;

  constructor(private readonly root: HTMLElement) {
    this.root.style.display = 'none';
    const buttons = Array.from(
      this.root.querySelectorAll<HTMLButtonElement>('button[data-promotion]'),
    );
    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.promotion as PromotionPiece;
        this.close(choice);
      });
    }
  }

  open(): Promise<PromotionPiece | null> {
    this.root.style.display = 'flex';
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  private close(choice: PromotionPiece | null): void {
    this.root.style.display = 'none';
    const r = this.resolver;
    this.resolver = null;
    if (r) r(choice);
  }
}
