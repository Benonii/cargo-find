import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpIcon } from 'lucide-react';
import { Fragment, type FormEvent, type KeyboardEvent, useRef, useState } from 'react';
import { readPlan, readStatus, startPlan } from '@/api';
import { AgentPanel } from '@/components/agent-panel';
import { LoadingState } from '@/components/beautiful/loading-state';
import { SearchChips } from '@/components/beautiful/search-chips';
import { WorkflowSteps } from '@/components/beautiful/workflow-steps';
import { Frame } from '@/components/frame';
import { Hero } from '@/components/hero';
import { Button } from '@/components/ui/button';
import { useSuggestionCycle } from '@/hooks/use-suggestion-cycle';
import type { PlanMode, PlanRun } from '@/types';

const suggestions = [
  'Find new leads and update them in my HubSpot',
  'When a champion changes jobs, alert my team in Slack',
  'Turn my GitHub stargazers into accounts in Salesforce',
  'Enrich new signups with company data and score them',
  'Find the work email for a list of LinkedIn profiles'
];

const columns: { mode: PlanMode; title: string; detail: string }[] = [
  { mode: 'withFinder', title: 'With cargo-find', detail: 'Cargo AI, connected to the cargo-find MCP server' },
  { mode: 'alone', title: 'Without it', detail: 'Same model and prompt, guessing from memory' }
];

const ScoreLine = ({ run }: { run: PlanRun }) => {
  const allReal = run.steps.length > 0 && run.realSteps === run.steps.length;
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-semibold tabular-nums ${allReal ? 'text-green' : 'text-red'}`}>
        {run.realSteps}/{run.steps.length}
      </span>
      <span className="text-[13px] text-ink-2">tools exist in Cargo</span>
    </div>
  );
};

const RunColumn = ({ uuid, mode, title, detail }: { uuid: string; mode: PlanMode; title: string; detail: string }) => {
  const run = useQuery({
    queryKey: ['plan', uuid],
    queryFn: ({ signal }) => readPlan(uuid, signal),
    refetchInterval: (query) => (query.state.data?.state === 'running' || !query.state.data ? 1500 : false)
  });
  const data = run.data;
  const running = !data || data.state === 'running';
  const withFinder = mode === 'withFinder';

  return (
    <Frame overhang="large" className="min-w-0">
      <section className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <header className="flex flex-col gap-0.5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <span aria-hidden className={`size-2 ${withFinder ? 'bg-brand' : 'bg-ink-3'}`} />
            {title}
          </h3>
          <p className="text-[12.5px] text-ink-2">{detail}</p>
        </header>
        {data ? <SearchChips searches={data.searches} /> : null}
        {running ? <LoadingState label={withFinder ? 'Searching Cargo tools' : 'Recalling tools'} /> : null}
        {run.isError ? <p className="text-sm text-red">{run.error.message}</p> : null}
        {data?.state === 'failed' ? <p className="text-sm text-red">{data.error ?? 'The agent run failed.'}</p> : null}
        {data?.state === 'done' ? (
          <>
            <ScoreLine run={data} />
            <WorkflowSteps steps={data.steps} />
            <p className="text-[12px] text-ink-3">
              {data.model}, {data.credits} Cargo credits
            </p>
          </>
        ) : null}
      </section>
    </Frame>
  );
};

const GhostSuggestion = ({ text, leaving, onPick }: { text: string; leaving: boolean; onPick: () => void }) => (
  <button
    type="button"
    onClick={onPick}
    className="absolute top-0 left-0 max-w-[calc(100%-1rem)] px-4 pt-4 text-left text-[15px] leading-6 text-ink-3 hover:text-ink-2"
    style={{ animation: leaving ? 'ghost-out 320ms cubic-bezier(0.4,0,1,1) both' : undefined }}
  >
    <span>
      {text.split(' ').map((word, position) => (
        <Fragment key={`${text}:${position}`}>
          {position === 0 ? null : ' '}
          <span
            className="inline-block"
            style={{ animation: `ghost-in 420ms cubic-bezier(0.23,1,0.32,1) ${position * 45}ms both` }}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </span>
    <kbd className="ml-2 hidden rounded border align-[1px] border-line-strong px-1.5 py-px font-mono text-[10.5px] text-ink-3 sm:inline">
      Tab
    </kbd>
  </button>
);

export const PlanComposer = ({ onSubmit, pending }: { onSubmit: (goal: string) => void; pending: boolean }) => {
  const [goal, setGoal] = useState('');
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const empty = goal.length === 0;
  const cycle = useSuggestionCycle(suggestions.length, hovering || !empty);
  const status = useQuery({ queryKey: ['status'], queryFn: ({ signal }) => readStatus(signal), staleTime: 30_000 });
  const ready = goal.trim().length >= 8 && !pending;
  const suggestion = suggestions[cycle.index] ?? suggestions[0];

  const pick = () => {
    setGoal(suggestion);
    inputRef.current?.focus();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) {
      onSubmit(goal.trim());
    }
  };

  const handleKeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && !event.shiftKey && empty) {
      event.preventDefault();
      setGoal(suggestion);
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (ready) {
        onSubmit(goal.trim());
      }
    }
  };

  return (
    <form
      onSubmit={submit}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className="flex w-full flex-col rounded-2xl border border-line-strong bg-surface shadow-card transition-colors focus-within:border-ink-3"
    >
      <div className="relative">
        <label htmlFor="plan-goal" className="sr-only">
          What should your agent do?
        </label>
        <textarea
          ref={inputRef}
          id="plan-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          onKeyDown={handleKeys}
          maxLength={300}
          rows={2}
          autoComplete="off"
          className="block min-h-20 w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-6 text-ink outline-none sm:min-h-16 sm:[field-sizing:content]"
        />
        {empty ? (
          <GhostSuggestion key={cycle.index} text={suggestion} leaving={cycle.leaving} onPick={pick} />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <p className="min-w-0 text-[11.5px] text-ink-3">
          {status.data && status.data.liveRunsPerDay > 0
            ? `Runs on Cargo AI. ${status.data.liveRunsLeftToday} of ${status.data.liveRunsPerDay} free runs left today.`
            : 'Runs on Cargo AI.'}
        </p>
        <Button
          type="submit"
          size="icon"
          disabled={!ready}
          aria-label="Plan the workflow"
          className="size-8 shrink-0 rounded-full sm:size-8"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  );
};

export const TrySection = () => {
  const queryClient = useQueryClient();
  const plan = useMutation({
    mutationFn: startPlan,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['status'] })
  });

  return (
    <div className="flex flex-col gap-10">
      <Hero composer={<PlanComposer onSubmit={(goal) => plan.mutate(goal)} pending={plan.isPending} />} />
      {plan.isError ? <p className="text-center text-sm text-red">{plan.error.message}</p> : null}
      {plan.data ? (
        <div className="flex flex-col gap-4">
          <p className="text-center text-[13px] text-ink-2">
            Cargo's own AI planned "{plan.data.goal}" with and without cargo-find
          </p>
          <div className="grid gap-6 md:grid-cols-2 md:gap-0 md:[&>*+*]:-ml-px">
            {columns.map((column) => (
              <RunColumn
                key={plan.data.runs[column.mode]}
                uuid={plan.data.runs[column.mode]}
                mode={column.mode}
                title={column.title}
                detail={column.detail}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <p className="text-center text-[12.5px] font-medium text-ink-2">Connect your agent</p>
        <AgentPanel />
      </div>
    </div>
  );
};
