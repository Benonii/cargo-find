import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { searchActions } from '@/api';
import { ResultCard } from '@/components/result-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const examples = [
  'sync accounts to hubspot',
  'find a work email from a linkedin url',
  'github stargazers',
  'alert me when a champion changes jobs',
  'route inbound leads round robin',
  'hubspot.upsertRecords'
];

export const SearchPanel = () => {
  const [query, setQuery] = useState('sync accounts to hubspot');
  const deferredQuery = useDeferredValue(query.trim());
  const search = useQuery({
    queryKey: ['search', deferredQuery],
    queryFn: ({ signal }) => searchActions(deferredQuery, signal),
    enabled: deferredQuery.length > 1,
    placeholderData: keepPreviousData,
    staleTime: 60_000
  });

  return (
    <section className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Describe the job</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="sync accounts to hubspot"
          size="lg"
          type="search"
          aria-label="Describe the job"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button key={example} variant="outline" size="xs" onClick={() => setQuery(example)}>
            {example}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        {search.isFetching ? <Spinner className="size-3" /> : null}
        {search.data
          ? `${search.data.results.length} ${search.data.results.length === 1 ? 'result' : 'results'} for "${search.data.query}"${search.data.semantic ? '' : ' (keyword mode, meaning search still loading)'}`
          : 'Type at least two characters.'}
      </div>
      {search.isError ? <p className="text-sm text-destructive-foreground">{search.error.message}</p> : null}
      {search.data && search.data.results.length === 0 ? (
        <p className="text-sm">No match. Try fewer words, or name the integration.</p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {search.data?.results.map((result, index) => (
          <ResultCard key={result.id} result={result} position={index + 1} />
        ))}
      </ol>
    </section>
  );
};
