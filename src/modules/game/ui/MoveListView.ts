import type { Match, MoveMade } from '@modules/game/domain/game';
import { moveToSan } from '@modules/game/domain/game/notation/San.js';

interface MoveRow {
  number: number;
  white: string | null;
  black: string | null;
  whiteIndex: number | null;
  blackIndex: number | null;
}

export class MoveListView {
  constructor(
    private readonly el: HTMLElement,
    private readonly onJump?: (timelineIndex: number) => void,
  ) {
    el.addEventListener('click', (e) => {
      const ply = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
      if (!ply?.dataset.index) return;
      const idx = Number(ply.dataset.index);
      if (!Number.isNaN(idx)) this.onJump?.(idx);
    });
  }

  render(match: Match): void {
    const timeline = match.timeline;
    const total = timeline.length;
    const currentIdx = timeline.currentIndex;
    const rows: MoveRow[] = [];

    for (let i = 1; i < total; i++) {
      const prevSnap = timeline.entryAt(i - 1).snapshot;
      const entry = timeline.entryAt(i);
      const moveEvent = entry.events.find((e) => e.type === 'MoveMade') as
        | MoveMade
        | undefined;
      if (!moveEvent) continue;

      let san: string;
      try {
        san = moveToSan(prevSnap, moveEvent.move);
      } catch {
        san = moveEvent.move.toUci();
      }

      if (prevSnap.sideToMove === 'white') {
        rows.push({ number: rows.length + 1, white: san, black: null, whiteIndex: i, blackIndex: null });
      } else {
        const last = rows[rows.length - 1];
        if (last?.black === null) {
          last.black = san;
          last.blackIndex = i;
        } else {
          rows.push({ number: rows.length + 1, white: null, black: san, whiteIndex: null, blackIndex: i });
        }
      }
    }

    this.el.innerHTML = rows
      .map((row) => {
        const wActive = row.whiteIndex === currentIdx;
        const bActive = row.blackIndex === currentIdx;
        const wFuture = row.whiteIndex !== null && row.whiteIndex > currentIdx;
        const bFuture = row.blackIndex !== null && row.blackIndex > currentIdx;
        return (
          `<div class="moves__row">` +
          `<div class="moves__num">${ row.number }.</div>` +
          `<div class="moves__ply${ wActive ? ' is-current' : '' }${ wFuture
            ? ' t-faint'
            : '' }" data-index="${ row.whiteIndex ?? '' }">${ row.white ?? '' }</div>` +
          `<div class="moves__ply${ bActive ? ' is-current' : '' }${ bFuture
            ? ' t-faint'
            : '' }" data-index="${ row.blackIndex ?? '' }">${ row.black ?? '' }</div>` +
          `</div>`
        );
      })
      .join('');

    const current = this.el.querySelector<HTMLElement>('.is-current');
    if (current) scrollWithinContainer(this.el, current);
  }
}

/**
 * Прокрутить контейнер так, чтобы `target` был виден, НЕ затрагивая прокрутку
 * родителей. Стандартный `scrollIntoView` всплывает по всем scrollable-предкам
 * и тянет за собой всю страницу — на мобильных это даёт прыжок к списку ходов
 * после каждого хода.
 */
function scrollWithinContainer(container: HTMLElement, target: HTMLElement): void {
  const cRect = container.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  if (tRect.top < cRect.top) {
    container.scrollTop -= cRect.top - tRect.top;
  } else if (tRect.bottom > cRect.bottom) {
    container.scrollTop += tRect.bottom - cRect.bottom;
  }
}
