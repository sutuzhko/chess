/** Trailing-edge debounce без зависимостей: финальный вызов через `delay` мс после последнего обращения. */
export function debounce<TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (handle !== null) clearTimeout(handle);
    handle = setTimeout(() => {
      handle = null;
      fn(...args);
    }, delay);
  };
}
