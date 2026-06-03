import type { DomainEvent } from '@shared/types/DomainEvent.js';
import type { BoardSnapshot } from './BoardSnapshot.js';

export interface TimelineEntry {
  readonly snapshot: BoardSnapshot;
  readonly events: readonly DomainEvent[];
}

export class Timeline {
  private entries: TimelineEntry[];
  private cursor: number;

  private constructor(entries: TimelineEntry[], cursor: number) {
    this.entries = entries;
    this.cursor = cursor;
  }

  static from(initial: BoardSnapshot): Timeline {
    return new Timeline([{ snapshot: initial, events: [] }], 0);
  }

  get current(): BoardSnapshot {
    const entry = this.entries[this.cursor];
    if (!entry) throw new Error('Timeline cursor out of range');
    return entry.snapshot;
  }

  get currentIndex(): number {
    return this.cursor;
  }

  get length(): number {
    return this.entries.length;
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.entries.length - 1;
  }

  entryAt(index: number): TimelineEntry {
    if (index < 0 || index >= this.entries.length) {
      throw new RangeError(`Timeline index out of range: ${index}`);
    }
    const entry = this.entries[index];
    if (!entry) throw new RangeError(`Timeline index out of range: ${index}`);
    return entry;
  }

  push(snapshot: BoardSnapshot, events: readonly DomainEvent[]): void {
    if (this.cursor < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.cursor + 1);
    }
    this.entries.push({ snapshot, events });
    this.cursor = this.entries.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo) return false;
    this.cursor--;
    return true;
  }

  redo(): boolean {
    if (!this.canRedo) return false;
    this.cursor++;
    return true;
  }

  jumpTo(index: number): void {
    if (index < 0 || index >= this.entries.length) {
      throw new RangeError(`Timeline index out of range: ${index}`);
    }
    this.cursor = index;
  }

  *iter(): Generator<TimelineEntry> {
    for (const entry of this.entries) yield entry;
  }
}
