import { useState } from 'react';
import holdoutReport from '../../../bench/holdout-results.json';
import tuningReport from '../../../bench/results.json';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import type { BenchmarkReport, EngineOutcome } from '@/types';

type SetName = 'holdout' | 'tuning';

const reports: Record<SetName, { report: BenchmarkReport; label: string; note: string }> = {
  holdout: {
    report: holdoutReport as BenchmarkReport,
    label: 'Held-out',
    note: 'Questions and answers written before running anything. No ranking changes after.'
  },
  tuning: {
    report: tuningReport as BenchmarkReport,
    label: 'Tuning set',
    note: 'The questions the ranking was tuned on, so read this as a best case.'
  }
};

const percent = (value: number, total: number) => Math.round((value / total) * 100);

const rankLabel = (outcome: EngineOutcome): string => {
  if (outcome.results.length === 0) {
    return 'nothing';
  }
  return outcome.rank === null ? 'missed' : `#${outcome.rank}`;
};

const MetricRow = ({
  title,
  cargo,
  cargoFind,
  lowerIsBetter
}: {
  title: string;
  cargo: number;
  cargoFind: number;
  lowerIsBetter?: boolean;
}) => (
  <div className="flex flex-col gap-2.5">
    <span className="text-[13px] font-medium text-ink-2">{title}</span>
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-x-3 gap-y-2 sm:grid-cols-[7rem_1fr_4.5rem]">
      <span className="text-[12.5px] font-semibold text-ink">cargo-find</span>
      <span className="h-3 overflow-hidden rounded-full bg-inset">
        <span
          className="block h-full rounded-full bg-brand transition-[width] duration-700"
          style={{ width: `${Math.max(cargoFind, 1)}%` }}
        />
      </span>
      <span
        className={`text-right text-2xl font-semibold tabular-nums sm:text-3xl ${lowerIsBetter ? 'text-ink' : 'text-green'}`}
      >
        {cargoFind}%
      </span>
      <span className="text-[12.5px] text-ink-2">Cargo search</span>
      <span className="h-3 overflow-hidden rounded-full bg-inset">
        <span
          className="block h-full rounded-full bg-ink-3 transition-[width] duration-700"
          style={{ width: `${Math.max(cargo, 1)}%` }}
        />
      </span>
      <span className="text-right text-lg font-medium text-ink-2 tabular-nums sm:text-xl">{cargo}%</span>
    </div>
  </div>
);

export const BenchmarkPanel = () => {
  const [setName, setSetName] = useState<SetName>('holdout');
  const { report, note } = reports[setName];
  const total = report.total;
  const firstFind = percent(report.cargoFind.top1, total);
  const firstCargo = percent(report.cargo.top1, total);
  const multiple = report.cargo.top1 > 0 ? (report.cargoFind.top1 / report.cargo.top1).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-surface p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-5xl font-bold tracking-tight text-green tabular-nums sm:text-6xl">
            {multiple ? `${multiple}x` : `${firstFind}%`}
          </p>
          <p className="max-w-md text-[15px] text-ink">
            more questions answered right on the first result than Cargo's built-in search ({firstFind}% vs{' '}
            {firstCargo}%).
          </p>
        </div>
        <SegmentedControl size="sm" className="shrink-0">
          {(Object.keys(reports) as SetName[]).map((name) => (
            <SegmentedControlItem
              key={name}
              data-checked={name === setName ? '' : undefined}
              aria-pressed={name === setName}
              onClick={() => setSetName(name)}
            >
              {reports[name].label} ({reports[name].report.total})
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <MetricRow
          title="Right answer first"
          cargo={percent(report.cargo.top1, total)}
          cargoFind={percent(report.cargoFind.top1, total)}
        />
        <MetricRow
          title="Right answer in top 5"
          cargo={percent(report.cargo.top5, total)}
          cargoFind={percent(report.cargoFind.top5, total)}
        />
        <MetricRow
          title="Returned nothing"
          cargo={percent(report.cargo.empty, total)}
          cargoFind={percent(report.cargoFind.empty, total)}
          lowerIsBetter
        />
      </div>
      <p className="text-[12.5px] text-ink-3">
        {note} Cargo search is the cargo-ai CLI {report.cliVersion} action list, which needs every word to match.
      </p>
      <Accordion>
        <AccordionItem value="queries" className="border-none">
          <AccordionTrigger className="py-1 text-[13px] text-ink-2">See all {total} questions</AccordionTrigger>
          <AccordionPanel>
            <ol className="flex flex-col divide-y divide-line text-[13px]">
              {report.rows.map((row) => (
                <li key={row.query} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-ink">{row.query}</span>
                  <span className="flex shrink-0 gap-3 font-mono text-[11.5px]">
                    <span className="text-ink-3">Cargo {rankLabel(row.cargo)}</span>
                    <span className={row.cargoFind.rank === 1 ? 'text-green' : 'text-ink-2'}>
                      cargo-find {rankLabel(row.cargoFind)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
