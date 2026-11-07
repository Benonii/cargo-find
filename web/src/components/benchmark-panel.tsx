import { useState } from 'react';
import holdoutReport from '../../../bench/holdout-results.json';
import tuningReport from '../../../bench/results.json';
import { DitherBackground } from '@/components/dither-background';
import { Frame } from '@/components/frame';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@/components/ui/accordion';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import type { BenchmarkReport, EngineOutcome } from '@/types';

type SetName = 'holdout' | 'tuning';

const reports: Record<SetName, { report: BenchmarkReport; label: string; note: string }> = {
  holdout: {
    report: holdoutReport as BenchmarkReport,
    label: 'Held-out',
    note: 'Questions and answers were written before anything ran, and the ranking was not changed after.'
  },
  tuning: {
    report: tuningReport as BenchmarkReport,
    label: 'Tuning set',
    note: 'The ranking was tuned on these questions, so treat this as a best case.'
  }
};

const rankLabel = (outcome: EngineOutcome): string => {
  if (outcome.results.length === 0) {
    return 'nothing';
  }
  return outcome.rank === null ? 'missed' : `#${outcome.rank}`;
};

type Bar = { name: string; count: number; color: string };

const BarChart = ({
  title,
  question,
  bars,
  total,
  lowerIsBetter
}: {
  title: string;
  question: string;
  bars: Bar[];
  total: number;
  lowerIsBetter?: boolean;
}) => {
  const [active, setActive] = useState<string | null>(null);
  return (
    <Frame className="min-w-0">
      <figure className="flex h-full flex-col gap-4 p-4">
        <figcaption className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold text-ink">{title}</span>
          <span className="text-[12.5px] text-ink-2">
            {question}
            {lowerIsBetter ? ' Lower is better.' : ''}
          </span>
        </figcaption>
        <div className="relative mt-auto h-48">
          {[0, 50, 100].map((tick) => (
            <div key={tick} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${tick}%` }}>
              <span className="w-8 text-right font-mono text-[10.5px] text-ink-3 tabular-nums">{tick}%</span>
              <span className={`h-px flex-1 ${tick === 0 ? 'bg-line-strong' : 'bg-line'}`} />
            </div>
          ))}
          <div className="absolute inset-y-0 right-2 left-12 flex items-end justify-around gap-4">
            {bars.map((bar) => {
              const value = Math.round((bar.count / total) * 100);
              return (
                <div
                  key={bar.name}
                  className="relative flex h-full w-14 flex-col items-center justify-end"
                  onMouseEnter={() => setActive(bar.name)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(bar.name)}
                  onBlur={() => setActive(null)}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: bars are focusable so the tooltip works by keyboard
                  tabIndex={0}
                  role="img"
                  aria-label={`${bar.name}: ${bar.count} of ${total}, ${value}%`}
                >
                  <span className="mb-1 text-[15px] font-semibold text-ink tabular-nums">{value}%</span>
                  <span
                    className="w-full rounded-t-[4px] transition-[height] duration-700"
                    style={{ height: `${Math.max(value, 0.8)}%`, background: bar.color }}
                  />
                  {active === bar.name ? (
                    <span className="absolute bottom-full z-10 mb-7 border border-line-strong bg-background px-2 py-1 text-[11.5px] whitespace-nowrap text-ink shadow-btn">
                      {bar.name}: {bar.count} of {total}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-around pl-12 text-[11.5px] text-ink-2">
          {bars.map((bar) => (
            <span key={bar.name} className="w-20 text-center">
              {bar.name}
            </span>
          ))}
        </div>
      </figure>
    </Frame>
  );
};

export const BenchmarkPanel = () => {
  const [setName, setSetName] = useState<SetName>('holdout');
  const { report, note } = reports[setName];
  const total = report.total;
  const multiple = report.cargo.top1 > 0 ? (report.cargoFind.top1 / report.cargo.top1).toFixed(1) : null;
  const barsFor = (find: number, cargo: number): Bar[] => [
    { name: 'cargo-find', count: find, color: 'var(--chart-find)' },
    { name: 'Cargo search', count: cargo, color: 'var(--chart-cargo)' }
  ];

  return (
    <div className="relative flex flex-col gap-6">
      <DitherBackground shape="wave" className="-inset-x-6 -top-10 bottom-1/2 opacity-15" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <p className="text-6xl font-bold tracking-tight text-green tabular-nums sm:text-7xl">
          {multiple ? `${multiple}x` : '-'}
        </p>
        <p className="max-w-lg text-[15px] text-ink">
          more right answers on the first try than Cargo's own search, across {total} plain-English requests.
        </p>
        <SegmentedControl size="sm">
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
        <div className="flex items-center gap-4 text-[12px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[2px] bg-chart-find" />
            cargo-find
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[2px] bg-chart-cargo" />
            Cargo's built-in action search
          </span>
        </div>
      </div>
      <div className="relative grid gap-6 md:grid-cols-3 md:gap-0 md:[&>*+*]:-ml-px">
        <BarChart
          title="Right tool first"
          question={`Share of the ${total} requests where the first result was a correct tool.`}
          bars={barsFor(report.cargoFind.top1, report.cargo.top1)}
          total={total}
        />
        <BarChart
          title="Right tool in top 5"
          question={`Share of the ${total} requests with a correct tool anywhere in the first five results.`}
          bars={barsFor(report.cargoFind.top5, report.cargo.top5)}
          total={total}
        />
        <BarChart
          title="No results at all"
          question={`Share of the ${total} requests that returned an empty list.`}
          bars={barsFor(report.cargoFind.empty, report.cargo.empty)}
          total={total}
          lowerIsBetter
        />
      </div>
      <p className="relative text-center text-[12.5px] text-ink-3">
        {note} Cargo's search is the cargo-ai CLI {report.cliVersion} action list, which needs every word to match.
      </p>
      <Frame className="relative">
        <Accordion>
          <AccordionItem value="queries" className="border-none">
            <AccordionTrigger className="px-4 py-2.5 text-[13px] text-ink">
              See every request and where each search ranked the right tool
            </AccordionTrigger>
            <AccordionPanel>
              <ol className="flex flex-col divide-y divide-line px-4 text-[13px]">
                {report.rows.map((row) => (
                  <li
                    key={row.query}
                    className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-ink">{row.query}</span>
                    <span className="flex shrink-0 gap-3 font-mono text-[11.5px]">
                      <span className="text-ink-2">Cargo {rankLabel(row.cargo)}</span>
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
      </Frame>
    </div>
  );
};
