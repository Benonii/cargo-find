import { CopyButton } from '@/components/copy-button';
import type { ActionResult, MatchTier } from '@/types';

const tierLabels: Record<MatchTier, string> = {
  exact: 'Exact name',
  name: 'Named integration',
  keyword: 'Keywords',
  semantic: 'Meaning'
};

type ResultCardProps = {
  result: ActionResult;
  position: number;
};

export const ResultCard = ({ result, position }: ResultCardProps) => (
  <li
    className="flex flex-col gap-2 rounded-card bg-surface p-3 shadow-card"
    style={{ animation: `fade-up 300ms cubic-bezier(0.23,1,0.32,1) ${position * 40}ms both` }}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-[14px] font-medium text-ink">
          {result.name}
          {result.integration ? <span className="font-normal text-ink-2"> in {result.integration}</span> : null}
        </span>
        <code className="truncate font-mono text-[11.5px] text-ink-2">{result.id}</code>
      </div>
      <span
        className={`inline-flex h-5.5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium ${
          result.matchedOn === 'exact' || result.matchedOn === 'name'
            ? 'bg-green-tint text-green'
            : 'bg-inset text-ink-2'
        }`}
      >
        {tierLabels[result.matchedOn]}
      </span>
    </div>
    {result.description ? <p className="text-[12.5px] text-ink-2">{result.description}</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-[11.5px] text-ink-3">
        {result.kind}, {result.price}
      </span>
      {result.usage ? (
        <CopyButton value={result.usage} label={result.kind === 'extractor' ? 'Copy model' : 'Copy dry run'} />
      ) : null}
    </div>
  </li>
);
