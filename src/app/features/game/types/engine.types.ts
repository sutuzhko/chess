export interface EngineData {
  depth: number;
  score: number;
  bestMoveUci: string | null;
  nodes: number;
  elapsedMs: number;
}
