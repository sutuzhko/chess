import type { Match } from '@modules/game/domain/game';
import type { DomainEvent } from '@shared/types/DomainEvent.js';

export interface EngineSnapshot {
  depth: number;
  score: number;
  bestMoveUci: string | null;
  pv: readonly string[];
  nodes: number;
  elapsedMs: number;
}

// Дженерик-итерация по неизвестным полям события — нужно ослабленное
// представление DomainEvent как обычной записи.
const asRecord = (e: DomainEvent): Readonly<Record<string, unknown>> =>
  e as unknown as Readonly<Record<string, unknown>>;

const eventLine = (e: DomainEvent): string => {
  const t = new Date(e.occurredAt).toISOString().slice(11, 23);
  const tail = Object.entries(asRecord(e))
    .filter(([k]) => k !== 'type' && k !== 'occurredAt' && k !== 'matchId')
    .map(([k, v]) => `${k}=${JSON.stringify(formatVal(v))}`)
    .join(' ');
  return `${t} [${e.type}] ${tail}`;
};

const formatVal = (v: unknown): unknown => {
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.algebraic === 'string') return obj.algebraic;
    if (typeof obj.toUci === 'function') return (obj as { toUci: () => string }).toUci();
  }
  return v;
};

export class DevOverlay {
  private events: DomainEvent[] = [];
  private engineInfo: EngineSnapshot | null = null;
  private hidden = true;

  constructor(private readonly root: HTMLElement) {
    this.root.style.display = 'none';
  }

  toggle(): void {
    this.hidden = !this.hidden;
    this.root.style.display = this.hidden ? 'none' : 'block';
  }

  recordEvent(e: DomainEvent): void {
    this.events.unshift(e);
    if (this.events.length > 80) this.events.length = 80;
  }

  setEngineInfo(info: EngineSnapshot | null): void {
    this.engineInfo = info;
  }

  render(match: Match): void {
    if (this.hidden) return;
    const snap = match.currentSnapshot;
    const lines: string[] = [];
    lines.push(`FEN: ${snap.toFen()}`);
    lines.push(
      `side=${snap.sideToMove}  castling=${snap.castlingRights.toFen()}  ep=${
        snap.enPassantTarget?.algebraic ?? '-'
      }  half=${snap.halfmoveClock}  full=${snap.fullmoveNumber}`,
    );
    lines.push(
      `timeline: index=${match.timeline.currentIndex}/${match.timeline.length - 1}  status=${match.status.kind}`,
    );
    if (this.engineInfo) {
      const e = this.engineInfo;
      lines.push('--- engine ---');
      lines.push(
        `depth=${e.depth} score=${e.score}cp best=${e.bestMoveUci ?? '-'} nodes=${e.nodes} time=${e.elapsedMs}ms`,
      );
      if (e.pv.length) lines.push(`pv: ${e.pv.join(' ')}`);
    }
    lines.push('--- recent events ---');
    for (const e of this.events.slice(0, 20)) lines.push(eventLine(e));
    this.root.textContent = lines.join('\n');
  }
}
