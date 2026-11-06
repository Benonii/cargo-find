export type MatchTier = 'exact' | 'name' | 'keyword' | 'semantic';

export type ActionResult = {
  id: string;
  kind: string;
  name: string;
  description: string;
  integration?: string;
  matchedOn: MatchTier;
  reason: string;
  price: string;
  requiredInputs: string[];
  usage: string;
};

export type SearchResponse = {
  query: string;
  semantic: boolean;
  results: ActionResult[];
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

export type PlanMode = 'withFinder' | 'alone';

export type PlanStep = {
  title: string;
  actionId: string;
  why: string;
  real: boolean;
  entry?: {
    name: string;
    integration?: string;
    description: string;
    price: string;
    usage: string;
    kind: string;
  };
};

export type PlanRun = {
  mode: PlanMode;
  state: 'running' | 'done' | 'failed';
  error?: string;
  searches: string[];
  summary: string;
  steps: PlanStep[];
  realSteps: number;
  credits: number;
  model: string;
};

export type PlanStart = {
  goal: string;
  runs: Record<PlanMode, string>;
};
