import { useMutation, useQuery } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { readPlan, startPlan } from '@/api';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { PlanMode, PlanRun, PlanStep } from '@/types';

const examples = [
  'I want to automatically find leads and update them in my HubSpot',
  'When a champion changes jobs, find their new work email and alert my team in Slack',
  'Turn my GitHub stargazers into scored accounts in Salesforce',
  'Route new inbound demo requests to reps round robin'
];

const columns: { mode: PlanMode; title: string; detail: string }[] = [
  {
    mode: 'withFinder',
    title: 'Cargo AI with cargo-find',
    detail: 'Same model, connected to the cargo-find MCP server.'
  },
  {
    mode: 'alone',
    title: 'Cargo AI alone',
    detail: 'Same model and prompt, no tools. It has to remember the actions.'
  }
];

const StepItem = ({ step, position }: { step: PlanStep; position: number }) => (
  <li className="flex flex-col gap-2 border bg-card p-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <span className="font-medium">
        {position}. {step.title}
      </span>
      <Badge variant={step.real ? 'secondary' : 'outline'}>
        {step.real ? 'Real action' : 'Not in Cargo'}
      </Badge>
    </div>
    <code className={`font-mono text-xs break-all ${step.real ? '' : 'text-muted-foreground line-through'}`}>
      {step.actionId}
    </code>
    {step.entry ? (
      <p className="text-xs text-muted-foreground">
        {step.entry.name}
        {step.entry.integration ? ` in ${step.entry.integration}` : ''}. {step.entry.description.replace(/\.$/, '')}. Cost:{' '}
        {step.entry.price}.
      </p>
    ) : null}
    <p className="text-sm">{step.why}</p>
    {step.entry?.usage ? (
      <div className="flex justify-end">
        <CopyButton
          value={step.entry.usage}
          label={step.entry.kind === 'extractor' ? 'Copy model' : 'Copy dry run'}
        />
      </div>
    ) : null}
  </li>
);

const scoreLine = (run: PlanRun): string =>
  run.steps.length === 0
    ? 'No steps returned.'
    : `${run.realSteps} of ${run.steps.length} actions exist in Cargo.`;

const RunColumn = ({ uuid, title, detail }: { uuid: string; title: string; detail: string }) => {
  const run = useQuery({
    queryKey: ['plan', uuid],
    queryFn: ({ signal }) => readPlan(uuid, signal),
    refetchInterval: (query) => (query.state.data?.state === 'running' || !query.state.data ? 1500 : false)
  });
  const data = run.data;
  const running = !data || data.state === 'running';

  return (
    <section className="flex min-w-0 flex-col gap-3 border p-3">
      <header className="flex flex-col gap-1">
        <h3 className="font-mono text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </header>
      {data && data.searches.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Searched cargo-find for</span>
          <ul className="flex flex-wrap gap-1">
            {[...new Set(data.searches)].map((search) => (
              <li key={search}>
                <Badge variant="outline">{search}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {running ? (
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          <Spinner className="size-3" /> Planning the workflow
        </p>
      ) : null}
      {run.isError ? <p className="text-sm">{run.error.message}</p> : null}
      {data?.state === 'failed' ? <p className="text-sm">{data.error ?? 'The agent run failed.'}</p> : null}
      {data?.state === 'done' ? (
        <>
          <p className="text-sm font-medium" aria-live="polite">
            {scoreLine(data)}
          </p>
          <ol className="flex flex-col gap-2">
            {data.steps.map((step, index) => (
              <StepItem key={`${step.title}:${step.actionId}`} step={step} position={index + 1} />
            ))}
          </ol>
          {data.summary ? <p className="text-xs text-muted-foreground">{data.summary}</p> : null}
          <p className="text-xs text-muted-foreground">
            {data.model}, {data.credits} Cargo credits.
          </p>
        </>
      ) : null}
    </section>
  );
};

export const PlanPanel = () => {
  const [goal, setGoal] = useState(examples[0] ?? '');
  const plan = useMutation({ mutationFn: startPlan });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (goal.trim().length > 0 && !plan.isPending) {
      plan.mutate(goal.trim());
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm">
        Describe a go-to-market goal. Cargo's own AI agent plans the workflow twice: once with the cargo-find
        MCP server, once from memory. Every action id it picks is checked against the real Cargo catalog.
      </p>
      <form className="flex flex-col gap-2" onSubmit={submit}>
        <label htmlFor="plan-goal" className="text-sm font-medium">
          Your goal
        </label>
        <div>
          <Input
            id="plan-goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Find leads and update them in my HubSpot"
            size="lg"
            maxLength={300}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={plan.isPending || goal.trim().length < 8}>
            {plan.isPending ? <Spinner className="size-3" /> : null}
            Plan the workflow
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example}
            variant="outline"
            size="xs"
            className="h-auto max-w-full shrink justify-start py-1 text-left whitespace-normal"
            onClick={() => setGoal(example)}
          >
            {example}
          </Button>
        ))}
      </div>
      {plan.isError ? <p className="text-sm">{plan.error.message}</p> : null}
      {plan.data ? (
        <div className="grid gap-3 md:grid-cols-2">
          {columns.map((column) => (
            <RunColumn
              key={`${plan.data.runs[column.mode]}`}
              uuid={plan.data.runs[column.mode]}
              title={column.title}
              detail={column.detail}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};
