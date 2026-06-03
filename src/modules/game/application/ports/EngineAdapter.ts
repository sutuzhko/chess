export interface AnalysisRequest {
  readonly fen: string;
  readonly maxDepth?: number;
  readonly maxTimeMs?: number;
  readonly multiPV?: number;
  readonly temperature?: number;
  readonly noiseCP?: number;
  readonly blunderProb?: number;
  /** Consult the opening book before searching. Defaults to true. */
  readonly useOpeningBook?: boolean;
}

export interface AnalysisProgress {
  readonly depth: number;
  readonly score: number;
  readonly bestMoveUci: string | null;
  readonly nodes: number;
  readonly pv: readonly string[];
  readonly elapsedMs: number;
}

export interface AnalysisResult extends AnalysisProgress {
  readonly bestMoveUci: string;
}

export interface EngineAdapter {
  analyze(
    request: AnalysisRequest,
    onProgress?: (info: AnalysisProgress) => void,
  ): Promise<AnalysisResult>;
  cancel(): void;
}
