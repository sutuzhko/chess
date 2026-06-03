/** Ключи и префиксы localStorage, используемые домашним экраном. */
export const HOME_STORAGE_KEYS = {
  /** Сводная статистика игрока (solved/rating/streak + недельный baseline). */
  stats: 'chess.stats',
  /** Префикс ключей сохранённых матчей (standard / opening_training / shvedki). */
  matchPrefix: 'chess.match.',
  /** Префикс конфигов сохранённых матчей (mode / opponent / side / time control). */
  matchConfigPrefix: 'chess.match-config.',
  /** Префикс сериализованных состояний шведок (phase, доски, резервы). */
  shvedkiPrefix: 'chess.shvedki-state.',
} as const;
