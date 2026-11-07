import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { searchActions } from '@/api';
import { ResultCard } from '@/components/result-card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const examples = ['sync accounts to hubspot', 'work email from a linkedin url', 'github stargazers', 'hubspot.upsertRecords'];

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
  const results = search.data?.results.slice(0, 6) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto w-full max-w-xl">
        <label htmlFor="search-query" className="sr-only">
          Search Cargo actions
        </label>
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-ink-3"
        />
        <Input
          id="search-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Cargo actions"
          size="lg"
          type="search"
          className="rounded-full [&_input]:pl-9"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuery(example)}
            className="rounded-full bg-surface px-2.5 py-1 text-[12px] text-ink-2 shadow-btn transition-colors hover:bg-hover-2 hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>
      <div className="flex min-h-5 items-center justify-center gap-2 text-[12px] text-ink-3" aria-live="polite">
        {search.isFetching ? <Spinner className="size-3" /> : null}
        {search.data
          ? `Top ${results.length} of ${search.data.results.length} for "${search.data.query}"${search.data.semantic ? '' : ', meaning search loading'}`
          : 'Type at least two characters.'}
      </div>
      {search.isError ? <p className="text-sm text-red">{search.error.message}</p> : null}
      {search.data && results.length === 0 ? (
        <p className="text-center text-sm text-ink-2">No match. Try fewer words, or name the integration.</p>
      ) : null}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result, index) => (
          <ResultCard key={result.id} result={result} position={index + 1} />
        ))}
      </ol>
    </div>
  );
};
