export const PUZZLE_THEMES = [
  { id: 'best-move', label: 'Лучший ход' },
  { id: 'mate-in-1', label: 'Мат в 1' },
  { id: 'mate-in-2', label: 'Мат в 2' },
  { id: 'mate-in-3', label: 'Мат в 3' },
  { id: 'fork', label: 'Вилка' },
  { id: 'pin', label: 'Связка' },
  { id: 'discovered-attack', label: 'Открытый шах' },
  { id: 'double-attack', label: 'Двойной удар' },
  { id: 'back-rank', label: 'Задняя горизонталь' },
  { id: 'promotion', label: 'Превращение' },
  { id: 'sacrifice', label: 'Жертва' },
  { id: 'king-attack', label: 'Атака на короля' },
  { id: 'endgame', label: 'Эндшпиль' },
  { id: 'opening', label: 'Дебют' },
  { id: 'middlegame', label: 'Миттельшпиль' },
  { id: 'tactics', label: 'Тактика' },
  { id: 'opposition', label: 'Оппозиция' },
] as const;

export type PuzzleThemeId = (typeof PUZZLE_THEMES)[number]['id'];

export function themeLabel(id: string): string {
  return PUZZLE_THEMES.find((t) => t.id === id)?.label ?? id;
}
