import type {
  BoardSnapshot,
  Move,
  Piece,
  PieceType,
} from '@modules/game/domain/game';
import { Square } from '@modules/game/domain/game';

interface BoardColors {
  readonly light: string;
  readonly dark: string;
  readonly selected: string;
  readonly lastMove: string;
  readonly hint: string;
  readonly check: string;
}

const PIECE_TYPES: readonly PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
const COLORS = ['white', 'black'] as const;
const imageCache = new Map<string, HTMLImageElement>();
const loadPromises = new Map<string, Promise<void>>();

function getPieceImage(type: PieceType, color: 'white' | 'black'): HTMLImageElement {
  const key = `${type}-${color}`;
  let img = imageCache.get(key);
  if (!img) {
    img = new Image();
    img.src = `${import.meta.env.BASE_URL}figures/${key}.png`;
    imageCache.set(key, img);
    const captured = img;
    loadPromises.set(key, new Promise<void>((resolve) => {
      if (captured.complete && captured.naturalWidth > 0) { resolve(); return; }
      const done = (): void => { resolve(); };
      captured.addEventListener('load', done, { once: true });
      captured.addEventListener('error', done, { once: true });
      // Возможна гонка: между созданием Image и addEventListener событие
      // 'load' могло уже отстреляться. В этом случае повторно проверяем
      // флаг complete — обработчики { once: true } выше станут no-op.
      if (captured.complete && captured.naturalWidth > 0) resolve();
    }));
  }
  return img;
}

function getBoardColors(): BoardColors {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string): string => s.getPropertyValue(v).trim() || fb;
  return {
    light: get('--board-light', '#f0d9b5'),
    dark: get('--board-dark', '#b58863'),
    selected: get('--board-select', 'rgba(232, 179, 57, 0.55)'),
    lastMove: get('--board-last', 'rgba(232, 179, 57, 0.35)'),
    hint: get('--board-legal', 'rgba(20, 20, 20, 0.18)'),
    check: get('--board-check', 'rgba(220, 76, 76, 0.55)'),
  };
}

export function preloadPieceImages(onAllLoaded?: () => void): void {
  const promises: Promise<void>[] = [];
  for (const color of COLORS) {
    for (const type of PIECE_TYPES) {
      const key = `${type}-${color}`;
      getPieceImage(type, color);
      const p = loadPromises.get(key);
      if (p) promises.push(p);
    }
  }
  void Promise.all(promises).then(() => onAllLoaded?.());
}

export interface BoardViewState {
  readonly snapshot: BoardSnapshot;
  readonly selected: Square | null;
  readonly legalDestinations: readonly Move[];
  readonly lastMove: Move | null;
  readonly checkSquare: Square | null;
  /** Non-interactive подсветка хода (например, наведение на кандидата). */
  readonly preview?: { readonly from: Square; readonly to: Square } | null;
  readonly orientation: 'white' | 'black';
  readonly showCoordinates?: boolean;
  readonly showLastMove?: boolean;
  readonly showHints?: boolean;
}

export class BoardView {
  readonly squareSize: number;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.squareSize = canvas.width / 8;
  }

  squareAt(clientX: number, clientY: number, orientation: 'white' | 'black'): Square | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    const fx = Math.floor((x / rect.width) * 8);
    const fy = Math.floor((y / rect.height) * 8);
    const file = orientation === 'white' ? fx : 7 - fx;
    const rank = orientation === 'white' ? 7 - fy : fy;
    return Square.of(file, rank);
  }

  render(state: BoardViewState): void {
    const { ctx, squareSize: s } = this;
    const c = getBoardColors();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = Square.of(f, r);
        const { x, y } = this.toCanvas(sq, state.orientation);
        ctx.fillStyle = (f + r) % 2 === 0 ? c.dark : c.light;
        ctx.fillRect(x, y, s, s);
      }
    }

    const showLastMove = state.showLastMove ?? true;
    const showCoordinates = state.showCoordinates ?? true;
    const showHints = state.showHints ?? true;

    if (showLastMove && state.lastMove) {
      this.fillSquare(state.lastMove.from, state.orientation, c.lastMove);
      this.fillSquare(state.lastMove.to, state.orientation, c.lastMove);
    }

    if (state.selected) {
      this.fillSquare(state.selected, state.orientation, c.selected);
    }

    if (state.preview) {
      this.fillSquare(state.preview.from, state.orientation, c.selected);
    }

    if (state.checkSquare) {
      this.fillSquare(state.checkSquare, state.orientation, c.check);
    }

    for (let i = 0; i < 64; i++) {
      const sq = Square.fromIndex(i);
      const piece = state.snapshot.pieceAt(sq);
      if (piece) this.drawPiece(piece, sq, state.orientation);
    }

    if (showCoordinates) this.drawCoordinates(state.orientation, c);

    if (showHints) {
      for (const move of state.legalDestinations) {
        this.drawHint(move.to, state.snapshot.pieceAt(move.to) !== null, state.orientation, c.hint);
      }
    }

    if (state.preview) {
      const { to } = state.preview;
      this.drawHint(to, state.snapshot.pieceAt(to) !== null, state.orientation, c.hint);
    }
  }

  private toCanvas(sq: Square, orientation: 'white' | 'black'): { x: number; y: number } {
    const fx = orientation === 'white' ? sq.file : 7 - sq.file;
    const fy = orientation === 'white' ? 7 - sq.rank : sq.rank;
    return { x: fx * this.squareSize, y: fy * this.squareSize };
  }

  private fillSquare(sq: Square, orientation: 'white' | 'black', color: string): void {
    const { x, y } = this.toCanvas(sq, orientation);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
  }

  private drawPiece(piece: Piece, sq: Square, orientation: 'white' | 'black'): void {
    const { x, y } = this.toCanvas(sq, orientation);
    const s = this.squareSize;
    const pad = Math.floor(s * 0.05);
    const img = getPieceImage(piece.type, piece.color);
    if (img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, x + pad, y + pad, s - pad * 2, s - pad * 2);
    }
  }

  private drawHint(sq: Square, isCapture: boolean, orientation: 'white' | 'black', hint: string): void {
    const { x, y } = this.toCanvas(sq, orientation);
    const s = this.squareSize;
    this.ctx.fillStyle = hint;
    this.ctx.beginPath();
    if (isCapture) {
      this.ctx.lineWidth = s * 0.08;
      this.ctx.strokeStyle = hint;
      this.ctx.arc(x + s / 2, y + s / 2, s * 0.42, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      this.ctx.arc(x + s / 2, y + s / 2, s * 0.16, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawCoordinates(orientation: 'white' | 'black', c: BoardColors): void {
    const fontSize = Math.floor(this.squareSize * 0.22);
    this.ctx.font = `bold ${fontSize}px sans-serif`;
    this.ctx.textBaseline = 'top';

    // Метки файлов и рангов всегда контрастны к цвету клетки, на которой стоят, иначе теряются на тёмных палитрах.
    const bottomRank = orientation === 'white' ? 0 : 7;
    for (let f = 0; f < 8; f++) {
      const file = orientation === 'white' ? f : 7 - f;
      const sq = Square.of(file, bottomRank);
      const { x } = this.toCanvas(sq, orientation);
      const fileChar = sq.algebraic.charAt(0);
      const squareIsDark = (file + bottomRank) % 2 === 0;
      this.ctx.fillStyle = squareIsDark ? c.light : c.dark;
      this.ctx.textAlign = 'right';
      this.ctx.fillText(
        fileChar,
        x + this.squareSize - 4,
        this.canvas.height - this.squareSize * 0.22,
      );
    }

    for (let r = 0; r < 8; r++) {
      const rank = orientation === 'white' ? 7 - r : r;
      const sq = Square.of(0, rank);
      const { y } = this.toCanvas(sq, orientation);
      const squareIsDark = (rank) % 2 === 0;
      this.ctx.fillStyle = squareIsDark ? c.light : c.dark;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${rank + 1}`, 4, y + 2);
    }
  }
}
