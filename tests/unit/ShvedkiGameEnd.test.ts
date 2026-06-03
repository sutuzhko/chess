import { BoardSnapshot } from '@/modules/game/domain/game';
import { type BoardId, DualBoard } from '@/modules/game/domain/shvedki';
import {
  checkGameEnd,
  isFinalMate,
  RESCUE_PLIES_BUDGET,
} from '@/modules/game/ui/canvas/shvedki/game-end';
import type {
  ShvedkiEndReason,
  ShvedkiGamePhase,
  ShvedkiGameResult,
  ShvedkiSerializableState,
} from '@/modules/game/ui/canvas/shvedki/serialization';
import { describe, expect, it, vi } from 'vitest';

// Контрольные позиции:
//   FOOLS_MATE   — 1.f3 e5 2.g4?? Qh4#. Ход белых; белые получили линейный мат
//                  ферзём по диагонали e1–h4 — финальный (фигура для блока
//                  заняла бы поле g3, но это поле бьётся пешкой f3? — нет, пешка f3
//                  не бьёт g3; зато g3 атакует королём — блок невозможен,
//                  потому что между ферзём h4 и королём e1 поля f2/g3 не могут
//                  быть закрыты дропом без шаха).
//                  Тем не менее ShvedkiMoveGenerator корректно определит наличие
//                  блокирующих дропов — конкретное поведение проверяет тест.
//   SCHOLARS_MATE — 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#. Ход чёрных; финальный мат
//                  (ферзь на f7 контактно, перекрыть нельзя).
//   ROOK_BLOCKABLE — мат, который МОЖНО перекрыть дропом (ладья по линии с пустотой).
const SCHOLARS_MATE_B = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
// Контактный мат ферзём (нет полей между ферзём и королём → перекрыть нельзя):
// чёрный ферзь на e7, чёрный король на h4, белый король на e1 — придуманная конструкция.
// Удобнее использовать «smothered mate»-подобный мат конём (всегда финальный).
// Пример: чёрный король g8 окружён своими фигурами, белый конь даёт мат на f7.
const SMOTHERED_MATE_B = '6rk/5Npp/8/8/8/8/8/4K3 b - - 0 1';
// Перекрываемый ладейный мат: чёрный король h8, белая ладья по линии 8, но есть
// промежуточное пустое поле, на которое можно дропнуть фигуру.
// Король h8, ладья a8 (даёт мат по 8-й линии), белый король e1 — между ними
// b8..g8 пусто и любая фигура (кроме пешки на крайних рядах) перекрывает.
const ROOK_BLOCKABLE_B = 'R6k/6pp/8/8/8/8/8/4K3 b - - 0 1';

function makeState(opts: {
  fenA: string;
  fenB: string;
  mateBoardId?: BoardId | null;
  phase?: ShvedkiGamePhase;
}): ShvedkiSerializableState {
  const dualBoard = DualBoard.initial();
  dualBoard.setSnapshot('A', BoardSnapshot.fromFen(opts.fenA));
  dualBoard.setSnapshot('B', BoardSnapshot.fromFen(opts.fenB));
  return {
    dualBoard,
    capturedByA: { white: [], black: [] },
    capturedByB: { white: [], black: [] },
    movesA: [],
    movesB: [],
    mateBoardId: opts.mateBoardId ?? null,
    phase: opts.phase ?? { kind: 'playing' },
  };
}

interface CallbackSpies {
  onStatusUpdate: (text: string) => void;
  onLastMoveStarted: (boardId: BoardId, color: 'white' | 'black') => void;
  onGameEnd: (result: ShvedkiGameResult, reason: ShvedkiEndReason) => void;
}

function spies(): CallbackSpies {
  return {
    onStatusUpdate: vi.fn<(text: string) => void>(),
    onLastMoveStarted: vi.fn<(b: BoardId, c: 'white' | 'black') => void>(),
    onGameEnd: vi.fn<(r: ShvedkiGameResult, reason: ShvedkiEndReason) => void>(),
  };
}

describe('shvedki/isFinalMate', () => {
  it('контактный мат ферзём (Scholar) — финальный, перекрыть нельзя', () => {
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    expect(isFinalMate(state, 'A')).toBe(true);
  });

  it('задушенный мат конём — финальный, дропа на поле не существует', () => {
    const state = makeState({
      fenA: SMOTHERED_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    expect(isFinalMate(state, 'A')).toBe(true);
  });

  it('линейный мат ладьёй с пустыми полями между ладьёй и королём — НЕ финальный (можно перекрыть дропом)', () => {
    const state = makeState({
      fenA: ROOK_BLOCKABLE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    expect(isFinalMate(state, 'A')).toBe(false);
  });

  it('начальная позиция — не финальный мат', () => {
    const state = makeState({
      fenA: BoardSnapshot.initial().toFen(),
      fenB: BoardSnapshot.initial().toFen(),
    });
    expect(isFinalMate(state, 'A')).toBe(false);
  });
});

describe('shvedki/checkGameEnd · обнаружение мата', () => {
  it('перекрываемый мат не запускает окно спасения — фаза остаётся playing', () => {
    const state = makeState({
      fenA: ROOK_BLOCKABLE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'A',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.phase).toEqual({ kind: 'playing' });
    expect(state.mateBoardId).toBeNull();
    expect(cb.onLastMoveStarted).not.toHaveBeenCalled();
  });

  it('финальный мат на A → фаза last-move на B со счётчиком plies=0', () => {
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'A',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.mateBoardId).toBe('A');
    expect(state.phase).toEqual({
      kind: 'last-move', boardId: 'B', color: 'black', plies: 0,
    });
    expect(cb.onLastMoveStarted).toHaveBeenCalledWith('B', 'black');
  });

  it('финальный мат на B → фаза last-move на A', () => {
    const state = makeState({
      fenA: BoardSnapshot.initial().toFen(),
      fenB: SCHOLARS_MATE_B,
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.mateBoardId).toBe('B');
    expect(state.phase).toEqual({
      kind: 'last-move', boardId: 'A', color: 'black', plies: 0,
    });
  });
});

describe('shvedki/checkGameEnd · разрешение окна спасения', () => {
  it(`окно длится ${String(RESCUE_PLIES_BUDGET)} полухода; ${String(RESCUE_PLIES_BUDGET - 1)}-й полуход без мата ещё не финализирует`, () => {
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
      mateBoardId: 'A',
      phase: { kind: 'last-move', boardId: 'B', color: 'black', plies: 0 },
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    // После 1-го полухода (если не мат) окно ещё открыто — phase last-move.
    expect(state.phase.kind).toBe('last-move');
    if (state.phase.kind === 'last-move') {
      expect(state.phase.plies).toBe(1);
    }
    expect(cb.onGameEnd).not.toHaveBeenCalled();
  });

  it(`по истечении ${String(RESCUE_PLIES_BUDGET)} полуходов без мата — побеждает команда, поставившая мат на X`, () => {
    // Мат был на A с белыми (команда 1 проиграла на X).
    const state = makeState({
      fenA: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
      fenB: BoardSnapshot.initial().toFen(),
      mateBoardId: 'A',
      phase: { kind: 'last-move', boardId: 'B', color: 'white', plies: RESCUE_PLIES_BUDGET - 1 },
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.phase).toEqual({ kind: 'finished', result: 'team-2-wins' });
    expect(cb.onGameEnd).toHaveBeenCalledWith('team-2-wins', 'mate');
  });

  it('мат на доске спасения по ДРУГОЙ команде → ничья', () => {
    // На A — мат чёрных (команда 2 проиграла на X = losingTeamOnX = 2).
    // На B — мат белых (teamOf('B','white') = 2). Это та же команда — выигрывает противоположная.
    // Чтобы получить ДРУГУЮ команду, нужен мат чёрных на B.
    // teamOf('B','black') = 1 ≠ 2 → ничья.
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: SMOTHERED_MATE_B, // ход чёрных, чёрные получили мат → teamOf('B','black')=1
      mateBoardId: 'A',
      phase: { kind: 'last-move', boardId: 'B', color: 'black', plies: 0 },
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.phase).toEqual({ kind: 'finished', result: 'draw' });
    expect(cb.onGameEnd).toHaveBeenCalledWith('draw', 'draw');
  });

  it('мат на доске спасения по ТОЙ ЖЕ команде → побеждает противоположная команда (не ничья!)', () => {
    // На A: мат чёрных (команда 2). На B: мат белых (команда 2). Обе доски — мат
    // команде 2. Должна победить команда 1.
    // Белые получили мат на B → нужна позиция «ход белых, белые в мате».
    const WHITE_MATED_ON_B = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: WHITE_MATED_ON_B,
      mateBoardId: 'A',
      phase: { kind: 'last-move', boardId: 'B', color: 'black', plies: 0 },
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.phase).toEqual({ kind: 'finished', result: 'team-1-wins' });
    expect(cb.onGameEnd).toHaveBeenCalledWith('team-1-wins', 'mate');
  });

  it('регрессия: финальный контактный мат после блока дропом → фаза last-move (не playing)', () => {
    // Реальный кейс из багрепорта: на B сыграно 1.f4 e6 2.g4 Qh4# 3.P@f2 Bc5 4.b3 Qxf2#.
    // Финальный мат — ферзь рядом с королём, перекрыть нельзя.
    const fenB = 'rnb1k1nr/pppp1ppp/4p3/2b5/5PP1/1P6/P1PPPq1P/RNBQKBNR w KQkq - 0 5';
    const state = makeState({
      fenA: BoardSnapshot.initial().toFen(),
      fenB,
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'B',
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.mateBoardId).toBe('B');
    expect(state.phase.kind).toBe('last-move');
    if (state.phase.kind === 'last-move') {
      expect(state.phase.boardId).toBe('A');
      expect(state.phase.color).toBe('white');
      expect(state.phase.plies).toBe(0);
    }
  });

  it('регрессия: вызов checkGameEnd мутирует объект state (контроллер должен читать поля обратно)', () => {
    // Проверяем именно протокол передачи состояния: контроллер передаёт «снимок»
    // своих полей в виде объекта state. checkGameEnd ДОЛЖЕН переписать
    // state.phase и state.mateBoardId, чтобы контроллер мог скопировать обратно.
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
    });
    const phaseBefore = state.phase;
    const mateBefore = state.mateBoardId;
    checkGameEnd({
      state, movedBoardId: 'A',
      formatMateStatus: () => 'mate',
      ...spies(),
    });
    // Идентификаторы ссылок должны различаться — иначе мутация не пройдёт через
    // объектную ссылку (типичный баг).
    expect(state.phase).not.toBe(phaseBefore);
    expect(state.mateBoardId).not.toBe(mateBefore);
  });

  it('ход на доске мата в фазе last-move игнорируется', () => {
    const state = makeState({
      fenA: SCHOLARS_MATE_B,
      fenB: BoardSnapshot.initial().toFen(),
      mateBoardId: 'A',
      phase: { kind: 'last-move', boardId: 'B', color: 'black', plies: 0 },
    });
    const cb = spies();
    checkGameEnd({
      state, movedBoardId: 'A', // ход на «матованной» доске
      formatMateStatus: () => 'mate',
      ...cb,
    });
    expect(state.phase).toEqual({
      kind: 'last-move', boardId: 'B', color: 'black', plies: 0,
    });
    expect(cb.onGameEnd).not.toHaveBeenCalled();
  });
});
