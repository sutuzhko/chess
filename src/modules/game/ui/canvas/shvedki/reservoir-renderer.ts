/** Рендер панели резерва (фигуры на руках) для одной стороны. Чистая функция, мутацию делает caller. */
import type { Color, PieceType } from '@modules/game/domain/game';
import type { BoardId, DualBoard } from '@modules/game/domain/shvedki';
import type { ShvedkiGamePhase } from './serialization.js';

export interface ReservoirRenderArgs {
  panelEl: HTMLElement;
  boardId: BoardId;
  side: Color;
  dualBoard: DualBoard;
  phase: ShvedkiGamePhase;
  dropPending: { boardId: BoardId; piece: PieceType } | null;
  isHumanColor: (boardId: BoardId, color: Color) => boolean;
  onPick: (pickedPiece: PieceType) => void;
}

export function renderReservoir(args: ReservoirRenderArgs): void {
  const { panelEl, boardId, side, dualBoard, phase, dropPending, isHumanColor, onPick } = args;
  const snap = dualBoard.snapshot(boardId);
  const isLastMoveBoard = phase.kind === 'last-move' && phase.boardId === boardId;
  const activeColor: Color | null =
    phase.kind === 'last-move' ? (isLastMoveBoard ? phase.color : null) : snap.sideToMove;

  const reserves = dualBoard.reserves(boardId);
  const pool = side === 'white' ? reserves.white : reserves.black;
  panelEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'reservoir__row';
  for (const pieceType of pool.available()) {
    const count = pool.count(pieceType);
    const isSelected =
      dropPending?.boardId === boardId && dropPending.piece === pieceType;
    const btn = document.createElement('button');
    btn.className = `reservoir__piece${isSelected ? ' is-selected' : ''}`;
    btn.disabled =
      phase.kind === 'finished'
      || side !== activeColor
      || !isHumanColor(boardId, side);
    const img = document.createElement('img');
    img.src = `${import.meta.env.BASE_URL}figures/${pieceType}-${side}.png`;
    img.alt = pieceType;
    img.className = 'reservoir__piece-img';
    btn.appendChild(img);
    if (count > 1) {
      const cnt = document.createElement('span');
      cnt.className = 'reservoir__count';
      cnt.textContent = `×${String(count)}`;
      btn.appendChild(cnt);
    }
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      onPick(pieceType);
    });
    row.appendChild(btn);
  }
  panelEl.appendChild(row);
}
