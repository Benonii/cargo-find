import report from '../../../bench/results.json';
import type { BenchmarkReport, EngineOutcome } from '@/types';

const benchmark = report as BenchmarkReport;

const rankLabel = (outcome: EngineOutcome): string => {
  if (outcome.results.length === 0) {
    return 'no results';
  }
  return outcome.rank === null ? 'missed' : `rank ${outcome.rank}`;
};

const percent = (value: number) => `${Math.round((value / benchmark.total) * 100)}%`;

export const BenchmarkPanel = () => (
  <section className="flex flex-col gap-4">
    <h2 className="text-lg font-semibold">Benchmark</h2>
    <p className="text-sm text-muted-foreground">
      {benchmark.total} GTM jobs written the way people and agents ask for them. Each has a list of acceptable answers.
      Cargo's own search is the cargo-ai CLI ({benchmark.cliVersion}) action list, which needs every word to match.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-2 font-medium">Search</th>
            <th className="p-2 font-medium">Right at rank 1</th>
            <th className="p-2 font-medium">Right in top 5</th>
            <th className="p-2 font-medium">No results</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-2">Cargo action search</td>
            <td className="p-2">{percent(benchmark.cargo.top1)}</td>
            <td className="p-2">{percent(benchmark.cargo.top5)}</td>
            <td className="p-2">{percent(benchmark.cargo.empty)}</td>
          </tr>
          <tr className="border-t font-medium">
            <td className="p-2">cargo-find</td>
            <td className="p-2">{percent(benchmark.cargoFind.top1)}</td>
            <td className="p-2">{percent(benchmark.cargoFind.top5)}</td>
            <td className="p-2">{percent(benchmark.cargoFind.empty)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <ol className="flex flex-col divide-y border text-sm">
      {benchmark.rows.map((row) => (
        <li key={row.query} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{row.query}</span>
          <span className="flex gap-3 font-mono text-xs text-muted-foreground">
            <span>Cargo: {rankLabel(row.cargo)}</span>
            <span className={row.cargoFind.rank === 1 ? 'text-foreground' : undefined}>
              cargo-find: {rankLabel(row.cargoFind)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  </section>
);
