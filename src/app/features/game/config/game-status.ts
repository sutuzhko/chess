import { i18n } from '@app/shared/i18n';

/**
 * Утилиты статусов партии — оборачивают i18n.global.t() так, чтобы
 * композаблы и use-case'ы могли получать локализованные строки без
 * прямой зависимости от Vue i18n composable.
 */
const t = i18n.global.t.bind(i18n.global);

export function buildStatusText(
  sideToMove: 'white' | 'black',
  isInCheck: boolean,
  isAiBusy: boolean,
): string {
  let text = sideToMove === 'white'
    ? t('game.status.whiteToMove')
    : t('game.status.blackToMove');
  if (isInCheck) text += ` ${t('game.status.check')}`;
  if (isAiBusy) text += ` ${t('game.status.aiThinking')}`;
  return text;
}

export interface GameOverMessage {
  title: string;
  body: string;
}

function sideLabel(winner?: 'white' | 'black'): string {
  return winner === 'white'
    ? t('game.color.white')
    : t('game.color.black');
}

export function buildGameOverMessage(
  kind: string,
  winner?: 'white' | 'black',
): GameOverMessage | null {
  const w = sideLabel(winner);
  switch (kind) {
    case 'checkmate':
      return { title: t('game.result.wonTitle', { side: w }), body: t('game.result.checkmate') };
    case 'stalemate':
      return { title: t('game.result.drawTitle'), body: t('game.result.stalemate') };
    case 'draw-50-move':
      return { title: t('game.result.drawTitle'), body: t('game.result.draw50') };
    case 'draw-insufficient-material':
      return { title: t('game.result.drawTitle'), body: t('game.result.drawMaterial') };
    case 'draw-threefold-repetition':
      return { title: t('game.result.drawTitle'), body: t('game.result.drawRepetition') };
    case 'agreed-draw':
      return { title: t('game.result.drawTitle'), body: t('game.result.agreedDraw') };
    case 'resignation': {
      const loser = winner === 'white' ? 'black' : 'white';
      const loserLabel = sideLabel(loser);
      const winnerLabel = sideLabel(winner);
      return { title: t('game.result.wonTitle', { side: winnerLabel }), body: t('game.result.resignTitle', { side: loserLabel }) };
    }
    case 'time-forfeit':
      return { title: t('game.result.wonTitle', { side: w }), body: t('game.result.timeForfeit') };
    default:
      return null;
  }
}

export function buildStatusFromMatch(kind: string, winner?: 'white' | 'black'): string {
  const w = sideLabel(winner);
  switch (kind) {
    case 'checkmate':                  return t('game.status.matedSide', { side: w });
    case 'stalemate':                  return t('game.status.stalemateDraw');
    case 'draw-50-move':               return t('game.status.draw50');
    case 'draw-insufficient-material': return t('game.status.drawMaterial');
    case 'draw-threefold-repetition':  return t('game.status.drawRepetition');
    case 'time-forfeit':               return t('game.status.timeForfeit', { side: w });
    default:                           return kind;
  }
}
