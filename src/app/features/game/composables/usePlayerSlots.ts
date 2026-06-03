import {
  type CapturedDisplay,
  EMPTY_CAPTURED,
} from '@app/features/game/utils/capture-utils.js';
import { useSettingsStore } from '@app/stores/settings.js';
import type { Color } from '@modules/game/domain/game';
import { computed, type ComputedRef } from 'vue';
import type { GameUiState } from './game-shell/types.js';

export interface PlayerSlot {
  label: ComputedRef<string>;
  avatar: ComputedRef<string>;
  active: ComputedRef<boolean>;
  dot: ComputedRef<boolean>;
  captured: ComputedRef<CapturedDisplay>;
  color: ComputedRef<Color>;
  clock: ComputedRef<string>;
  clockClass: ComputedRef<string>;
}

export interface PlayerSlots {
  me: PlayerSlot;
  opponent: PlayerSlot;
}

// TODO i18n: ключи game.slot.shvedki.{me,opponent}.
const SHVEDKI_LABEL: Record<'me' | 'opponent', string> = {
  me: 'Команда 1 · Белые · A',
  opponent: 'Команда 2 · Чёрные · A',
};

const SHVEDKI_AVATAR: Record<'me' | 'opponent', string> = {
  me: 'W·A',
  opponent: 'B·A',
};

export function usePlayerSlots(ui: GameUiState): PlayerSlots {
  const settings = useSettingsStore();
  const capturedVisible = computed(() => settings.standardUI.captured);

  /** Создаёт PlayerSlot для роли, читая цвет лениво из ui-snapshot. */
  function slotFor(role: 'me' | 'opponent', color: () => Color): PlayerSlot {
    const isWhite = (): boolean => color() === 'white';

    return {
      label: computed(() => {
        if (ui.gameMode === 'shvedki') return SHVEDKI_LABEL[role];
        // TODO i18n: ключи game.color.white / game.color.black.
        return isWhite() ? 'Белые' : 'Чёрные';
      }),
      avatar: computed(() => {
        if (ui.gameMode === 'shvedki') return SHVEDKI_AVATAR[role];
        return isWhite() ? 'W' : 'B';
      }),
      active: computed(() => (isWhite() ? ui.playerWhiteActive : ui.playerBlackActive)),
      dot: computed(() => (isWhite() ? ui.dotWhiteVisible : ui.dotBlackVisible)),
      captured: computed(() => {
        if (!capturedVisible.value) return EMPTY_CAPTURED;
        return isWhite() ? ui.capturedWhite : ui.capturedBlack;
      }),
      color: computed<Color>(() => color()),
      clock: computed(() => (isWhite() ? ui.clockWhite : ui.clockBlack)),
      clockClass: computed(() => (isWhite() ? ui.clockWhiteClass : ui.clockBlackClass)),
    };
  }

  return {
    me: slotFor('me', () => ui.playerColor),
    opponent: slotFor('opponent', () => ui.opponentColor),
  };
}
