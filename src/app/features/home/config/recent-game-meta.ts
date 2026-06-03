import type {
  RecentGameResult,
} from '@app/features/home/composables/useHomeStats.js';

/** Цвет бейджа результата партии. */
export function resultTone(r: RecentGameResult): 'success' | 'danger' | 'default' {
  if (r === 'win') return 'success';
  if (r === 'loss') return 'danger';
  return 'default';
}

/** Форматирование контроля времени `{initial}+{increment}` в виде «10+0».
 *  Для безлимита (initialSeconds === 0) возвращаем «∞». */
export function formatTimeControl(initialSeconds: number, incrementSeconds: number): string {
  if (initialSeconds === 0) return '∞';
  const minutes = Math.round(initialSeconds / 60);
  return `${String(minutes)}+${String(incrementSeconds)}`;
}

const RELATIVE_THRESHOLDS = [
  { limitMs: 60_000, key: 'home.recentGames.relative.justNow' },
  { limitMs: 3_600_000, divisor: 60_000, key: 'home.recentGames.relative.minutesAgo' },
  { limitMs: 86_400_000, divisor: 3_600_000, key: 'home.recentGames.relative.hoursAgo' },
] as const;

export interface RelativeTimeKey {
  /** i18n-ключ. */
  key: string;
  /** Параметр {n} для интерполяции. */
  n?: number;
}

/** Подбирает i18n-ключ + значение n для текстов «только что / 5 мин назад / вчера / 3 дня». */
export function relativeTimeKey(savedAt: string | null, now: number = Date.now()): RelativeTimeKey {
  if (!savedAt) return { key: 'home.recentGames.relative.unknown' };
  const ms = now - new Date(savedAt).getTime();
  if (ms < 0) return { key: 'home.recentGames.relative.justNow' };
  for (const t of RELATIVE_THRESHOLDS) {
    if (ms < t.limitMs) {
      if ('divisor' in t) return { key: t.key, n: Math.max(1, Math.floor(ms / t.divisor)) };
      return { key: t.key };
    }
  }
  const days = Math.floor(ms / 86_400_000);
  if (days === 1) return { key: 'home.recentGames.relative.yesterday' };
  return { key: 'home.recentGames.relative.daysAgo', n: days };
}
