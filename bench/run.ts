import { readFileSync, writeFileSync } from 'node:fs';
import { loadFinder } from '../packages/core/src/node';
import type { BenchmarkQuery, BenchmarkReport, BenchmarkRow, EngineOutcome, EngineSummary } from './types';

type ListedAction = { action: Record<string, string> };

const identifierFor = (action: Record<string, string>): string => {
  if (action.kind === 'connector') {
    return `${action.integrationSlug}.${action.actionSlug}`;
  }
  if (action.kind === 'tool') {
    return `tool.${action.templateSlug ?? action.toolUuid}`;
  }
  if (action.kind === 'native') {
    return `native.${action.actionSlug}`;
  }
  return `${action.kind}.${action.agentUuid ?? 'unknown'}`;
};

const cargoSearch = (query: string): string[] => {
  const result = Bun.spawnSync(['cargo-ai', 'orchestration', 'action', 'list', ...query.split(/\s+/), '--limit', '5'], {
    stdout: 'pipe',
    stderr: 'pipe'
  });
  const parsed = JSON.parse(result.stdout.toString()) as { results: ListedAction[] };
  return parsed.results.map((item) => identifierFor(item.action));
};

const outcome = (results: string[], expected: string[]): EngineOutcome => {
  const position = results.findIndex((identifier) => expected.includes(identifier));
  return { results, rank: position === -1 ? null : position + 1 };
};

const summarize = (outcomes: EngineOutcome[]): EngineSummary => ({
  top1: outcomes.filter((item) => item.rank === 1).length,
  top5: outcomes.filter((item) => item.rank !== null && item.rank <= 5).length,
  empty: outcomes.filter((item) => item.results.length === 0).length
});

const setName = process.argv[2] ?? 'queries';
const outputName = setName === 'queries' ? 'results' : `${setName}-results`;
const queries = JSON.parse(readFileSync(`bench/${setName}.json`, 'utf8')) as BenchmarkQuery[];
const finder = loadFinder();
const rows: BenchmarkRow[] = [];

for (const item of queries) {
  const ours = finder.search(item.query, { limit: 5 });
  const ourOutcome = outcome(
    ours.map((result) => result.entry.id),
    item.expected
  );
  rows.push({
    query: item.query,
    expected: item.expected,
    cargo: outcome(cargoSearch(item.query), item.expected),
    cargoFind: { ...ourOutcome, tier: ourOutcome.rank ? ours[ourOutcome.rank - 1].tier : null }
  });
}

const report: BenchmarkReport = {
  generatedAt: new Date().toISOString(),
  cliVersion: finder.catalog.cliVersion,
  total: rows.length,
  cargo: summarize(rows.map((row) => row.cargo)),
  cargoFind: summarize(rows.map((row) => row.cargoFind)),
  rows
};

writeFileSync(`bench/${outputName}.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Queries: ${report.total}`);
console.log(`Cargo search   top-1 ${report.cargo.top1}  top-5 ${report.cargo.top5}  empty ${report.cargo.empty}`);
console.log(`cargo-find     top-1 ${report.cargoFind.top1}  top-5 ${report.cargoFind.top5}  empty ${report.cargoFind.empty}`);
for (const row of rows.filter((item) => item.cargoFind.rank !== 1)) {
  console.log(`  miss@1: ${row.query} -> ${row.cargoFind.results.slice(0, 3).join(', ')}`);
}
