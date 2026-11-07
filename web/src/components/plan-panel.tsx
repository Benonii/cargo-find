import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpIcon } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { readPlan, readStatus, startPlan } from '@/api';
import { LoadingState } from '@/components/beautiful/loading-state';
import { SearchChips } from '@/components/beautiful/search-chips';
import { WorkflowSteps } from '@/components/beautiful/workflow-steps';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { PlanMode, PlanRun } from '@/types';

const examples = [
  'Find new leads and update them in my HubSpot',
  'When a champion changes jobs, find their new work email and alert my team in Slack',
  'Turn my GitHub stargazers into scored accounts in Salesforce',
  'Route new inbound demo requests to reps round robin'
];

const columns: { mode: PlanMode; title: string; detail: string }[] = [
  { mode: 'withFinder', title: 'With cargo-find', detail: 'Cargo AI connected to the cargo-find MCP server' },
  { mode: 'alone', title: 'Without it', detail: 'Same model and prompt, working from memory' }
];

const ScoreLine = ({ run, highlight }: { run: PlanRun; highlight: boolean }) => (
  <div className="flex items-baseline gap-2">
    <span className={`text-3xl font-semibold tabular-nums ${highlight ? 'text-green' : 'text-red'}`}>
      {run.realSteps}/{run.steps.length}
    </span>
    <span className="text-[13px] text-ink-2">actions exist in Cargo</span>
  </div>
);

const RunColumn = ({ uuid, mode, title, detail }: { uuid: string; mode: PlanMode; title: string; detail: string }) => {
  const run = useQuery({
    queryKey: ['plan', uuid],
    queryFn: ({ signal }) => readPlan(uuid, signal),
    refetchInterval: (query) => (query.state.data?.state === 'running' || !query.state.data ? 1500 : false)
  });
  const data = run.data;
  const running = !data || data.state === 'running';
  const highlight = mode === 'withFinder';

  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-card p-4 ${
        highlight ? 'bg-surface shadow-card' : 'bg-inset shadow-hairline'
      }`}
    >
      <header className="flex flex-col gap-0.5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold">
          {highlight ? <span aria-hidden className="size-2 rounded-full bg-brand" /> : null}
          {title}
        </h3>
        <p className="text-[12.5px] text-ink-2">{detail}</p>
      </header>
      {data ? <SearchChips searches={data.searches} /> : null}
      {running ? <LoadingState label={highlight ? 'Searching Cargo actions' : 'Recalling actions'} /> : null}
      {run.isError ? <p className="text-sm text-red">{run.error.message}</p> : null}
      {data?.state === 'failed' ? <p className="text-sm text-red">{data.error ?? 'The agent run failed.'}</p> : null}
      {data?.state === 'done' ? (
        <>
          <ScoreLine run={data} highlight={data.realSteps === data.steps.length && data.steps.length > 0} />
          <WorkflowSteps steps={data.steps} />
          <p className="text-[12px] text-ink-3">
            {data.model}, {data.credits} Cargo credits
          </p>
        </>
      ) : null}
    </section>
  );
};

export const PlanPanel = () => {
  const [goal, setGoal] = useState(examples[0] ?? '');
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ['status'], queryFn: ({ signal }) => readStatus(signal), staleTime: 30_000 });
  const plan = useMutation({
    mutationFn: startPlan,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['status'] })
  });
  const ready = goal.trim().length >= 8 && !plan.isPending;

  const run = () => {
    if (ready) {
      plan.mutate(goal.trim());
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run();
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      run();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-card focus-within:shadow-[0_0_0_2px_var(--brand-glow),var(--shadow-card)]"
      >
        <label htmlFor="plan-goal" className="sr-only">
          Your go-to-market goal
        </label>
        <Textarea
          id="plan-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="Describe what you want done, like find new leads and update them in my HubSpot"
          maxLength={300}
          rows={2}
          className="border-none bg-transparent shadow-none before:hidden [&_textarea]:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[12px] text-ink-3">
            {status.data && status.data.liveRunsPerDay > 0
              ? `${status.data.liveRunsLeftToday} of ${status.data.liveRunsPerDay} live runs left today`
              : 'Runs on Cargo AI'}
          </span>
          <Button type="submit" disabled={!ready} className="rounded-full">
            {plan.isPending ? 'Starting' : 'Plan workflow'}
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoal(example)}
            className="max-w-full rounded-full bg-surface px-3 py-1.5 text-left text-[12.5px] text-ink-2 shadow-btn transition-colors hover:bg-hover-2 hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>
      {plan.isError ? <p className="text-sm text-red">{plan.error.message}</p> : null}
      {plan.data ? (
        <div className="grid gap-3 md:grid-cols-2">
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
      ) : null}
    </div>
  );
};
