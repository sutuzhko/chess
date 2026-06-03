import type { MoveMade } from '@modules/game/domain/game';
import { BoardSnapshot, Match } from '@modules/game/domain/game';
import {
  moveToSan,
  sanToMove,
} from '@modules/game/domain/game/notation/San.js';

export interface PgnHeaders {
  readonly Event?: string;
  readonly Site?: string;
  readonly Date?: string;
  readonly White?: string;
  readonly Black?: string;
  readonly Result?: string;
  readonly FEN?: string;
  readonly [key: string]: string | undefined;
}

const formatHeaders = (headers: PgnHeaders): string => {
  const lines: string[] = [];
  for (const key of Object.keys(headers)) {
    const value = headers[key];
    if (value !== undefined) lines.push(`[${key} "${value.replace(/"/g, '\\"')}"]`);
  }
  return lines.join('\n');
};

const wrapMoveText = (text: string, max = 80): string => {
  const tokens = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const t of tokens) {
    if (current.length + t.length + 1 > max) {
      if (current) lines.push(current);
      current = t;
    } else {
      current = current ? `${current} ${t}` : t;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
};

export class PgnCodec {
  static export(match: Match, headers: PgnHeaders = {}): string {
    const initialSnapshot = match.timeline.entryAt(0).snapshot;
    const initialFen = initialSnapshot.toFen();
    const isCustomStart =
      initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    const finalStatus = match.status;
    let result = '*';
    if (finalStatus.kind === 'checkmate') {
      result = finalStatus.winner === 'white' ? '1-0' : '0-1';
    } else if (
      finalStatus.kind === 'stalemate' ||
      finalStatus.kind === 'draw-50-move' ||
      finalStatus.kind === 'draw-insufficient-material' ||
      finalStatus.kind === 'agreed-draw' ||
      finalStatus.kind === 'draw-threefold-repetition'
    ) {
      result = '1/2-1/2';
    }

    const fullHeaders: PgnHeaders = {
      Event: 'Casual',
      Site: 'Local',
      Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      White: 'White',
      Black: 'Black',
      Result: result,
      ...(isCustomStart ? { SetUp: '1', FEN: initialFen } : {}),
      ...headers,
    };

    const tokens: string[] = [];
    let snap = initialSnapshot;
    for (let i = 1; i < match.timeline.length; i++) {
      const entry = match.timeline.entryAt(i);
      const moveEvent = entry.events.find((e): e is MoveMade => e.type === 'MoveMade');
      if (!moveEvent) throw new Error(`Timeline entry ${i} missing MoveMade`);
      const moveNumber = snap.fullmoveNumber;
      if (snap.sideToMove === 'white') tokens.push(`${moveNumber}.`);
      else if (i === 1) tokens.push(`${moveNumber}...`);
      tokens.push(moveToSan(snap, moveEvent.move));
      snap = moveEvent.snapshotAfter;
    }
    tokens.push(result);

    return `${formatHeaders(fullHeaders)}\n\n${wrapMoveText(tokens.join(' '))}\n`;
  }

  static import(pgn: string, matchId = 'imported'): Match {
    const headerLines: string[] = [];
    const bodyLines: string[] = [];
    for (const line of pgn.split(/\r?\n/)) {
      if (line.startsWith('[')) headerLines.push(line);
      else bodyLines.push(line);
    }
    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const m = /^\[(\w+)\s+"([^"]*)"\]/.exec(line);
      if (m) headers[m[1] ?? ''] = m[2] ?? '';
    }
    const initial = headers.FEN ? BoardSnapshot.fromFen(headers.FEN) : BoardSnapshot.initial();
    const match = Match.start(matchId, initial);

    let body = bodyLines.join(' ');
    body = body.replace(/\{[^}]*\}/g, ' ');
    body = body.replace(/;[^\n]*/g, ' ');
    body = body.replace(/\([^)]*\)/g, ' ');
    body = body.replace(/\$\d+/g, ' ');
    body = body.replace(/\d+\.+/g, ' ');

    const tokens = body
      .split(/\s+/)
      .filter((t) => t.length > 0 && t !== '*' && !/^(1-0|0-1|1\/2-1\/2)$/.test(t));

    for (const token of tokens) {
      const move = sanToMove(match.currentSnapshot, token);
      const input: { from: typeof move.from; to: typeof move.to; promotion?: 'queen' | 'rook' | 'bishop' | 'knight' } = {
        from: move.from,
        to: move.to,
      };
      if (move.promotion) input.promotion = move.promotion;
      match.applyMove(input);
    }
    return match;
  }
}
