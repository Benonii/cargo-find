export type BenchmarkQuery = {
  query: string;
  expected: string[];
};

export type EngineOutcome = {
  results: string[];
  rank: number | null;
};

export type BenchmarkRow = {
  query: string;
  expected: string[];
  cargo: EngineOutcome;
  cargoFind: EngineOutcome & { tier: string | null };
};

export type EngineSummary = {
  top1: number;
  top5: number;
  empty: number;
};

export type BenchmarkReport = {
  generatedAt: string;
  cliVersion: string;
  total: number;
  cargo: EngineSummary;
  cargoFind: EngineSummary;
  rows: BenchmarkRow[];
};
