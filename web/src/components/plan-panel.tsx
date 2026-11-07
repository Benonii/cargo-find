import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpIcon, ArrowUpLeftIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { readPlan, readStatus, startPlan } from '@/api';
import { LoadingState } from '@/components/beautiful/loading-state';
import { SearchChips } from '@/components/beautiful/search-chips';
import { WorkflowSteps } from '@/components/beautiful/workflow-steps';
import { DitherBackground } from '@/components/dither-background';
import { Frame } from '@/components/frame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PlanMode, PlanRun } from '@/types';

const suggestions = [
  'Find new leads and update them in my HubSpot',
  'When a champion changes jobs, alert my team in Slack',
  'Turn my GitHub stargazers into accounts in Salesforce'
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

export const PlanInput = ({ onSubmit, pending }: { onSubmit: (goal: string) => void; pending: boolean }) => {
  const [goal, setGoal] = useState('');
  const status = useQuery({ queryKey: ['status'], queryFn: ({ signal }) => readStatus(signal), staleTime: 30_000 });
  const ready = goal.trim().length >= 8 && !pending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) {
      onSubmit(goal.trim());
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor="plan-goal" className="sr-only">
          What do you want your agent to do?
        </label>
        <Input
          id="plan-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="What should your agent do?"
          maxLength={300}
          className="rounded-full [&_input]:px-4"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!ready}
          aria-label="Plan the workflow"
          className="size-9 shrink-0 rounded-full sm:size-9"
        >
          <ArrowUpIcon />
        </Button>
      </div>
      {goal.length === 0 ? (
        <ul className="flex flex-col px-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => setGoal(suggestion)}
                className="group flex w-full items-center justify-between gap-3 py-1.5 text-left text-[13px] text-ink-3 hover:text-ink"
              >
                <span className="min-w-0">{suggestion}</span>
                <ArrowUpLeftIcon
                  aria-hidden
                  className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="px-2 text-[11.5px] text-ink-3">
        {status.data && status.data.liveRunsPerDay > 0
          ? `Runs on Cargo AI. ${status.data.liveRunsLeftToday} of ${status.data.liveRunsPerDay} free runs left today.`
          : 'Runs on Cargo AI.'}
      </p>
    </form>
  );
};

export const PlanPanel = () => {
  const queryClient = useQueryClient();
  const plan = useMutation({
    mutationFn: startPlan,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['status'] })
  });

  return (
    <div className="flex flex-col gap-8">
      <PlanInput onSubmit={(goal) => plan.mutate(goal)} pending={plan.isPending} />
      {plan.isError ? <p className="text-center text-sm text-red">{plan.error.message}</p> : null}
      {plan.data ? (
        <div className="relative px-1 py-3 sm:px-3">
          <DitherBackground className="-inset-x-4 -inset-y-10 opacity-25" />
          <p className="relative mb-4 text-center text-[13px] text-ink-2">"{plan.data.goal}"</p>
          <div className="relative grid gap-6 md:grid-cols-2 md:gap-0 md:[&>*+*]:-ml-px">
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
    </div>
  );
};
