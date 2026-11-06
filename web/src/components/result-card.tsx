import { Badge } from '@/components/ui/badge';
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
  <li className="flex flex-col gap-3 border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium">
          {position}. {result.name}
          {result.integration ? <span className="text-muted-foreground"> in {result.integration}</span> : null}
        </span>
        <code className="font-mono text-xs break-all text-muted-foreground">{result.id}</code>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant={result.matchedOn === 'semantic' ? 'outline' : 'secondary'}>{tierLabels[result.matchedOn]}</Badge>
        <Badge variant="outline">{result.kind}</Badge>
      </div>
    </div>
    {result.description ? <p className="text-sm">{result.description}</p> : null}
    <p className="text-xs text-muted-foreground">
      Why: {result.reason}. Cost: {result.price}.
    </p>
    {result.usage ? (
      <div className="flex flex-col gap-2 border bg-muted p-3">
        <code className="font-mono text-xs leading-relaxed break-all">{result.usage}</code>
        <div className="flex justify-end">
          <CopyButton value={result.usage} label={result.kind === 'extractor' ? 'Copy model' : 'Copy dry run'} />
        </div>
      </div>
    ) : null}
  </li>
);
