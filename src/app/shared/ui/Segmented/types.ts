export interface SegmentedOption<V = string | number> {
  value: V;
  label: string;
  marker?: string;
  disabled?: boolean;
}
