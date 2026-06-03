import { applyUciMove, uciToSan } from '@modules/game/application';

export interface PvDisplayItem {
  readonly san: string;
  readonly showNumber: boolean;
  readonly numberLabel: string;
}

/**
 * Превращает PV (массив UCI) в массив подготовленных элементов для рендера:
 * SAN ходов + флаг показа номера хода + лейбл «N.» / «N…».
 * Используется для отображения варианта движка в карточке «Пусть решит ИИ».
 */
export function buildPvDisplay(startFen: string, pvUci: readonly string[]): readonly PvDisplayItem[] {
  if (pvUci.length === 0 || !startFen) return [];
  const startSide = startFen.split(/\s+/)[1] === 'b' ? 'b' : 'w';
  const out: PvDisplayItem[] = [];
  let fen = startFen;
  for (let i = 0; i < pvUci.length; i++) {
    const uci = pvUci[i] ?? '';
    let san = uci;
    try {
      san = uciToSan(fen, uci);
      fen = applyUciMove(fen, uci);
    } catch { /* keep uci as fallback */ }
    const sideOfThisMove = (i % 2 === 0) ? startSide : (startSide === 'w' ? 'b' : 'w');
    const fullmove = 1 + Math.floor((i + (startSide === 'b' ? 1 : 0)) / 2);
    out.push({
      san,
      showNumber: sideOfThisMove === 'w' || i === 0,
      numberLabel: `${String(fullmove)}${sideOfThisMove === 'w' ? '.' : '…'}`,
    });
  }
  return out;
}
