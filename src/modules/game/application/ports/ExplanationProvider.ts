/**
 * Дизайн-хук под объяснения ходов ИИ.
 *
 * Реализация отложена (см. план фазы 5). Этот файл фиксирует контракт,
 * чтобы UI-слой мог рендерить «summary + tags + score/mateIn/pv» по типу,
 * а конкретная реализация (эвристики, аннотированный PV, LLM или гибрид)
 * подключалась позже без изменений в потребителях.
 *
 * Варианты реализации (ранжированы по применимости в оффлайн-приложении):
 *  1) Эвристики на данных движка: eval-swing лучший↔2-й, тип хода (взятие/шах/мат/
 *     превращение/вилка/связка), материальный баланс, угроза 2-м ходом PV.
 *     Признаки → шаблоны (i18n). Требует доработки воркера: AnalysisResult должен
 *     дополнительно отдавать `rootMoves: {uci, score}[]`.
 *  2) Аннотированный PV: показывать вариант с пошаговой оценкой и глифами (±, +−, #).
 *  3) Внешний LLM по API: FEN + PV + score → естественный язык. Ломает оффлайн.
 *  4) Гибрид: эвристики дают структурированный Explanation, сейчас рендерим
 *     шаблонами, позже — тем же объектом кормим LLM.
 */

export interface ExplanationInput {
  /** FEN позиции, в которой движок выбирает ход. */
  readonly fen: string;
  /** UCI выбранного хода (как правило bestMove из анализа). */
  readonly chosenUci: string;
  /** Сырые данные движка. */
  readonly analysis: {
    readonly pv: readonly string[];
    readonly scoreCp: number;
    readonly mateIn: number | null;
    readonly depth: number;
    /**
     * Опционально — оценки альтернативных кандидатов из корня. Нужны для
     * сравнения «лучший↔2-й» (требует расширения протокола воркера).
     */
    readonly rootMoves?: readonly { readonly uci: string; readonly score: number }[];
  };
}

/** Структурированное объяснение хода. UI рендерит summary + tags + raw eval. */
export interface Explanation {
  /** Короткое человекочитаемое объяснение (1–2 предложения). */
  readonly summary: string;
  /**
   * Машинные теги мотивов: 'capture' | 'check' | 'mate' | 'promotion' | 'fork' |
   * 'pin' | 'discovered-attack' | 'sacrifice' | 'unique' (eval gap) | 'positional' | ...
   * Точный словарь — за реализацией; UI может рендерить чипы по этим ключам.
   */
  readonly tags: readonly string[];
  /** Оценка из движка (передаём как есть для отображения). */
  readonly scoreCp: number;
  /** Мат за N ходов, если найден. */
  readonly mateIn: number | null;
  /** PV для аннотированного отображения. */
  readonly pv: readonly string[];
}

export interface ExplanationProvider {
  /** Синхронный или асинхронный — реализация решает. */
  explain(input: ExplanationInput): Explanation | Promise<Explanation>;
}
