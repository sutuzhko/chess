export interface TimeControlOption {
  readonly value: string;
  readonly label: string;
  readonly sub: string;
}

export const TIME_CONTROL_OPTIONS: readonly TimeControlOption[] = [
  { value: '60_0',    label: '1+0',   sub: '1 мин' },
  { value: '180_0',   label: '3+0',   sub: '3 мин' },
  { value: '180_2',   label: '3+2',   sub: '3 мин +2' },
  { value: '300_3',   label: '5+3',   sub: '5 мин +3' },
  { value: '600_0',   label: '10+0',  sub: '10 мин' },
  { value: '900_10',  label: '15+10', sub: '15 мин +10' },
  { value: '1800_0',  label: '30+0',  sub: '30 мин' },
  { value: '0_0',     label: '∞',     sub: 'Без лимита' },
] as const;

export const DEFAULT_TIME_CONTROL = '0_0';

export function parseTimeControl(value: string): { initialSeconds: number; incrementSeconds: number } {
  const [init, inc] = value.split('_').map(Number);
  return { initialSeconds: init ?? 0, incrementSeconds: inc ?? 0 };
}

export function formatTimeControlBadge(value: string): string {
  const [init, inc] = value.split('_').map(Number);
  if (!init) return '∞';
  const mins = Math.floor(init / 60);
  return inc ? `${String(mins)}+${String(inc)}` : `${String(mins)} мин`;
}
