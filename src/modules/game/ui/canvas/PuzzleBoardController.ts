import { parseUci } from '@modules/game/application/uci.js';
import type {
  SubmitPuzzleMoveUseCase,
} from '@modules/game/application/use-cases/SubmitPuzzleMove.js';
import type {
  BoardSnapshot,
  Color,
  Move,
  Square,
} from '@modules/game/domain/game';
import {
  type PuzzleAttemptInput,
  type SolvingSession,
} from '@modules/game/domain/puzzles';
import type { EventBus, Unsubscribe } from '@shared/types/EventBus.js';
import type { BoardDisplayOptions } from './BoardController.js';
import type { BoardView } from './BoardView.js';
import type { InputController } from './InputController.js';
import type { PromotionDialog } from './PromotionDialog.js';

export interface PuzzleBoardControllerOptions {
  readonly boardView: BoardView;
  readonly input: InputController;
  readonly bus: EventBus;
  readonly submit: SubmitPuzzleMoveUseCase;
  readonly promo: PromotionDialog;
  readonly canvas: HTMLCanvasElement;
  readonly orientation: () => 'white' | 'black';
  readonly displayOptions?: () => BoardDisplayOptions;
  readonly getSession: () => SolvingSession | null;
  readonly highlightHint?: () => string | null;
}

export class PuzzleBoardController {
  private selected: Square | null = null;
  private lastMove: Move | null = null;
  private hintHighlight: { from: Square; to: Square } | null = null;
  private preview: BoardSnapshot | null = null;
  private previewLastMove: { from: Square; to: Square } | null = null;
  private readonly unsubs: Unsubscribe[] = [];

  private readonly boardView: BoardView;
  private readonly input: InputController;
  private readonly bus: EventBus;
  private readonly submit: SubmitPuzzleMoveUseCase;
  private readonly promo: PromotionDialog;
  private readonly canvas: HTMLCanvasElement;
  private readonly getOrientation: () => 'white' | 'black';
  private readonly getDisplay: () => BoardDisplayOptions;
  private readonly getSession: () => SolvingSession | null;
  private readonly getHintUci: () => string | null;

  constructor(opts: PuzzleBoardControllerOptions) {
    this.boardView = opts.boardView;
    this.input = opts.input;
    this.bus = opts.bus;
    this.submit = opts.submit;
    this.promo = opts.promo;
    this.canvas = opts.canvas;
    this.getOrientation = opts.orientation;
    this.getDisplay = opts.displayOptions ?? ((): BoardDisplayOptions => ({
      showCoordinates: true, showLastMove: true, showHints: true,
    }));
    this.getSession = opts.getSession;
    this.getHintUci = opts.highlightHint ?? ((): null => null);
  }

  mount(): void {
    this.input.onSquareClick((sq) => { void this.handleClick(sq); });
    this.unsubs.push(
      this.bus.subscribe('PuzzleMoveAccepted', () => {
        const session = this.getSession();
        if (session) {
          const moves = session.movesPlayed;
          this.lastMove = moves[moves.length - 1] ?? null;
        }
        this.selected = null;
        this.hintHighlight = null;
        this.render();
      }),
      this.bus.subscribe('PuzzleOpponentReplied', () => {
        const session = this.getSession();
        if (session) {
          const moves = session.movesPlayed;
          this.lastMove = moves[moves.length - 1] ?? null;
        }
        this.render();
      }),
      this.bus.subscribe('PuzzleFailed', () => {
        this.selected = null;
        this.shake();
        this.render();
      }),
      this.bus.subscribe('PuzzleSolved', () => {
        this.selected = null;
        this.render();
      }),
      this.bus.subscribe('PuzzleHintRevealed', (event) => {
        const m = parseUci(event.nextUci);
        this.hintHighlight = { from: m.from, to: m.to };
        this.render();
      }),
    );
    this.render();
  }

  reset(): void {
    this.selected = null;
    this.lastMove = null;
    this.hintHighlight = null;
    this.preview = null;
    this.previewLastMove = null;
    this.render();
  }

  rerender(): void { this.render(); }

  /**
   * Включает режим визуализации: рендерит произвольный снапшот вместо позиции
   * сессии. Клики игрока игнорируются. `lastMoveSquares` — для подсветки
   * последнего хода вариация. Передайте `null` чтобы вернуться к позиции
   * сессии.
   */
  renderSnapshot(
    snap: BoardSnapshot | null,
    lastMoveSquares?: { from: Square; to: Square } | null,
  ): void {
    this.preview = snap;
    this.previewLastMove = lastMoveSquares ?? null;
    this.selected = null;
    this.hintHighlight = null;
    this.render();
  }

  get isPreviewing(): boolean { return this.preview !== null; }

  detach(): void {
    for (const u of this.unsubs) u();
    this.unsubs.length = 0;
    this.input.detach();
  }

  private currentSnapshot(): BoardSnapshot | null {
    if (this.preview) return this.preview;
    const session = this.getSession();
    return session ? session.currentSnapshot : null;
  }

  private playerSide(): Color | null {
    const session = this.getSession();
    return session ? session.puzzle.sideToMove : null;
  }

  private render(): void {
    const snap = this.currentSnapshot();
    if (!snap) return;
    const session = this.getSession();
    const sel = this.selected;
    const legalDestinations = session && sel
      ? session.legalMoves().filter((m) => m.from.equals(sel))
      : [];

    const d = this.getDisplay();
    const hintUci = this.getHintUci();
    const hint = hintUci ? parseUci(hintUci) : this.hintHighlight;

    // В режиме превью гасим обычный last-move и используем `preview` для подсветки.
    const lastMove = this.preview ? null : this.lastMove;
    const previewArrow = this.preview ? this.previewLastMove : null;

    this.boardView.render({
      snapshot: snap,
      selected: this.selected,
      legalDestinations,
      lastMove,
      checkSquare: hint ? hint.from : null,
      orientation: this.getOrientation(),
      showCoordinates: d.showCoordinates,
      showLastMove: d.showLastMove,
      showHints: d.showHints,
      ...(previewArrow ? { preview: previewArrow } : {}),
    });
  }

  private async handleClick(sq: Square): Promise<void> {
    if (this.preview) return; // в режиме визуализации ввод заблокирован
    const session = this.getSession();
    if (session?.status !== 'solving') return;
    const snap = session.currentSnapshot;
    const playerSide = this.playerSide();
    if (!playerSide) return;
    if (snap.sideToMove !== playerSide) return;

    if (this.selected?.equals(sq)) {
      this.selected = null;
      this.render();
      return;
    }

    const piece = snap.pieceAt(sq);

    if (this.selected) {
      const sel = this.selected;
      const candidates = session
        .legalMoves()
        .filter((m) => m.from.equals(sel) && m.to.equals(sq));

      if (candidates.length === 0) {
        const isReselect = piece?.color === snap.sideToMove;
        if (!isReselect) {
          this.submit.reject(session, sel, sq);
          this.shake();
        }
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

      const input: PuzzleAttemptInput = {
        from: sel,
        to: sq,
        ...(promotion ? { promotion } : {}),
      };
      this.submit.execute({ session, ...input });
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
