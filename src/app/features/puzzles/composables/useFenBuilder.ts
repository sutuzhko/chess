import {
  buildFen,
  type CastlingFlags,
  type Color,
  emptySquares,
  INITIAL_FEN_BUILDER,
  type PlacedPiece,
  placementFromFen,
  squareIndex,
} from '@app/features/puzzles/utils/fen-builder.js';
import type {
  PieceType,
} from '@modules/game/domain/game/value-objects/PieceType.js';
import { computed, type ComputedRef, reactive, ref, type Ref } from 'vue';

export type Tool =
  | { kind: 'place'; piece: PlacedPiece }
  | { kind: 'erase' }
  | { kind: 'none' };

export interface FenBuilderCell {
  readonly idx: number;
  readonly light: boolean;
  readonly algebraic: string;
  readonly label: string;
}

interface DragState {
  source: 'palette' | 'board';
  piece: PlacedPiece;
  fromIdx: number | null;
}

export interface UseFenBuilder {
  squares: Ref<(PlacedPiece | null)[]>;
  sideToMove: Ref<Color>;
  castling: CastlingFlags;
  orientation: Ref<Color>;
  tool: Ref<Tool>;
  loadError: Ref<string>;
  copied: Ref<boolean>;
  dragTargetIdx: Ref<number | null>;
  cells: ComputedRef<FenBuilderCell[]>;
  fen: ComputedRef<string>;

  isActive: (color: Color, type: PieceType) => boolean;
  selectPiece: (color: Color, type: PieceType) => void;
  selectErase: () => void;
  onCellClick: (idx: number) => void;
  onPaletteDragStart: (color: Color, type: PieceType, ev: DragEvent) => void;
  onPieceDragStart: (idx: number, ev: DragEvent) => void;
  onDragOver: (idx: number, ev: DragEvent) => void;
  onDragLeave: (idx: number) => void;
  onDrop: (idx: number) => void;
  onDragEnd: () => void;
  clearAll: () => void;
  resetInitial: () => void;
  flipOrientation: () => void;
  loadFromFen: (value: string) => void;
  copyFen: () => Promise<void>;
}

export function useFenBuilder(): UseFenBuilder {
  const initial = placementFromFen(INITIAL_FEN_BUILDER);
  const squares = ref<(PlacedPiece | null)[]>(initial.squares);
  const sideToMove = ref<Color>(initial.sideToMove);
  const castling = reactive<CastlingFlags>({ ...initial.castling });
  const orientation = ref<Color>('white');

  const tool = ref<Tool>({ kind: 'none' });
  const loadError = ref('');
  const copied = ref(false);
  const dragTargetIdx = ref<number | null>(null);

  let dragState: DragState | null = null;

  const fen = computed<string>(() => buildFen(squares.value, sideToMove.value, castling));

  const cells = computed<FenBuilderCell[]>(() => {
    const out: FenBuilderCell[] = [];
    const ranksOrder = orientation.value === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const filesOrder = orientation.value === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    for (const r of ranksOrder) {
      for (const f of filesOrder) {
        const idx = squareIndex(f, r);
        const file = String.fromCharCode('a'.charCodeAt(0) + f);
        const rank = (r + 1).toString();
        const label = (orientation.value === 'white' ? f === 0 : f === 7)
          ? rank
          : (orientation.value === 'white' ? r === 0 : r === 7)
            ? file
            : '';
        out.push({
          idx,
          light: (f + r) % 2 === 1,
          algebraic: `${file}${rank}`,
          label,
        });
      }
    }
    return out;
  });

  function isActive(color: Color, type: PieceType): boolean {
    return tool.value.kind === 'place'
      && tool.value.piece.color === color
      && tool.value.piece.type === type;
  }

  function selectPiece(color: Color, type: PieceType): void {
    tool.value = { kind: 'place', piece: { color, type } };
  }
  function selectErase(): void { tool.value = { kind: 'erase' }; }

  function setSquare(idx: number, value: PlacedPiece | null): void {
    const next = squares.value.slice();
    next[idx] = value;
    squares.value = next;
    copied.value = false;
  }

  function onCellClick(idx: number): void {
    const t = tool.value;
    if (t.kind === 'place') setSquare(idx, t.piece);
    else if (t.kind === 'erase') setSquare(idx, null);
    else if (squares.value[idx]) setSquare(idx, null);
  }

  function onPaletteDragStart(color: Color, type: PieceType, ev: DragEvent): void {
    dragState = { source: 'palette', piece: { color, type }, fromIdx: null };
    ev.dataTransfer?.setData('text/plain', `${color}:${type}`);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }

  function onPieceDragStart(idx: number, ev: DragEvent): void {
    const piece = squares.value[idx];
    if (!piece) return;
    dragState = { source: 'board', piece, fromIdx: idx };
    ev.dataTransfer?.setData('text/plain', `move:${String(idx)}`);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(idx: number, ev: DragEvent): void {
    if (!dragState) return;
    dragTargetIdx.value = idx;
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = dragState.source === 'palette' ? 'copy' : 'move';
  }

  function onDragLeave(idx: number): void {
    if (dragTargetIdx.value === idx) dragTargetIdx.value = null;
  }

  function onDrop(idx: number): void {
    if (!dragState) return;
    const next = squares.value.slice();
    if (dragState.source === 'board' && dragState.fromIdx !== null) {
      next[dragState.fromIdx] = null;
    }
    next[idx] = dragState.piece;
    squares.value = next;
    copied.value = false;
    dragTargetIdx.value = null;
    dragState = null;
  }

  function onDragEnd(): void {
    dragState = null;
    dragTargetIdx.value = null;
  }

  function clearAll(): void {
    squares.value = emptySquares();
    castling.whiteKing = false;
    castling.whiteQueen = false;
    castling.blackKing = false;
    castling.blackQueen = false;
    copied.value = false;
  }

  function resetInitial(): void {
    const init = placementFromFen(INITIAL_FEN_BUILDER);
    squares.value = init.squares;
    sideToMove.value = init.sideToMove;
    Object.assign(castling, init.castling);
    copied.value = false;
  }

  function flipOrientation(): void {
    orientation.value = orientation.value === 'white' ? 'black' : 'white';
  }

  function loadFromFen(value: string): void {
    loadError.value = '';
    try {
      const parsed = placementFromFen(value);
      squares.value = parsed.squares;
      sideToMove.value = parsed.sideToMove;
      Object.assign(castling, parsed.castling);
      copied.value = false;
    } catch (e) {
      loadError.value = (e as Error).message;
    }
  }

  async function copyFen(): Promise<void> {
    try {
      await navigator.clipboard.writeText(fen.value);
      copied.value = true;
      setTimeout(() => { copied.value = false; }, 1500);
    } catch { /* ignore */ }
  }

  return {
    squares,
    sideToMove,
    castling,
    orientation,
    tool,
    loadError,
    copied,
    dragTargetIdx,
    cells,
    fen,
    isActive,
    selectPiece,
    selectErase,
    onCellClick,
    onPaletteDragStart,
    onPieceDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    clearAll,
    resetInitial,
    flipOrientation,
    loadFromFen,
    copyFen,
  };
}
