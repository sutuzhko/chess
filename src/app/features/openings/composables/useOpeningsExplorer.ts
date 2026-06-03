import {
  OPENINGS_MIN_GAMES_DEFAULT,
  OPENINGS_SORTS,
  OPENINGS_START_ECO,
  OPENINGS_START_FEN,
  type OpeningsSort,
} from '@app/features/openings/config/openings-constants.js';
import openingBookData from '@app/features/openings/data/opening-book.json';
import openingsData from '@app/features/openings/data/openings.json';
import {
  aggregateSummary,
  type ExplorerRow,
  type PositionSummary,
  sortRows,
} from '@app/features/openings/utils/openings-stats.js';
import {
  useOpeningSourceService,
} from '@app/stores/services/opening-source.js';
import type {
  BookMove,
  LineStep,
  OpeningDef,
} from '@modules/game/application';
import { applyUciMove, OpeningBook } from '@modules/game/application';
import {
  computed,
  type ComputedRef,
  ref,
  type Ref,
  shallowRef,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

export interface Breadcrumb {
  readonly number: number;
  readonly white: string;
  readonly black: string;
}

export type { ExplorerRow, PositionSummary };

export interface UseOpeningsExplorer {
  readonly catalog: readonly OpeningDef[];
  readonly selectedName: Ref<string>;
  readonly currentFen: ComputedRef<string>;
  readonly boardMoves: ComputedRef<string[]>;
  /** SAN сделанных ходов через пробел; пригоден для восстановления линии из книги. */
  readonly currentLineSan: ComputedRef<string>;
  /** Ходы-кандидаты, отфильтрованные {@link minGames} и отсортированные по {@link sort}. */
  readonly visibleResponses: ComputedRef<readonly ExplorerRow[]>;
  readonly responsesLoading: Ref<boolean>;
  /** Суммарный W/D/L по всем кандидатам в текущей позиции. */
  readonly positionSummary: ComputedRef<PositionSummary | null>;
  /** Сколько всего партий стоит за текущей позицией. */
  readonly gamesTotal: ComputedRef<number>;
  /** Максимум количества партий среди кандидатов — верхняя граница для фильтра. */
  readonly maxGames: ComputedRef<number>;
  readonly sort: Ref<OpeningsSort>;
  readonly minGames: Ref<number>;
  readonly breadcrumbs: ComputedRef<Breadcrumb[]>;
  readonly sideToMove: ComputedRef<'white' | 'black'>;
  readonly movePrefix: ComputedRef<string>;
  readonly flipped: Ref<boolean>;
  /** i18n-ключ имени текущего дебюта (переводится на стороне вызова). */
  readonly openingTitleKey: ComputedRef<string>;
  readonly openingEco: ComputedRef<string>;
  readonly canBack: ComputedRef<boolean>;
  readonly canForward: ComputedRef<boolean>;
  readonly ply: Ref<number>;
  readonly selectOpening: (def: OpeningDef) => void;
  readonly playMove: (uci: string, san: string) => void;
  readonly goBack: () => void;
  readonly goForward: () => void;
  readonly goToPly: (n: number) => void;
  readonly toggleFlip: () => void;
  readonly train: () => void;
}

function fenSide(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

function fenFullmove(fen: string): number {
  return Number(fen.split(' ')[5] ?? '1');
}

export function useOpeningsExplorer(): UseOpeningsExplorer {
  const router = useRouter();

  const catalog = openingsData as readonly OpeningDef[];
  // Локальная книга нужна для разрешения линий и имён дебютов; внешний источник
  // (live Lichess + оффлайн-фолбэк) даёт ходы и W/D/L. Поднимаем книгу из заранее
  // подсчитанных карт — построение из ~3.7k линий блокировало бы старт на ~850 мс.
  const book = OpeningBook.fromPrecomputed(openingBookData);
  const source = useOpeningSourceService().openingSource();
  // Кандидаты приходят без ECO; помечаем их кодом дебюта, в который ход транспонирует, по name → ECO.
  const ecoByName = new Map(catalog.map((d) => [d.name, d.eco]));

  const line = shallowRef<readonly LineStep[]>([]);
  const ply = ref(0);
  const selectedName = ref('');
  const selectedEco = ref('');
  const flipped = ref(false);
  const sort = ref<OpeningsSort>(OPENINGS_SORTS.popular);
  const minGames = ref(OPENINGS_MIN_GAMES_DEFAULT);

  const currentFen = computed(() => {
    if (ply.value === 0) return OPENINGS_START_FEN;
    return line.value[ply.value - 1]?.fen ?? OPENINGS_START_FEN;
  });

  const boardMoves = computed(() =>
    line.value.slice(0, ply.value).map((m) => m.uci),
  );

  const currentLineSan = computed(() =>
    line.value.slice(0, ply.value).map((m) => m.san).join(' '),
  );

  const rawResponses = ref<readonly BookMove[]>([]);
  const responsesLoading = ref(false);
  let responsesSeq = 0;

  watch(
    currentFen,
    (fen) => {
      const seq = ++responsesSeq;
      responsesLoading.value = true;
      void source
        .movesAt(fen)
        .then((moves) => {
          if (seq === responsesSeq) rawResponses.value = moves;
        })
        .finally(() => {
          if (seq === responsesSeq) responsesLoading.value = false;
        });
    },
    { immediate: true },
  );

  // Накладываем curated-книгу поверх масс-стат: UI отличает канонические продолжения
  // от просто частых, а также показывает, в какой дебют ход транспонирует.
  const enriched = computed<readonly ExplorerRow[]>(() => {
    const fen = currentFen.value;
    const bookUcis = new Set(book.movesAt(fen).map((m) => m.uci));
    const total = rawResponses.value.reduce((sum, m) => sum + (m.games ?? 0), 0);
    return rawResponses.value.map((m) => {
      let afterFen: string | undefined;
      let nameKey: string | undefined;
      try {
        afterFen = applyUciMove(fen, m.uci);
        nameKey = book.nameAt(afterFen) || undefined;
      } catch {
        afterFen = undefined;
        nameKey = undefined;
      }
      const eco = nameKey ? ecoByName.get(nameKey) : undefined;
      return {
        ...m,
        main: bookUcis.has(m.uci),
        freqPct: total > 0 ? ((m.games ?? 0) / total) * 100 : 0,
        ...(afterFen ? { afterFen } : {}),
        ...(nameKey ? { nameKey } : {}),
        ...(eco ? { eco } : {}),
      };
    });
  });

  const positionSummary = computed<PositionSummary | null>(() =>
    aggregateSummary(enriched.value),
  );
  const gamesTotal = computed(() => positionSummary.value?.games ?? 0);
  const maxGames = computed(() =>
    enriched.value.reduce((max, m) => Math.max(max, m.games ?? 0), 0),
  );

  const visibleResponses = computed<readonly ExplorerRow[]>(() => {
    const filtered = enriched.value.filter((m) => (m.games ?? 0) >= minGames.value);
    return sortRows(filtered, sort.value, sideToMove.value);
  });

  const breadcrumbs = computed<Breadcrumb[]>(() => {
    const out: Breadcrumb[] = [];
    const moves = line.value.slice(0, ply.value);
    for (let i = 0; i < moves.length; i += 2) {
      out.push({
        number: i / 2 + 1,
        white: moves[i]?.san ?? '',
        black: moves[i + 1]?.san ?? '',
      });
    }
    return out;
  });

  const sideToMove = computed(() => fenSide(currentFen.value));
  const movePrefix = computed(() => {
    const full = fenFullmove(currentFen.value);
    return sideToMove.value === 'white' ? `${String(full)}.` : `${String(full)}...`;
  });

  const openingTitleKey = computed(() => book.nameAt(currentFen.value) || selectedName.value);
  const openingEco = computed(() => {
    const key = book.nameAt(currentFen.value);
    const derived = (key ? ecoByName.get(key) : undefined) ?? selectedEco.value;
    if (derived) return derived;
    return ply.value === 0 ? OPENINGS_START_ECO : '';
  });

  const canBack = computed(() => ply.value > 0);
  const canForward = computed(() => ply.value < line.value.length);

  function selectOpening(def: OpeningDef): void {
    const steps = book.resolveLine(def.moves);
    line.value = steps;
    ply.value = steps.length;
    selectedName.value = def.name;
    selectedEco.value = def.eco ?? '';
  }

  function playMove(uci: string, san: string): void {
    let fen: string;
    try {
      fen = applyUciMove(currentFen.value, uci);
    } catch {
      return;
    }
    // С доски SAN приходит пустым (там только UCI), поэтому подтягиваем SAN из книги, иначе оставляем UCI.
    const known = enriched.value.find((r) => r.uci === uci)?.san;
    const resolvedSan = san !== '' ? san : (known ?? uci);
    const trimmed = line.value.slice(0, ply.value);
    line.value = [...trimmed, { uci, san: resolvedSan, fen }];
    ply.value = line.value.length;
  }

  function goBack(): void {
    if (canBack.value) ply.value -= 1;
  }
  function goForward(): void {
    if (canForward.value) ply.value += 1;
  }
  function goToPly(n: number): void {
    ply.value = Math.max(0, Math.min(n, line.value.length));
  }
  function toggleFlip(): void {
    flipped.value = !flipped.value;
  }

  function train(): void {
    const name = openingTitleKey.value;
    void router.push({
      name: 'lobby',
      params: { mode: 'opening_training' },
      query: {
        fen: currentFen.value,
        ...(name ? { name } : {}),
        ...(openingEco.value ? { eco: openingEco.value } : {}),
      },
    });
  }

  return {
    catalog,
    selectedName,
    currentFen,
    boardMoves,
    currentLineSan,
    visibleResponses,
    responsesLoading,
    positionSummary,
    gamesTotal,
    maxGames,
    sort,
    minGames,
    breadcrumbs,
    sideToMove,
    movePrefix,
    flipped,
    openingTitleKey,
    openingEco,
    canBack,
    canForward,
    ply,
    selectOpening,
    playMove,
    goBack,
    goForward,
    goToPly,
    toggleFlip,
    train,
  };
}
