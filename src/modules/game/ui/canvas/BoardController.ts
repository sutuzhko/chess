import type {
  GetLegalMovesUseCase,
  MakeMoveUseCase,
  MatchRepository,
} from '@modules/game/application';
import type {
  BoardSnapshot,
  Color,
  Move,
  Square,
} from '@modules/game/domain/game';
import type { EventBus, Unsubscribe } from '@shared/types/EventBus.js';
import type { BoardView } from './BoardView.js';
import type { InputController } from './InputController.js';
import type { PromotionDialog } from './PromotionDialog.js';

export interface BoardDisplayOptions {
  readonly showCoordinates: boolean;
  readonly showLastMove: boolean;
  readonly showHints: boolean;
}

export interface BoardControllerOptions {
  readonly boardView: BoardView;
  readonly input: InputController;
  readonly bus: EventBus;
  readonly repo: MatchRepository;
  readonly makeMove: MakeMoveUseCase;
  readonly getLegalMoves: GetLegalMovesUseCase;
  readonly promo: PromotionDialog;
  readonly matchId: () => string;
  readonly canvas: HTMLCanvasElement;
  readonly orientation: () => 'white' | 'black';
  readonly canInteract?: () => boolean;
  readonly aiSide?: () => Color | null;
  readonly displayOptions?: () => BoardDisplayOptions;
}

export class BoardController {
  private currentSnapshot: BoardSnapshot;
  private selected: Square | null = null;
  private lastMove: Move | null = null;
  private checkSquare: Square | null = null;
  private preview: { from: Square; to: Square } | null = null;
  private readonly unsubs: Unsubscribe[] = [];

  private readonly boardView: BoardView;
  private readonly input: InputController;
  private readonly bus: EventBus;
  private readonly repo: MatchRepository;
  private readonly makeMove: MakeMoveUseCase;
  private readonly getLegalMoves: GetLegalMovesUseCase;
  private readonly promo: PromotionDialog;
  private readonly matchId: () => string;
  private readonly canvas: HTMLCanvasElement;
  private readonly getOrientation: () => 'white' | 'black';
  private readonly canInteract: () => boolean;
  private readonly aiSide: () => Color | null;
  private readonly getDisplay: () => BoardDisplayOptions;

  constructor(opts: BoardControllerOptions) {
    this.boardView = opts.boardView;
    this.input = opts.input;
    this.bus = opts.bus;
    this.repo = opts.repo;
    this.makeMove = opts.makeMove;
    this.getLegalMoves = opts.getLegalMoves;
    this.promo = opts.promo;
    this.matchId = opts.matchId;
    this.canvas = opts.canvas;
    this.getOrientation = opts.orientation;
    this.canInteract = opts.canInteract ?? ((): boolean => true);
    this.aiSide = opts.aiSide ?? ((): null => null);
    this.getDisplay = opts.displayOptions ?? ((): BoardDisplayOptions => ({
      showCoordinates: true, showLastMove: true, showHints: true,
    }));
    this.currentSnapshot = this.repo.get(this.matchId()).currentSnapshot;
  }

  mount(): void {
    this.input.onSquareClick((sq) => { void this.handleClick(sq); });

    this.unsubs.push(
      this.bus.subscribe('MoveMade', (event) => {
        this.currentSnapshot = event.snapshotAfter;
        this.lastMove = event.move;
        this.selected = null;
        this.checkSquare = null;
        this.render();
      }),
      this.bus.subscribe('CheckDeclared', (event) => {
        this.checkSquare = this.currentSnapshot.findKing(event.againstColor);
        this.render();
      }),
      this.bus.subscribe('MatchEnded', () => {
        this.selected = null;
        this.render();
      }),
      this.bus.subscribe('UndoMoveMade', (event) => {
        this.currentSnapshot = event.restoredSnapshot;
        this.lastMove = null;
        this.selected = null;
        this.checkSquare = null;
        this.render();
      }),
    );

    this.render();
  }

  rerender(): void {
    this.render();
  }

  /** Подсвечивает non-interactive from→to оверлей; null очищает подсветку. */
  setPreview(move: { from: Square; to: Square } | null): void {
    this.preview = move;
    this.render();
  }

  reattachInput(): void {
    this.input.onSquareClick((sq) => { void this.handleClick(sq); });
  }

  reset(snapshot?: BoardSnapshot): void {
    this.selected = null;
    this.lastMove = null;
    this.checkSquare = null;
    this.preview = null;
    this.currentSnapshot = snapshot ?? this.repo.get(this.matchId()).currentSnapshot;
    this.render();
  }

  detach(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs.length = 0;
    this.input.detach();
  }

  private render(): void {
    const legalDestinations = this.selected
      ? this.getLegalMoves.execute({ matchId: this.matchId(), fromSquare: this.selected })
      : [];
    const d = this.getDisplay();
    this.boardView.render({
      snapshot: this.currentSnapshot,
      selected: this.selected,
      legalDestinations,
      lastMove: this.lastMove,
      checkSquare: this.checkSquare,
      preview: this.preview,
      orientation: this.getOrientation(),
      showCoordinates: d.showCoordinates,
      showLastMove: d.showLastMove,
      showHints: d.showHints,
    });
  }

  private async handleClick(sq: Square): Promise<void> {
    if (!this.canInteract()) return;
    const match = this.repo.get(this.matchId());
    if (match.status.kind !== 'in-progress') return;
    const ai = this.aiSide();
    if (ai && this.currentSnapshot.sideToMove === ai) return;

    const snap = this.currentSnapshot;

    if (this.selected?.equals(sq)) {
      this.selected = null;
      this.render();
      return;
    }

    const piece = snap.pieceAt(sq);

    if (this.selected) {
      const sel = this.selected;
      const candidates = this.getLegalMoves
        .execute({ matchId: this.matchId(), fromSquare: sel })
        .filter((m) => m.to.equals(sq));

      if (candidates.length === 0) {
        const isReselect = piece?.color === snap.sideToMove;
        if (!isReselect) this.shake();
        this.selected = isReselect ? sq : null;
        this.render();
        return;
      }

      const first = candidates[0];
      if (!first) return;
      let promotion = first.promotion;
      if (candidates.length > 1) {
        const choice = await this.promo.open();
        if (!choice) { this.selected = null; this.render(); return; }
        promotion = choice;
      }

      try {
        this.makeMove.execute({
          matchId: this.matchId(),
          from: sel,
          to: sq,
          ...(promotion ? { promotion } : {}),
        });
      } catch {
        this.selected = null;
        this.render();
      }
      return;
    }

    if (piece?.color === snap.sideToMove) {
      this.selected = sq;
      this.render();
    }
  }

  private shake(): void {
    this.canvas.classList.remove('board--shake');
    void this.canvas.offsetWidth;
    this.canvas.classList.add('board--shake');
    this.canvas.addEventListener('animationend', () => {
      this.canvas.classList.remove('board--shake');
    }, { once: true });
  }
}
