/** Runtime-assertions с типобезопасным сужением. Альтернатива `!` и `as T` с понятным stack trace. */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new AssertionError(message);
}

export function assertDefined<T>(value: T | null | undefined, name = 'value'): T {
  if (value === null || value === undefined) {
    throw new AssertionError(`Expected ${name} to be defined`);
  }
  return value;
}

/** Безопасный доступ по индексу — замена `arr[i]!` под `noUncheckedIndexedAccess`. */
export function mustGet<T>(arr: readonly T[], index: number, hint?: string): T {
  const v = arr[index];
  if (v === undefined) {
    throw new AssertionError(
      `Index ${index} out of bounds (length ${arr.length})${hint ? ` — ${hint}` : ''}`,
    );
  }
  return v;
}

/** Безопасный доступ к записи — замена `record[k]!`. */
export function mustGetKey<T>(record: Readonly<Record<string, T>>, key: string, hint?: string): T {
  const v = record[key];
  if (v === undefined) {
    throw new AssertionError(
      `Key "${key}" missing${hint ? ` — ${hint}` : ''}`,
    );
  }
  return v;
}
