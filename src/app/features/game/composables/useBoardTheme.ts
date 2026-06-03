import { useSettingsStore } from '@app/stores/settings.js';
import { watch } from 'vue';

export interface BoardThemeTarget {
  rerender(): void;
}

/**
 * Связка settings → canvas. Канвас не реактивен, поэтому при смене
 * темы/палитры
 * императивно дёргаем `target.rerender()`. `BoardView.render()` читает
 * CSS-переменные через `getComputedStyle` на каждый вызов, так что новые
 * значения подхватываются сразу.
 */
export function useBoardTheme(getTarget: () => BoardThemeTarget | null | undefined): void {
  const settings = useSettingsStore();
  watch(
    () => [settings.theme, settings.accent, settings.board, settings.pieceSet] as const,
    () => { getTarget()?.rerender(); },
    { flush: 'post' },
  );
}
